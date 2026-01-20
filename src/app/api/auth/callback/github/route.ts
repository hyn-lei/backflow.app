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
        // 1. Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/github`,
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error || !tokens.access_token) {
            console.error('GitHub token exchange failed:', tokens);
            return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=token_exchange_failed`));
        }

        // 2. Get user info
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                'Accept': 'application/json',
            },
        });

        const githubUser = await userResponse.json();

        if (!userResponse.ok) {
            console.error('GitHub user info failed:', githubUser);
            return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=user_info_failed`));
        }

        // 3. Get user email (may be private)
        let email = githubUser.email;
        if (!email) {
            const emailsResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                    'Accept': 'application/json',
                },
            });
            const emails = await emailsResponse.json();
            const primaryEmail = emails.find((e: { primary: boolean; verified: boolean; email: string }) => e.primary && e.verified);
            email = primaryEmail?.email || emails[0]?.email;
        }

        if (!email) {
            return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=no_email`));
        }

        // 4. Find or create user in Directus
        const users = await directus().request(
            readItems('users', {
                filter: { email: { _eq: email } },
                limit: 1,
            })
        );

        let user: User | null = users[0] || null;

        if (!user) {
            // Upload avatar to Directus if available
            let avatarFileId: string | null = null;
            if (githubUser.avatar_url) {
                avatarFileId = await uploadAvatarToDirectus(
                    githubUser.avatar_url,
                    `avatar-github-${githubUser.id}`
                );
            }

            // Create new user
            const newUser = await directus().request(
                createItem('users', {
                    email,
                    name: githubUser.name || githubUser.login,
                    avatar_url: avatarFileId ? getDirectusFileUrl(avatarFileId) : null,
                    auth_provider: 'github',
                    provider_id: String(githubUser.id),
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

        // 5. Create session
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
        console.error('GitHub auth error:', error);
        return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?error=auth_failed`));
    }
}
