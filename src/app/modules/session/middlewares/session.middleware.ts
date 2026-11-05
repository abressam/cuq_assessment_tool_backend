import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { checkJsonWebToken } from '@app/modules/session/utils/session.util';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    try {
      const authorization = req.headers.authorization;
      const [scheme, token] = authorization?.split(' ') ?? [];
      if (scheme?.toLowerCase() !== 'bearer' || !token) {
        throw new UnauthorizedException('Invalid session');
      }

      const secret = this.configService.getOrThrow<string>('auth.secret');
      const jwtPayload = checkJsonWebToken(token, secret);
      const userId = jwtPayload.userId;
      if (typeof userId !== 'number') {
        throw new UnauthorizedException('Invalid session');
      }
      req.userId = userId;
      next();
    } catch {
      throw new UnauthorizedException('Invalid session');
    }
  }
}