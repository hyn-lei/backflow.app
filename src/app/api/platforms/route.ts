import { NextRequest, NextResponse } from 'next/server';
import { directus } from '@/lib/directus';
import { createItem } from '@directus/sdk';

export async function POST(request: NextRequest) {
  try {
    const { name, website_url, description, category } = await request.json();

    if (!name || !website_url) {
      return NextResponse.json(
        { error: 'Name and website URL are required' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const platform = await directus().request(
      createItem('platforms', {
        name,
        slug,
        website_url,
        description: description || '',
        status: 'pending_review',
        cost_type: 'free',
        domain_authority: 0,
      })
    );

    return NextResponse.json({ platform, message: 'Platform submitted for review' });
  } catch (error) {
    console.error('Failed to submit platform:', error);
    return NextResponse.json(
      { error: 'Failed to submit platform' },
      { status: 500 }
    );
  }
}
