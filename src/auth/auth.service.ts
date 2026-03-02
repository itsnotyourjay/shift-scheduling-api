import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    // first check if someone already registered with this email
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    // never store plain text passwords — bcrypt hashes it before saving
    // 10 salt rounds is the standard, higher = more secure but slower
    const hashed = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({ ...dto, password: hashed });
    const saved = await this.userRepository.save(user);

    // strip the password out before sending back the response
    const { password, ...result } = saved;
    return result;
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    // password has select:false on the entity so we need addSelect to get it here
    // this is the only place we ever want to touch the hashed password
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: dto.email })
      .getOne();

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
    // findOne can return null if user not found, so we reflect that in the return type
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
