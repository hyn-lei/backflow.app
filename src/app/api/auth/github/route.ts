import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get('redirect') || '/';

    const rootUrl = 'https://github.com/login/oauth/authorize';

    const options = {
        client_id: process.env.GITHUB_CLIENT_ID || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/github`,
        scope: 'read:user user:email',
        state: redirect,
    };

    const qs = new URLSearchParams(options);

    return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
