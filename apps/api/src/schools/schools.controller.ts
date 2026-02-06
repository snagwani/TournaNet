import { Controller, Post, Body, UsePipes, ValidationPipe, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { SchoolDto } from './dto/school.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SchoolsController {
    constructor(private readonly schoolsService: SchoolsService) { }

    @Post()
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422
    }))
    @UseInterceptors(FileInterceptor('logo'))
    async create(
        @Body() createSchoolDto: CreateSchoolDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<SchoolDto> {
        return this.schoolsService.create(createSchoolDto, file);
    }

    @Post('bulk-import')
    @UseInterceptors(FileInterceptor('file'))
    async bulkImport(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new Error('CSV file is required');
        }
        return this.schoolsService.bulkImport(file.buffer);
    }
}
