import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpenseCategoriesService } from './expense-categories.service';

@Controller('expense-categories')
@UseGuards(JwtAuthGuard)
export class ExpenseCategoriesController {
    constructor(private readonly categoriesService: ExpenseCategoriesService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.categoriesService.findAll(req.user.id);
    }

    @Post()
    create(@Request() req: any, @Body() body: { name: string, icon?: string, color?: string }) {
        return this.categoriesService.create(req.user.id, body.name, body.icon, body.color);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.categoriesService.delete(id, req.user.id);
    }
}
