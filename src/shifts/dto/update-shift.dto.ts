import { PartialType } from '@nestjs/swagger';
import { CreateShiftDto } from './create-shift.dto';

// PartialType makes all fields from CreateShiftDto optional
// so managers can update just one field without resending everything
export class UpdateShiftDto extends PartialType(CreateShiftDto) {}
