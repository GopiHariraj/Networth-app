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
import { BondAssetsService } from './bond-assets.service';
import { CreateBondAssetDto, UpdateBondAssetDto } from './dto/bond-asset.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bond-assets')
@UseGuards(JwtAuthGuard)
export class BondAssetsController {
    constructor(private readonly bondAssetsService: BondAssetsService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.bondAssetsService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.bondAssetsService.findOne(id, req.user.id);
    }

    @Post()
    create(@Request() req: any, @Body() dto: CreateBondAssetDto) {
        return this.bondAssetsService.create(req.user.id, dto);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateBondAssetDto,
    ) {
        return this.bondAssetsService.update(id, req.user.id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.bondAssetsService.delete(id, req.user.id);
    }
}
