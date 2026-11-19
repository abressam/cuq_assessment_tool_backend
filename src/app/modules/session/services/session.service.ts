import { SessionServiceInterface } from './session.service.interface';
import { ConfigService } from '@nestjs/config';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GetUserResDto } from '@app/modules/user/dtos/responses/get-user-res.dto';
import { PostLoginResDto } from '@app/modules/session/dtos/responses/post-login-res.dto';
import { PostLoginReqDto } from '@app/modules/session/dtos/requests/post-login-req.dto';
import { PostCredentialsReqDto } from '@app/modules/session/dtos/requests/post-credentials-req.dto';
import {
  checkJsonWebToken,
  getJsonWebToken,
  encodePassword,
  generatePasswordSalt,
} from '@app/modules/session/utils/session.util';
import { User } from '@app/modules/user/models/user.model';
import { SessionToken } from '@app/modules/session/models/session-token.model';

@Injectable()
export class SessionService implements SessionServiceInterface {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(SessionToken)
    private sessionTokenModel: typeof SessionToken,
    private readonly configService: ConfigService,
  ) {}

  async postLogin(body: PostLoginReqDto): Promise<PostLoginResDto> {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');

    const user = await this.userModel.findOne({
      where: {
        email: body?.email,
      },
    });

    this.validateCredentials(user);
    if (
      !user.passwordSalt ||
      user.password !== encodePassword(user.passwordSalt, body.password)
    ) {
      throw new UnauthorizedException('Invalid session');
    }

    const tokens = this.createTokens(user.id, secret);
    await this.sessionTokenModel.upsert({
      userId: user.id,
      refreshToken: tokens.refresh_token,
    });
    return tokens;
  }

  async postCredentials(body: PostCredentialsReqDto): Promise<GetUserResDto> {
    const passwordSalt = generatePasswordSalt();

    const user = await this.userModel
      .findOrCreate({
        where: {
          email: body.email,
        },
        defaults: {
          name: body.name,
          email: body.email,
          password: encodePassword(passwordSalt, body.password),
          passwordSalt,
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

  async refreshToken(token: string): Promise<PostLoginResDto> {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    let payload;

    try {
      payload = checkJsonWebToken(token, secret, 'refresh');
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.id;
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const storedToken = await this.sessionTokenModel.findByPk(userId);
    if (!storedToken || storedToken.refreshToken !== token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = this.createTokens(user.id, secret);
    const [updatedCount] = await this.sessionTokenModel.update(
      { refreshToken: tokens.refresh_token },
      { where: { userId: user.id, refreshToken: token } },
    );
    if (updatedCount !== 1) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return tokens;
  }

  async authenticateAccessToken(token: string): Promise<number> {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    let payload;

    try {
      payload = checkJsonWebToken(token, secret, 'access');
    } catch {
      throw new UnauthorizedException('Invalid session');
    }

    const userId = payload.id;
    if (typeof userId !== 'number') {
      throw new UnauthorizedException('Invalid session');
    }

    const user = await this.userModel.findByPk(userId, {
      attributes: ['id'],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    return user.id;
  }

  private validateCredentials(user: User | null): asserts user is User {
    if (!user) {
      throw new HttpException('Invalid session', HttpStatus.UNAUTHORIZED);
    }
  }

  private createTokens(userId: number, secret: string): PostLoginResDto {
    return {
      jwt: getJsonWebToken(userId, secret, 'access'),
      refresh_token: getJsonWebToken(userId, secret, 'refresh'),
    };
  }

  private validateRegister(wasCreated: boolean) {
    if (!wasCreated) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }
  }
}