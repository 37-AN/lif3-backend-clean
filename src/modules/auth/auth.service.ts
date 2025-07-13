import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoggerService } from '../../common/logger/logger.service';
import { User, CreateUserDto, UpdateUserDto, ChangePasswordDto, SafeUser } from './interfaces/user.interface';

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

export interface PasswordChangeDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}


@Injectable()
export class AuthService {
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const startTime = Date.now();
    
    try {
      const user = await this.findUserByEmail(dto.email);
      
      if (!user) {
        await this.logFailedLogin(dto.email, 'USER_NOT_FOUND', ipAddress, userAgent);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.accountLocked) {
        await this.logFailedLogin(dto.email, 'ACCOUNT_LOCKED', ipAddress, userAgent);
        throw new UnauthorizedException('Account is locked. Please contact support.');
      }

      if (!user.isActive) {
        await this.logFailedLogin(dto.email, 'ACCOUNT_INACTIVE', ipAddress, userAgent);
        throw new UnauthorizedException('Account is not active');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      
      if (!isPasswordValid) {
        await this.handleFailedLogin(user, ipAddress, userAgent);
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.resetFailedLoginAttempts(user.id);
      await this.updateLastLogin(user.id);

      const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      this.logger.logSecurityEvent({
        userId: user.id,
        action: 'LOGIN',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        riskLevel: 'LOW',
        metadata: {
          email: user.email,
          rememberMe: dto.rememberMe,
          loginDuration: Date.now() - startTime
        }
      });

      const duration = Date.now() - startTime;
      this.logger.logPerformanceMetric('USER_LOGIN', duration, 'ms', 'AuthService');

      this.logger.log(`User logged in successfully: ${user.email}`, 'AuthService');

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken
      };

    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack, 'AuthService');
      throw error;
    }
  }

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const startTime = Date.now();
    
    try {
      if (dto.password !== dto.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      const existingUser = await this.findUserByEmail(dto.email);
      if (existingUser) {
        this.logger.logSecurityEvent({
          userId: 'unknown',
          action: 'REGISTER',
          ipAddress,
          userAgent,
          timestamp: new Date(),
          riskLevel: 'MEDIUM',
          metadata: {
            email: dto.email,
            error: 'EMAIL_ALREADY_EXISTS'
          }
        });
        throw new BadRequestException('Email already exists');
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);
      
      const user: User = {
        id: 'user_' + Date.now(),
        email: dto.email,
        firstName: dto.name.split(' ')[0] || dto.name,
        lastName: dto.name.split(' ').slice(1).join(' ') || 'User',
        name: dto.name,
        password: passwordHash,
        role: 'USER',
        isActive: true,
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      this.logger.logSecurityEvent({
        userId: user.id,
        action: 'REGISTER',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        riskLevel: 'LOW',
        metadata: {
          email: user.email,
          name: user.name,
          registrationDuration: Date.now() - startTime
        }
      });

      const duration = Date.now() - startTime;
      this.logger.logPerformanceMetric('USER_REGISTRATION', duration, 'ms', 'AuthService');

      this.logger.log(`User registered successfully: ${user.email}`, 'AuthService');

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken
      };

    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack, 'AuthService');
      throw error;
    }
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      this.logger.logSecurityEvent({
        userId,
        action: 'LOGOUT',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        riskLevel: 'LOW',
        metadata: {
          logoutType: 'MANUAL'
        }
      });

      this.logger.log(`User logged out: ${userId}`, 'AuthService');
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack, 'AuthService');
    }
  }

  async changePassword(userId: string, dto: PasswordChangeDto, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const user = await this.findUserById(userId);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        this.logger.logSecurityEvent({
          userId,
          action: 'PASSWORD_CHANGE',
          ipAddress,
          userAgent,
          timestamp: new Date(),
          riskLevel: 'HIGH',
          metadata: {
            error: 'INVALID_CURRENT_PASSWORD'
          }
        });
        throw new UnauthorizedException('Current password is incorrect');
      }

      if (dto.newPassword !== dto.confirmPassword) {
        throw new BadRequestException('New passwords do not match');
      }

      const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
      
      await this.updateUserPassword(userId, newPasswordHash);

      this.logger.logSecurityEvent({
        userId,
        action: 'PASSWORD_CHANGE',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        riskLevel: 'MEDIUM',
        metadata: {
          success: true
        }
      });

      this.logger.log(`Password changed successfully for user: ${userId}`, 'AuthService');
    } catch (error) {
      this.logger.error(`Password change failed: ${error.message}`, error.stack, 'AuthService');
      throw error;
    }
  }

  async enableMFA(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.updateUserMFA(userId, true);

      this.logger.logSecurityEvent({
        userId,
        action: 'MFA_ENABLED',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        riskLevel: 'LOW',
        metadata: {
          mfaEnabled: true
        }
      });

      this.logger.log(`MFA enabled for user: ${userId}`, 'AuthService');
    } catch (error) {
      this.logger.error(`MFA enable failed: ${error.message}`, error.stack, 'AuthService');
      throw error;
    }
  }

  async disableMFA(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.updateUserMFA(userId, false);

      this.logger.logSecurityEvent({
        userId,
        action: 'MFA_DISABLED',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        riskLevel: 'MEDIUM',
        metadata: {
          mfaEnabled: false
        }
      });

      this.logger.log(`MFA disabled for user: ${userId}`, 'AuthService');
    } catch (error) {
      this.logger.error(`MFA disable failed: ${error.message}`, error.stack, 'AuthService');
      throw error;
    }
  }

  private async handleFailedLogin(user: User, ipAddress?: string, userAgent?: string): Promise<void> {
    const newFailedAttempts = user.failedLoginAttempts + 1;
    
    if (newFailedAttempts >= this.maxLoginAttempts) {
      await this.lockAccount(user.id);
      
      this.logger.logSecurityEvent({
        userId: user.id,
        action: 'ACCOUNT_LOCKED',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        riskLevel: 'HIGH',
        metadata: {
          email: user.email,
          failedAttempts: newFailedAttempts,
          lockoutDuration: this.lockoutDuration
        }
      });
    } else {
      await this.incrementFailedLoginAttempts(user.id);
      
      this.logger.logSecurityEvent({
        userId: user.id,
        action: 'FAILED_LOGIN',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        riskLevel: newFailedAttempts >= 3 ? 'HIGH' : 'MEDIUM',
        metadata: {
          email: user.email,
          failedAttempts: newFailedAttempts,
          remainingAttempts: this.maxLoginAttempts - newFailedAttempts
        }
      });
    }
  }

  private async logFailedLogin(email: string, reason: string, ipAddress?: string, userAgent?: string): Promise<void> {
    this.logger.logSecurityEvent({
      userId: 'unknown',
      action: 'FAILED_LOGIN',
      ipAddress,
      userAgent,
      timestamp: new Date(),
      riskLevel: 'HIGH',
      metadata: {
        email,
        reason
      }
    });
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // Mock database methods (replace with actual database calls)
  private async findUserByEmail(email: string): Promise<User | null> {
    if (email === 'ethan@43v3r.ai') {
      return {
        id: 'ethan_barnes',
        email: 'ethan@43v3r.ai',
        firstName: 'Ethan',
        lastName: 'Barnes',
        name: 'Ethan Barnes',
        password: '$2a$12$hash', // This would be a real hash
        role: 'USER',
        isActive: true,
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return null;
  }

  private async findUserById(id: string): Promise<User | null> {
    if (id === 'ethan_barnes') {
      return {
        id: 'ethan_barnes',
        email: 'ethan@43v3r.ai',
        firstName: 'Ethan',
        lastName: 'Barnes',
        name: 'Ethan Barnes',
        password: '$2a$12$hash',
        role: 'USER',
        isActive: true,
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return null;
  }

  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    // Reset failed login attempts in database
  }

  private async updateLastLogin(userId: string): Promise<void> {
    // Update last login timestamp in database
  }

  private async incrementFailedLoginAttempts(userId: string): Promise<void> {
    // Increment failed login attempts in database
  }

  private async lockAccount(userId: string): Promise<void> {
    // Lock user account in database
  }

  private async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    // Update user password in database
  }

  private async updateUserMFA(userId: string, enabled: boolean): Promise<void> {
    // Update user MFA status in database
  }
}