import { NextRequest, NextResponse } from 'next/server';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

const GENERAL_SLUG = 'general';

const platformFields = [
  'id',
  'name',
  'slug',
  'domain_authority',
  { categories: [{ categories_id: ['id', 'slug', 'name'] }] },
] as const;

type CategoryRef = { categories_id?: { id: string; slug: string; name: string } | string };

type PlatformItem = {
  id: number;
  name: string;
  slug: string;
  domain_authority: number;
  categories?: CategoryRef[] | null;
};

const extractCategorySlugs = (platform: PlatformItem): string[] => {
  const relations = platform.categories ?? [];
  const slugs: string[] = [];
  for (const rel of relations) {
    if (rel.categories_id && typeof rel.categories_id !== 'string') {
      slugs.push(rel.categories_id.slug);
    }
  }
  return slugs;
};

const scorePlatform = (platform: PlatformItem, tagSlugs: string[]): number => {
  const slugs = new Set(extractCategorySlugs(platform));
  const matchesTag = tagSlugs.some((slug) => slugs.has(slug));
  const hasGeneral = slugs.has(GENERAL_SLUG);
  return (matchesTag ? 100 : 0) + (hasGeneral ? 30 : 0);
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const excludeRejected = searchParams.get('excludeRejected') !== 'false';

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  try {
    const projects = await directus().request(
      readItems('projects', {
        filter: { id: { _eq: projectId } },
        fields: ['id', { tags: [{ categories_id: ['id', 'slug', 'name'] }] }],
        limit: 1,
      })
    );

    if (projects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[0] as { tags?: CategoryRef[] | null };
    const tagSlugs = (project.tags ?? [])
      .map((rel) => (typeof rel.categories_id === 'string' ? null : rel.categories_id?.slug))
      .filter((slug): slug is string => Boolean(slug));

    const precisePromise = tagSlugs.length
      ? directus().request(
          readItems('platforms', {
            filter: {
              status: { _eq: 'published' },
              categories: { categories_id: { slug: { _in: tagSlugs } } },
            },
            fields: platformFields,
          })
        )
      : Promise.resolve([] as PlatformItem[]);

    const generalPromise = directus().request(
      readItems('platforms', {
        filter: {
          status: { _eq: 'published' },
          categories: { categories_id: { slug: { _eq: GENERAL_SLUG } } },
        },
        fields: platformFields,
      })
    );

    const rejectedPromise = excludeRejected
      ? directus().request(
          readItems('project_tracking', {
            fields: ['platform_id'],
            filter: {
              project_id: { _eq: projectId },
              status: { _eq: 'rejected' },
            },
          })
        )
      : Promise.resolve([] as { platform_id: number }[]);

    const [precise, general, rejected] = await Promise.all([
      precisePromise,
      generalPromise,
      rejectedPromise,
    ]);

    const rejectedIds = new Set(rejected.map((item) => item.platform_id));

    const merged = new Map<number, PlatformItem>();
    for (const platform of [...precise, ...general]) {
      if (!rejectedIds.has(platform.id)) {
        merged.set(platform.id, platform);
      }
    }

    const scored = [...merged.values()].map((platform) => ({
      ...platform,
      score: scorePlatform(platform, tagSlugs),
    }));

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.domain_authority ?? 0) - (a.domain_authority ?? 0);
    });

    return NextResponse.json({
      items: scored,
      meta: { tagSlugs, excludeRejected },
    });
  } catch (error) {
    console.error('Failed to build recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to build recommendations' },
      { status: 500 }
    );
  }
}
