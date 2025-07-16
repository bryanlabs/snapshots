import { NextRequest } from 'next/server';
import { User } from '../types';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ISSUER = 'bryanlabs-snapshots';
const JWT_AUDIENCE = 'bryanlabs-api';

interface JWTPayload {
  sub: string; // user id
  email: string;
  tier: 'free' | 'premium';
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

export async function createJWT(user: User): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const jwt = await new jose.SignJWT({
    sub: user.id,
    email: user.email,
    tier: user.tier || 'free',
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('7d')
    .sign(secret);
    
  return jwt;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    
    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function extractBearerToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

export async function getUserFromJWT(request: NextRequest): Promise<User | null> {
  const token = await extractBearerToken(request);
  
  if (!token) {
    return null;
  }
  
  const payload = await verifyJWT(token);
  
  if (!payload) {
    return null;
  }
  
  return {
    id: payload.sub,
    email: payload.email,
    tier: payload.tier,
    role: payload.role,
  };
}