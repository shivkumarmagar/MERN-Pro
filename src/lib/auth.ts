import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    return null;
  }
}

export function createAuthResponse(user: User) {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const refreshPayload: RefreshTokenPayload = {
    userId: user.id,
    tokenVersion: 1, // In production, store this in DB and increment on logout
  };

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      verifiedMobile: user.verifiedMobile,
    },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(refreshPayload),
  };
}
