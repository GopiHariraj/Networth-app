import {
  Controller,
  Post,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) { }

  @Post('reset-database')
  @UseGuards(JwtAuthGuard)
  async resetDatabase(@Request() req: any) {
    // Verify super admin role
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException(
        'Only super admins can reset the database',
      );
    }

    return this.adminService.resetDatabase();
  }

  @Post('export-data')
  @UseGuards(JwtAuthGuard)
  async exportData(@Request() req: any) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only super admins can export data');
    }
    return this.adminService.exportData();
  }

  @Post('import-data')
  @UseGuards(JwtAuthGuard)
  async importData(@Request() req: any) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only super admins can import data');
    }
    return this.adminService.importData(req.body);
  }
}
