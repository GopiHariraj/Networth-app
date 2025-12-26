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
import { GoldAssetsService } from './gold-assets.service';
import { CreateGoldAssetDto, UpdateGoldAssetDto } from './dto/gold-asset.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gold-assets')
@UseGuards(JwtAuthGuard)
export class GoldAssetsController {
  constructor(private goldAssetsService: GoldAssetsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.goldAssetsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.goldAssetsService.findOne(id, req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateGoldAssetDto) {
    return this.goldAssetsService.create(req.user.id, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateGoldAssetDto,
  ) {
    return this.goldAssetsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.goldAssetsService.delete(id, req.user.id);
  }
}
