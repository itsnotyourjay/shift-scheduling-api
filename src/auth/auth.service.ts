import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    // first check if someone already registered with this email
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    // never store plain text passwords — bcrypt hashes it before saving
    // 10 salt rounds is the standard, higher = more secure but slower
    const hashed = await bcrypt.hash(dto.password, 10);

    const saved = await this.usersService.create({ ...dto, password: hashed });

    // strip the password out before sending back the response
    const { password, ...result } = saved;
    return result;
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    // findByEmail uses addSelect internally to grab password — the only place we need it
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // bcrypt.compare handles the hash comparison for us
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // put the user id and role inside the token so we can read it later
    // 'sub' is just the standard JWT field name for the user id
    const payload = { sub: user.id, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  async getMe(userId: string): Promise<User | null> {
    // findById returns null if not found — reflected in the return type
    return this.usersService.findById(userId);
  }
}
