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
import { MutualFundAssetsService } from './mutual-fund-assets.service';
import { CreateMutualFundAssetDto, UpdateMutualFundAssetDto } from './dto/mutual-fund-asset.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('mutual-fund-assets')
@UseGuards(JwtAuthGuard)
export class MutualFundAssetsController {
    constructor(private readonly mutualFundAssetsService: MutualFundAssetsService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.mutualFundAssetsService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.mutualFundAssetsService.findOne(id, req.user.id);
    }

    @Post()
    create(@Request() req: any, @Body() dto: CreateMutualFundAssetDto) {
        return this.mutualFundAssetsService.create(req.user.id, dto);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateMutualFundAssetDto,
    ) {
        return this.mutualFundAssetsService.update(id, req.user.id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.mutualFundAssetsService.delete(id, req.user.id);
    }
}
