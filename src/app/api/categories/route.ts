import { NextResponse } from 'next/server';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET() {
  try {
    const categories = await directus().request(
      readItems('categories', {
        fields: ['id', 'name', 'slug'],
        sort: ['name'],
      })
    );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
