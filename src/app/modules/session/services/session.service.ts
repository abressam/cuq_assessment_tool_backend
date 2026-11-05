import { SessionServiceInterface } from './session.service.interface';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GetUserResDto } from '@app/modules/user/dtos/responses/get-user-res.dto';
import { PostLoginResDto } from '@app/modules/session/dtos/responses/post-login-res.dto';
import { PostLoginReqDto } from '@app/modules/session/dtos/requests/post-login-req.dto';
import { PostCredentialsReqDto } from '@app/modules/session/dtos/requests/post-credentials-req.dto';
import {
  getJsonWebToken,
  encodePassword,
} from '@app/modules/session/utils/session.util';
import { User } from '@app/modules/user/models/user.model';

@Injectable()
export class SessionService implements SessionServiceInterface {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private readonly configService: ConfigService,
  ) {}

  async postLogin(body: PostLoginReqDto): Promise<PostLoginResDto> {
    const secret = this.configService.getOrThrow<string>('auth.secret');
    const salt = this.configService.getOrThrow<string>('auth.salt');

    const user = await this.userModel.findOne({
      where: {
        email: body?.email,
        password: encodePassword(salt, body?.password),
      },
    });

    this.validateCredentials(user);

    return { jwt: getJsonWebToken(user.id, secret) };
  }

  async postCredentials(body: PostCredentialsReqDto): Promise<GetUserResDto> {
    const salt = this.configService.getOrThrow<string>('auth.salt');

    const user = await this.userModel
      .findOrCreate({
        where: {
          email: body.email,
        },
        defaults: {
          name: body.name,
          email: body.email,
          password: encodePassword(salt, body.password),
        },
      })
      .then(([user, wasCreated]) => {
        this.validateRegister(wasCreated);
        return {
          name: user.name,
          email: user.email,
        };
      });

    return { user };
  }

  private validateCredentials(user: User | null): asserts user is User {
    if (!user) {
      throw new HttpException('Invalid session', HttpStatus.UNAUTHORIZED);
    }
  }

  private validateRegister(wasCreated: boolean) {
    if (!wasCreated) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }
  }
}