export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  password: string;
  role: 'USER' | 'ADMIN';
  roles?: string[];
  isActive: boolean;
  lastLogin?: Date;
  failedLoginAttempts: number;
  accountLocked: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferences?: {
    currency: 'ZAR' | 'USD';
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  preferences?: Partial<User['preferences']>;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export type SafeUser = Omit<User, 'password'>;