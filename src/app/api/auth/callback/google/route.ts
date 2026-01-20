import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { directus, User, getDirectusFileUrl, uploadAvatarToDirectus } from '@/lib/directus';
import { readItems, createItem, updateItem } from '@directus/sdk';
import { createSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '/';

    if (!code) {
        return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=no_code`));
    }

    try {
        // 1. Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Google token exchange failed:', tokens);
            return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=token_exchange_failed`));
        }

        // 2. Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userResponse.json();

        if (!userResponse.ok) {
            console.error('Google user info failed:', googleUser);
            return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=user_info_failed`));
        }

        // 3. Find or create user in Directus
        const users = await directus().request(
            readItems('users', {
                filter: { email: { _eq: googleUser.email } },
                limit: 1,
            })
        );

        let user: User | null = users[0] || null;

        if (!user) {
            // Upload avatar to Directus if available
            let avatarFileId: string | null = null;
            if (googleUser.picture) {
                avatarFileId = await uploadAvatarToDirectus(
                    googleUser.picture,
                    `avatar-google-${googleUser.id}`
                );
            }

            // Create new user with Directus file URL
            const newUser = await directus().request(
                createItem('users', {
                    email: googleUser.email,
                    name: googleUser.name || googleUser.email.split('@')[0],
                    avatar_url: avatarFileId ? getDirectusFileUrl(avatarFileId) : null,
                    auth_provider: 'google',
                    provider_id: googleUser.id,
                })
            );
            user = newUser as User;
        }

        if (!user) {
            return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=user_creation_failed`));
        }

        // Update last_login
        await directus().request(
            updateItem('users', user.id, { last_login: new Date().toISOString() })
        );

        // 4. Create session
        const token = await createSession(user);
        const cookieStore = await cookies();
        cookieStore.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        const validState = state.startsWith('http') ? state : `${process.env.NEXT_PUBLIC_APP_URL}${state}`;
        return NextResponse.redirect(new URL(validState));

    } catch (error) {
        console.error('Google auth error:', error);
        return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=auth_failed`));
    }
}
