import { sign, verify, JwtPayload, Secret } from 'jsonwebtoken';
import * as Crypto from 'crypto';

export function getJsonWebToken(userId: number, secret: Secret): string {
  return sign({ userId }, secret, { expiresIn: '1d' });
}

export function checkJsonWebToken(token: string, secret: Secret): JwtPayload {
  const payload = verify(token, secret);
  if (typeof payload === 'string') {
    throw new Error('Invalid JWT payload');
  }
  return payload;
}

export function encodePassword(salt: string, password: string): string {
  return Crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}