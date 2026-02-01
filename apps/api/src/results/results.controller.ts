import { Controller, Post, Param, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ResultsService } from './results.service';
import { SubmitResultsDto } from './dto/submit-results.dto';
import { ResultsResponseDto } from './dto/results-response.dto';

@Controller('events/:eventId/heats/:heatId/results')
export class ResultsController {
    constructor(private readonly resultsService: ResultsService) { }

    @Post()
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
