import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

// just a key string so RolesGuard knows what metadata to look for
export const ROLES_KEY = 'roles';

// usage: @Roles(UserRole.MANAGER) above a route handler
// this attaches the role info to the route so RolesGuard can read it
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
