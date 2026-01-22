import { DirectoryClient } from './directory-client';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

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
  const categories = await getCategories();
  return <DirectoryClient categories={categories} />;
}

export const revalidate = 60;
