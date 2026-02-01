import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AthletesService } from './athletes.service';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { AthleteDto } from './dto/athlete.dto';

@Controller('athletes')
export class AthletesController {
    constructor(private readonly athletesService: AthletesService) { }

    @Post()
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422
    }))
    async create(@Body() createAthleteDto: CreateAthleteDto): Promise<AthleteDto> {
        return this.athletesService.create(createAthleteDto);
    }
}
