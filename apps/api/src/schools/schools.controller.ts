import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { SchoolDto } from './dto/school.dto';

@Controller('schools')
export class SchoolsController {
    constructor(private readonly schoolsService: SchoolsService) { }

    @Post()
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        // ValidationPipe defaults throw UnprocessableEntity (422) if we configure explicit factory 
        // OR BadRequest (400) by default. 
        // The requirement is 422 for validation errors.
        errorHttpStatusCode: 422
    }))
    async create(@Body() createSchoolDto: CreateSchoolDto): Promise<SchoolDto> {
        return this.schoolsService.create(createSchoolDto);
    }
}
