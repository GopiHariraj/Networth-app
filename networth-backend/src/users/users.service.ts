import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async generateResetLink(userId: string) {
    // Generate secure random token
    const token = require('crypto').randomBytes(32).toString('hex');

    // Save to DB
    // Check if user exists in DB first
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // Fallback for mock users? No, they can't have links.
      throw new UnauthorizedException(
        'User not found in database (Mock users cannot be reset via link)',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
        forceChangePassword: true,
      },
    });

    // In a real app, send email. Here, return link.
    // Assuming frontend runs on fortstec.com
    return {
      resetLink: `https://fortstec.com/auth/reset-password?token=${token}`,
      token,
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }



  async deleteUser(userId: string) {
    // Soft delete
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { success: true, message: 'User deleted successfully' };
  }

  async resetPasswordMock(userId: string) {
    // Legacy support for any existing calls, though we should move to DB
    return { success: false, message: 'Mock password reset disabled. Use database reset.' };
  }

  async getAllUsers() {
    const dbUsers = await this.prisma.user.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
    });
    // Map to format expected by FE (name, etc)
    return dbUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.firstName || (u as any).name,
      role: u.role,
      firstName: u.firstName,
    }));
  }



  // ============================================
  // USER MANAGEMENT METHODS FOR SUPER ADMIN
  // ============================================

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => UserResponseDto.fromUser(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    return UserResponseDto.fromUser(user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check for duplicate email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser && !existingUser.isDeleted) {
      throw new BadRequestException('A user with this email already exists');
    }

    // Hash the password
    const hashedPassword = await argon2.hash(createUserDto.password);

    // Create the user
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role,
        currency: createUserDto.currency || 'AED',
        isActive: true,
        isDeleted: false,
        forceChangePassword: true, // New users must change password on first login
      },
    });

    return UserResponseDto.fromUser(newUser);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestingUserId: string,
  ): Promise<UserResponseDto> {
    // Find the user to update
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    // Check for duplicate email if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser && !existingUser.isDeleted) {
        throw new BadRequestException('A user with this email already exists');
      }
    }

    // Update the user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.email && { email: updateUserDto.email }),
        ...(updateUserDto.firstName && { firstName: updateUserDto.firstName }),
        ...(updateUserDto.lastName && { lastName: updateUserDto.lastName }),
        ...(updateUserDto.role && { role: updateUserDto.role }),
        ...(updateUserDto.currency && { currency: updateUserDto.currency }),
        ...(updateUserDto.isActive !== undefined && {
          isActive: updateUserDto.isActive,
        }),
      },
    });

    return UserResponseDto.fromUser(updatedUser);
  }

  async softDelete(
    id: string,
    requestingUserId: string,
  ): Promise<{ message: string }> {
    // Find the user to delete
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    // Prevent self-deletion
    if (id === requestingUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    // If deleting a Super Admin, ensure at least one other Super Admin remains
    if (user.role === Role.SUPER_ADMIN) {
      const superAdminCount = await this.prisma.user.count({
        where: {
          role: Role.SUPER_ADMIN,
          isDeleted: false,
        },
      });

      if (superAdminCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last Super Admin. At least one Super Admin must exist.',
        );
      }
    }

    // Perform soft delete
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: 'User deleted successfully' };
  }
}
