import { NextResponse } from 'next/server';
import { directus } from '@/lib/directus';
import { createItem } from '@directus/sdk';

export async function GET() {
    try {
        const timestamp = Date.now();
        console.log('Attempting debug insert...');

        // Log the configuration
        const url = process.env.DIRECTUS_URL;
        console.log('Directus URL:', url);

        const newUser = await directus().request(
            createItem('users', {
                email: `debug_${timestamp}@example.com`,
                name: 'Debug User with ID',
                auth_provider: 'google',
                provider_id: '1234567890',
                date_created: new Date().toISOString(),
            })
        );

        return NextResponse.json({ success: true, user: newUser, conf: { url } });
    } catch (error: any) {
        console.error('Debug insert failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.errors,
            conf: { url: process.env.DIRECTUS_URL }
        }, { status: 500 });
    }
}
