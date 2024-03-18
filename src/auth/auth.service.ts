import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import * as bcryptjs from 'bcryptjs';

import { CreateUserDto } from './dto/create-user.dto';
import { Model } from 'mongoose';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginResponse } from './interfaces/login-response';

@Injectable()
export class AuthService {

  constructor(@InjectModel(User.name) 
  private userModel: Model<User>, 
  private jwtService: JwtService){}

  async create(createUserDto: CreateUserDto): Promise<User> {
    
   
    try {
      // const newUser = new this.userModel( createUserDto );
      const { password, ...userData } = createUserDto;

      const newUser = new this.userModel({
        password: bcryptjs.hashSync( password, 10),
        ...userData
      });

      await newUser.save();
      const { password:_, ...user} = newUser.toJSON();

      return user;

    } catch (error) {
   
      if( error.code === 11000 ) {
        throw new BadRequestException(`${ createUserDto.email } already exists!`)
      }
      throw new InternalServerErrorException('Something terribe happen!!!');
    }    
  }

  async register(registerUserDto: RegisterUserDto): Promise<LoginResponse>{

    const user = await this.create( registerUserDto );
    console.log({user})
    return{
      user: user,
      token: this.getJwtToken({ id: user._id})
    }
  }

  async login(loginDto: LoginDto){

    const { email, password } = loginDto;

    const user = await this.userModel.findOne({email});
    if ( !user )
    {
      throw new UnauthorizedException('Not valid credentials - email');
    }

    if(!bcryptjs.compareSync (password, user.password )){
      throw new UnauthorizedException ('Not valid credentials - password')
    }

    const { password:_, ...rest} = user.toJSON();

    return {
      user: rest,
      token: this.getJwtToken({id: user.id }),
    };
  }

  async findUserById (id: string){
    const user = await this.userModel.findById( id );
    const {password, ...rest} = user.toJSON();
    return rest;
  }

  findAll(): Promise<User[]> {
    return this.userModel.find()
     
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  getJwtToken (payload: JwtPayload){

    const token = this.jwtService.sign(payload);
    return token;
     
  }
}
