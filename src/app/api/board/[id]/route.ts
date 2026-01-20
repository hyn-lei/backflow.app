import { NextRequest, NextResponse } from 'next/server';
import { directus } from '@/lib/directus';
import { updateItem, deleteItem } from '@directus/sdk';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    const item = await directus().request(
      updateItem('user_boards', id, body)
    );

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Failed to update board item:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await directus().request(deleteItem('user_boards', id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete board item:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
