import { Controller, Post, Param, Body, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { ResultsService } from './results.service';
import { SubmitResultsDto } from './dto/submit-results.dto';
import { ResultsResponseDto } from './dto/results-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('events/:eventId/heats/:heatId/results')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultsController {
    constructor(private readonly resultsService: ResultsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SCORER)
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422
    }))
    async submitResults(
        @Param('eventId') eventId: string,
        @Param('heatId') heatId: string,
        @Body() dto: SubmitResultsDto
    ): Promise<ResultsResponseDto> {
        return this.resultsService.submitResults(eventId, heatId, dto);
    }
}
