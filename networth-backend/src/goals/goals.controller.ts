import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
    constructor(private readonly goalsService: GoalsService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.goalsService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.goalsService.findOne(id, req.user.id);
    }

    @Post()
    create(@Request() req: any, @Body() dto: CreateGoalDto) {
        return this.goalsService.create(req.user.id, dto);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateGoalDto,
    ) {
        return this.goalsService.update(id, req.user.id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.goalsService.delete(id, req.user.id);
    }
}
