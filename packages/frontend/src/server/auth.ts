import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as argon2 from 'argon2';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET || 'fallback-secret-change-in-production';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

export function signAccessToken(userId: string, email: string, roles: string[] = []): string {
  return jwt.sign(
    { sub: userId, email, roles },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (hash.startsWith('$argon2')) {
    return argon2.verify(hash, password);
  }
  return bcrypt.compare(password, hash);
}
