import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard stats (managers: global, staff: personal)' })
  @ApiResponse({ status: 200, description: 'Role-specific analytics data' })
  getDashboard(@CurrentUser() currentUser: { sub: string; role: UserRole }) {
    if (currentUser.role === UserRole.MANAGER) {
      return this.analyticsService.getManagerDashboard();
    }
    return this.analyticsService.getStaffDashboard(currentUser.sub);
  }
}
