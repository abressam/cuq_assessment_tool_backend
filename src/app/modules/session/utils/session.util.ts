import { sign, verify, JwtPayload, Secret } from 'jsonwebtoken';
import * as Crypto from 'crypto';

export type TokenType = 'access' | 'refresh';

export function getJsonWebToken(
  userId: number,
  secret: Secret,
  type: TokenType = 'access',
): string {
  return sign({ userId, type }, secret, {
    expiresIn: type === 'access' ? '1h' : '7d',
  });
}

export function checkJsonWebToken(
  token: string,
  secret: Secret,
  expectedType?: TokenType,
): JwtPayload {
  const payload = verify(token, secret);
  if (
    typeof payload === 'string' ||
    (expectedType && payload.type !== expectedType)
  ) {
    throw new Error('Invalid JWT payload');
  }
  return payload;
}

export function encodePassword(salt: string, password: string): string {
  return Crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}