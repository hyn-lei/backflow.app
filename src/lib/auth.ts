import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from './directus';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');

export async function createSession(user: User) {
  const token = await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifySession(token);
}
