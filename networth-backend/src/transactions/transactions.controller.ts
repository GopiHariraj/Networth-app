import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  ParseSmsDto,
} from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post()
  create(@Body() dto: CreateTransactionDto, @Request() req: any) {
    return this.transactionsService.create(req.user.id, dto);
  }

  @Post('sms')
  parseSMS(@Body() dto: ParseSmsDto, @Request() req: any) {
    return this.transactionsService.parseAndCreate(req.user.id, dto.text);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.transactionsService.findAll(req.user.id);
  }

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.transactionsService.getDashboardData(req.user.id);
  }
}
