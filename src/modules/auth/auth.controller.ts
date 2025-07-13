import { Controller, Post, Put, Body, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, LoginDto, RegisterDto, PasswordChangeDto } from './auth.service';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';
import { AuditLogGuard } from '../../common/guards/audit-log.guard';
import { LogSecurityEvent } from '../../common/decorators/audit-log.decorator';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseGuards(AuditLogGuard)
  @LogSecurityEvent('User login attempt')
  async login(@Body() dto: LoginDto, @Request() req) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    return await this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Registration failed' })
  @UseGuards(AuditLogGuard)
  @LogSecurityEvent('User registration attempt')
  async register(@Body() dto: RegisterDto, @Request() req) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    return await this.authService.register(dto, ipAddress, userAgent);
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @UseGuards(AuditLogGuard)
  @LogSecurityEvent('User logout')
  @ApiBearerAuth()
  async logout(@Request() req) {
    const userId = req.user?.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    await this.authService.logout(userId, ipAddress, userAgent);
    
    return { message: 'Logout successful' };
  }

  @Put('password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @UseGuards(AuditLogGuard)
  @LogSecurityEvent('Password change attempt')
  @ApiBearerAuth()
  async changePassword(@Body() dto: PasswordChangeDto, @Request() req) {
    const userId = req.user?.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    await this.authService.changePassword(userId, dto, ipAddress, userAgent);
    
    return { message: 'Password changed successfully' };
  }

  @Post('mfa/enable')
  @ApiOperation({ summary: 'Enable multi-factor authentication' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @UseGuards(AuditLogGuard)
  @LogSecurityEvent('MFA enable attempt')
  @ApiBearerAuth()
  async enableMFA(@Request() req) {
    const userId = req.user?.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    await this.authService.enableMFA(userId, ipAddress, userAgent);
    
    return { message: 'MFA enabled successfully' };
  }

  @Post('mfa/disable')
  @ApiOperation({ summary: 'Disable multi-factor authentication' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @UseGuards(AuditLogGuard)
  @LogSecurityEvent('MFA disable attempt')
  @ApiBearerAuth()
  async disableMFA(@Request() req) {
    const userId = req.user?.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    await this.authService.disableMFA(userId, ipAddress, userAgent);
    
    return { message: 'MFA disabled successfully' };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @UseGuards(AuditLogGuard)
  @LogSecurityEvent('Token refresh attempt')
  async refreshToken(@Body() dto: { refreshToken: string }, @Request() req) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    // Implementation would verify refresh token and issue new access token
    // For now, return a mock response
    return {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600
    };
  }
}