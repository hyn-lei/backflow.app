import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { directus } from '@/lib/directus';
import { verifySession } from '@/lib/auth';
import { createItem, readItems } from '@directus/sdk';

const GENERAL_SLUG = 'general';

async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const session = await verifySession(token);
  return session?.userId || null;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const projects = await directus().request(
      readItems('projects', {
        filter: { user_id: { _eq: userId } },
        fields: [
          'id',
          'name',
          'website_url',
          'date_created',
          'date_updated',
          { tags: [{ categories_id: ['id', 'slug', 'name'] }] },
        ],
        sort: ['-date_created'],
      })
    );

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { name, website_url, tagIds, prefillGeneral } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const project = await directus().request(
      createItem('projects', {
        user_id: userId,
        name,
        website_url: website_url || null,
        tags: Array.isArray(tagIds) ? tagIds : [],
      })
    );

    if (prefillGeneral) {
      const generalCategories = await directus().request(
        readItems('categories', {
          filter: { slug: { _eq: GENERAL_SLUG } },
          fields: ['id'],
          limit: 1,
        })
      );
      const generalId = generalCategories[0]?.id;

      if (generalId) {
        const generalPlatforms = await directus().request(
          readItems('platforms', {
            filter: {
              status: { _eq: 'published' },
              categories: { categories_id: { slug: { _eq: GENERAL_SLUG } } },
            },
            fields: ['id'],
            sort: ['-domain_authority'],
            limit: 10,
          })
        );

        await Promise.all(
          generalPlatforms.map((platform) =>
            directus().request(
              createItem('project_tracking', {
                project_id: project.id,
                platform_id: platform.id,
                status: 'todo',
              })
            )
          )
        );
      }
    }

    const hydrated = await directus().request(
      readItems('projects', {
        filter: { id: { _eq: project.id } },
        fields: [
          'id',
          'name',
          'website_url',
          'date_created',
          'date_updated',
          { tags: [{ categories_id: ['id', 'slug', 'name'] }] },
        ],
        limit: 1,
      })
    );

    return NextResponse.json({ project: hydrated[0] || project });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
