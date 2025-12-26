import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) { }

  // generateResetLink moved to UsersService

  async loginWithMagicLink(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        // resetTokenExpiry: { gt: new Date() } // Optional: enforce expiry
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Clear token, but keep forceChangePassword = true (it was set during generation)
    // Actually, we enforce logic: if they login via token, they MUST change password.
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null,
        forceChangePassword: true,
      },
    });

    // Generate JWT
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.firstName || 'User',
        role: user.role,
        forceChangePassword: true,
      },
    };
  }

  /**
   * Updates a user's password and clears the forceChangePassword flag.
   * This is typically called after a forced reset or magic link login.
   */
  async updatePassword(userId: string, newPass: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required for password update');
    }

    // Verify user exists first
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    try {
      const hash = await argon2.hash(newPass);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: hash,
          password: null, // Ensure any plaintext password is removed
          forceChangePassword: false,
          resetToken: null, // Clear these if they were using a recovery link
          resetTokenExpiry: null,
        },
      });

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      // In a production app, log the error here
      throw new BadRequestException('Failed to update password. Please ensure requirements are met.');
    }
  }

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(`[AuthService] Validating user: ${email}`);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      console.log(`[AuthService] User not found: ${email}`);
      return null;
    }
    console.log(`[AuthService] User found: ${user.id} (${user.email})`);

    // Check if user is active
    if (user.isActive === false || user.isDeleted === true) {
      console.log(`[AuthService] User is inactive or deleted: ${user.id}`);
      return null;
    }

    // For real DB users with argon2 hashed passwords
    if (user.passwordHash) {
      try {
        console.log(`[AuthService] Verifying password with argon2 for user: ${user.id}`);
        const isValid = await argon2.verify(user.passwordHash, pass);
        console.log(`[AuthService] Password verification result for ${user.id}: ${isValid}`);
        if (isValid) {
          const { passwordHash, ...result } = user as any;
          return result;
        }
      } catch (e) {
        console.error(`[AuthService] Argon2 verification failed for user ${user.id}:`, e);
        return null;
      }
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    console.log(`[AuthService] Login attempt for: ${loginDto.email}`);
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      console.log(`[AuthService] Login failed - invalid credentials or user inactive: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log(`[AuthService] Login successful for: ${user.id}`);
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.firstName || 'User',
        role: user.role,
        forceChangePassword: user.forceChangePassword,
      },
    };
  }
}
