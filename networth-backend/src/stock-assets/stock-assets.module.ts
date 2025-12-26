import { Module } from '@nestjs/common';
import { StockAssetsController } from './stock-assets.controller';
import { StockAssetsService } from './stock-assets.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Module({
  controllers: [StockAssetsController],
  providers: [StockAssetsService, PrismaService],
  exports: [StockAssetsService],
})
export class StockAssetsModule {}
