import { Controller, Post, Param, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { HeatsService } from './heats.service';
import { GenerateHeatsDto } from './dto/generate-heats.dto';
import { HeatsResponseDto } from './dto/heats-response.dto';

@Controller('events')
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
