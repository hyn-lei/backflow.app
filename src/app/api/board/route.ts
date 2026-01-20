import { NextRequest, NextResponse } from 'next/server';
import { directus } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    const items = await directus().request(
      readItems('user_boards', {
        filter: { user: { _eq: userId } },
        fields: ['*', { platform: ['*'] }],
      })
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch board:', error);
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platformId, userId } = await request.json();

    if (!platformId || !userId) {
      return NextResponse.json({ error: 'platformId and userId required' }, { status: 400 });
    }

    // Check if already added
    const existing = await directus().request(
      readItems('user_boards', {
        filter: {
          user: { _eq: userId },
          platform: { _eq: platformId },
        },
        limit: 1,
      })
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already added to board' }, { status: 400 });
    }

    const item = await directus().request(
      createItem('user_boards', {
        user: userId,
        platform: platformId,
        status: 'todo',
      })
    );

    // Fetch with platform details
    const items = await directus().request(
      readItems('user_boards', {
        filter: { id: { _eq: item.id } },
        fields: ['*', { platform: ['*'] }],
        limit: 1,
      })
    );

    return NextResponse.json({ item: items[0] });
  } catch (error) {
    console.error('Failed to add to board:', error);
    return NextResponse.json({ error: 'Failed to add to board' }, { status: 500 });
  }
}
