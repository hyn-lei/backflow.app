import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { directus } from '@/lib/directus';
import { createItem, readItems } from '@directus/sdk';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if user exists
    const existing = await directus().request(
      readItems('users', {
        filter: { email: { _eq: email } },
        limit: 1,
      })
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await directus().request(
      createItem('users', {
        email,
        name: name || email.split('@')[0],
        password_hash,
        auth_provider: 'email',
      })
    );

    const token = await createSession(user);
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ user: { ...user, password_hash: undefined } });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
