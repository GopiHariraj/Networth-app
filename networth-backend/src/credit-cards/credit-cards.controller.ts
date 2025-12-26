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
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto, UpdateCreditCardDto } from './dto/credit-card.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('credit-cards')
@UseGuards(JwtAuthGuard)
export class CreditCardsController {
    constructor(private readonly creditCardsService: CreditCardsService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.creditCardsService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.creditCardsService.findOne(id, req.user.id);
    }

    @Post()
    create(@Request() req: any, @Body() dto: CreateCreditCardDto) {
        return this.creditCardsService.create(req.user.id, dto);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateCreditCardDto,
    ) {
        return this.creditCardsService.update(id, req.user.id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.creditCardsService.delete(id, req.user.id);
    }
}
