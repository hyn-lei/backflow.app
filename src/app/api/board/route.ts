import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { directus } from '@/lib/directus';
import { verifySession } from '@/lib/auth';
import { readItems, createItem } from '@directus/sdk';

async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const session = await verifySession(token);
  return session?.userId || null;
}

async function assertProjectOwnership(projectId: string, userId: string) {
  const projects = await directus().request(
    readItems('projects', {
      filter: { id: { _eq: projectId }, user_id: { _eq: userId } },
      fields: ['id'],
      limit: 1,
    })
  );
  return projects.length > 0;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const ownsProject = await assertProjectOwnership(projectId, userId);
  if (!ownsProject) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  try {
    const items = await directus().request(
      readItems('project_tracking', {
        filter: { project_id: { _eq: projectId } },
        fields: ['*', { platform_id: ['*'] }],
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
    const { platformId, projectId } = await request.json();
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!platformId || !projectId) {
      return NextResponse.json({ error: 'platformId and projectId required' }, { status: 400 });
    }

    const ownsProject = await assertProjectOwnership(projectId, userId);
    if (!ownsProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if already added
    const existing = await directus().request(
      readItems('project_tracking', {
        filter: {
          project_id: { _eq: projectId },
          platform_id: { _eq: platformId },
        },
        limit: 1,
      })
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already added to board' }, { status: 400 });
    }

    const item = await directus().request(
      createItem('project_tracking', {
        project_id: projectId,
        platform_id: platformId,
        status: 'todo',
      })
    );

    // Fetch with platform details
    const items = await directus().request(
      readItems('project_tracking', {
        filter: { id: { _eq: item.id } },
        fields: ['*', { platform_id: ['*'] }],
        limit: 1,
      })
    );

    return NextResponse.json({ item: items[0] });
  } catch (error) {
    console.error('Failed to add to board:', error);
    return NextResponse.json({ error: 'Failed to add to board' }, { status: 500 });
  }
}
