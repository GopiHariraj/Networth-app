import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OpenAiService } from '../common/openai/openai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly expensesService: ExpensesService,
  ) { }

  @Get()
  findAll(@Request() req: any) {
    return this.expensesService.findAll(req.user.id);
  }

  @Get('insights')
  async getInsights(@Request() req: any) {
    return this.expensesService.getInsights(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.expensesService.findOne(id, req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.id, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.expensesService.delete(id, req.user.id);
  }

  @Post('ai-parse-text')
  async parseExpenseText(@Body() body: { text: string }) {
    if (!body.text || body.text.trim().length === 0) {
      return { error: 'Text is required' };
    }

    try {
      const result = await this.openAiService.parseExpenseText(body.text);
      return result;
    } catch (error) {
      return {
        error: 'Failed to parse expenses',
        message: error.message,
      };
    }
  }
}
