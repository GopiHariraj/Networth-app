import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    async validateUser(email: string, pass: string): Promise<any> {
        // Delegate lookup to UsersService (which handles DB + Mock fallback)
        const user = await this.usersService.findByEmail(email);

        if (!user) return null;

        // Check if this is a mock user with plain text password
        if ('password' in user && user.password) {
            if (user.password === pass) {
                const { password, ...result } = user as any;
                return result;
            }
            return null;
        }

        // For real database users with argon2 hashed passwords
        if ('passwordHash' in user && user.passwordHash) {
            try {
                const isValid = await argon2.verify(user.passwordHash, pass);
                if (isValid) {
                    const { passwordHash, ...result } = user as any;
                    return result;
                }
            } catch (error) {
                // Invalid hash format or verification error
                return null;
            }
        }

        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.firstName || user.name,
                role: user.role
            }
        };
    }
}
