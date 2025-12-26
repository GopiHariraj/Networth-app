import { Role } from '@prisma/client';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: Role;
  currency: string;
  isActive: boolean;
  forceChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }

  static fromUser(user: any): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      currency: user.currency,
      isActive: user.isActive,
      forceChangePassword: user.forceChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
