import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('analyze')
  // @UseGuards(JwtAuthGuard) // Uncomment when frontend sends token
  async analyze(@Body('text') text: string) {
    return this.aiService.parseFinanceUpdate(text);
  }

  @Post('execute')
  // @UseGuards(JwtAuthGuard)
  async execute(@Body() data: any) {
    return this.aiService.executeUpdates(data);
  }
}
