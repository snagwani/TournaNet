import { Controller, Post, Param, Body, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { HeatsService } from './heats.service';
import { GenerateHeatsDto } from './dto/generate-heats.dto';
import { HeatsResponseDto } from './dto/heats-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class HeatsController {
    constructor(private readonly heatsService: HeatsService) { }

    @Post(':eventId/heats/generate')
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422
    }))
    async generate(
        @Param('eventId') eventId: string,
        @Body() dto: GenerateHeatsDto
    ): Promise<HeatsResponseDto> {
        return this.heatsService.generate(eventId, dto);
    }
}
