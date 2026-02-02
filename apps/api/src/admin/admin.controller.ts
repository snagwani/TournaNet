import { Controller, Get, Query, UsePipes, ValidationPipe, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AthleteReportQueryDto, ExportQueryDto, EventReportQueryDto } from './dto/admin-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('overview')
    async getOverview() {
        return this.adminService.getSystemOverview();
    }

    @Get('reports/schools')
    async getSchoolReports() {
        return this.adminService.getSchoolReports();
    }

    @Get('reports/athletes')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getAthleteReports(@Query() query: AthleteReportQueryDto) {
        return this.adminService.getAthleteReports(query);
    }

    @Get('reports/athletes/:id')
    async getAthleteDetail(@Param('id') id: string) {
        const detail = await this.adminService.getAthleteDetail(id);
        if (!detail) throw new NotFoundException('Athlete not found');
        return detail;
    }

    @Get('reports/events')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getEventReports(@Query() query: EventReportQueryDto) {
        return this.adminService.getEventReports(query);
    }

    @Get('reports/events/:id')
    async getEventDetail(@Param('id') id: string) {
        const detail = await this.adminService.getEventDetail(id);
        if (!detail) throw new NotFoundException('Event not found');
        return detail;
    }

    @Get('export')
    @UsePipes(new ValidationPipe({ transform: true }))
    async exportReport(@Query() query: ExportQueryDto) {
        return this.adminService.exportReport(query);
    }
}
