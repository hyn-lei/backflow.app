import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { DirectoryClient } from './directory-client';

async function getPlatforms() {
  const platforms = await directus().request(
    readItems('platforms', {
      filter: { status: { _eq: 'published' } },
      fields: ['*', { categories: [{ categories_id: ['*'] }] }],
      sort: ['-domain_authority'],
    })
  );
  return platforms;
}

async function getCategories() {
  const categories = await directus().request(
    readItems('categories', {
      fields: ['*'],
      sort: ['name'],
    })
  );
  return categories;
}

export default async function HomePage() {
  const [platforms, categories] = await Promise.all([
    getPlatforms(),
    getCategories(),
  ]);

  return <DirectoryClient platforms={platforms} categories={categories} />;
}
