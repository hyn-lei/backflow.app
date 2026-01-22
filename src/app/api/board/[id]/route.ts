import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { directus } from '@/lib/directus';
import { verifySession } from '@/lib/auth';
import { updateItem, deleteItem, readItems } from '@directus/sdk';

async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const session = await verifySession(token);
  return session?.userId || null;
}

async function assertTrackingOwnership(trackingId: string, userId: string) {
  const trackingItems = await directus().request(
    readItems('project_tracking', {
      filter: { id: { _eq: trackingId } },
      fields: ['id', { project_id: ['id', { user_id: ['id'] }] }],
      limit: 1,
    })
  );

  const tracking = trackingItems[0] as
    | { project_id?: { user_id?: { id?: string } } }
    | undefined;
  return tracking?.project_id?.user_id?.id === userId;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const ownsTracking = await assertTrackingOwnership(id, userId);
  if (!ownsTracking) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body = await request.json();

    const item = await directus().request(
      updateItem('project_tracking', id, body)
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
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const ownsTracking = await assertTrackingOwnership(id, userId);
  if (!ownsTracking) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    await directus().request(deleteItem('project_tracking', id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete board item:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
