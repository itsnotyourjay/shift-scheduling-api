import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // all shift routes require login
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  // managers see all shifts, staff only see theirs
  @Get()
  @ApiOperation({ summary: 'List shifts (managers: all, staff: assigned only)' })
  @ApiResponse({ status: 200, description: 'List of shifts' })
  findAll(@CurrentUser() user: { sub: string; role: UserRole }) {
    return this.shiftsService.findAll(user);
  }

  // only managers can create shifts
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new shift (manager only)' })
  @ApiResponse({ status: 201, description: 'Shift created' })
  @ApiResponse({ status: 403, description: 'Forbidden — managers only' })
  create(
    @Body() dto: CreateShiftDto,
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.shiftsService.create(dto, user);
  }

  // authenticated users — staff restricted to assigned shifts in service layer
  @Get(':id')
  @ApiOperation({ summary: 'Get a single shift by ID' })
  @ApiResponse({ status: 200, description: 'Shift details' })
  @ApiResponse({ status: 403, description: 'Staff not assigned to this shift' })
  @ApiResponse({ status: 404, description: 'Shift not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.shiftsService.findOne(id, user);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a shift (manager only)' })
  @ApiResponse({ status: 200, description: 'Shift updated' })
  @ApiResponse({ status: 404, description: 'Shift not found' })
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.shiftsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a shift (manager only)' })
  @ApiResponse({ status: 200, description: 'Shift deleted' })
  @ApiResponse({ status: 404, description: 'Shift not found' })
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }

  // assign a staff member to a shift — includes overlap detection
  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign a staff member to a shift (manager only)' })
  @ApiResponse({ status: 201, description: 'Staff assigned' })
  @ApiResponse({ status: 409, description: 'Shift overlap or already assigned' })
  @ApiResponse({ status: 404, description: 'Shift or staff not found' })
  assign(@Param('id') id: string, @Body() dto: AssignShiftDto) {
    return this.shiftsService.assign(id, dto);
  }

  @Delete(':id/assign/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Unassign a staff member from a shift (manager only)' })
  @ApiResponse({ status: 200, description: 'Staff unassigned' })
  @ApiResponse({ status: 404, description: 'Shift or assignment not found' })
  unassign(@Param('id') id: string, @Param('userId') userId: string) {
    return this.shiftsService.unassign(id, userId);
  }
}
