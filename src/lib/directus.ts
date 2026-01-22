import { createDirectus, rest, staticToken, RestClient, DirectusClient, StaticTokenClient } from '@directus/sdk';

export interface Platform {
  id: number;
  name: string;
  slug: string;
  website_url: string;
  description: string;
  detail: string | null;
  logo: string | null;
  domain_authority: number;
  cost_type: 'free' | 'paid' | 'freemium';
  status: 'published' | 'pending_review' | 'rejected';
  categories: CategoryRelation[] | null;
  date_created: string;
  user_created: string | null;
}

export interface Category {
  id: string; // Categories retained UUID
  name: string;
  slug: string;
}

export interface CategoryRelation {
  id?: number;
  platforms_id?: number;
  categories_id: string | Category;
}

export interface ProjectCategoryRelation {
  id?: string;
  projects_id?: string;
  categories_id: string | Category;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  auth_provider: 'email' | 'google' | 'github';
  provider_id: string | null;
  password_hash: string | null;
  date_created: string;
  last_login: string | null;
}

export interface UserBoard {
  id: string;
  user: string | User;
  platform: number | Platform;
  status: 'todo' | 'in_progress' | 'submitted' | 'live' | 'rejected';
  backlink_url: string | null;
  notes: string | null;
  date_created: string;
  date_updated: string;
}

export interface Project {
  id: string;
  user_id: string | User;
  name: string;
  website_url: string | null;
  tags: ProjectCategoryRelation[] | null;
  date_created: string;
  date_updated: string;
}

export interface ProjectTracking {
  id: string;
  project_id: string | Project;
  platform_id: number | Platform;
  status: 'todo' | 'in_progress' | 'submitted' | 'live' | 'rejected';
  notes: string | null;
  live_backlink_url: string | null;
}

export interface Schema {
  platforms: Platform[];
  categories: Category[];
  platforms_categories: CategoryRelation[];
  users: User[];
  user_boards: UserBoard[];
  projects: Project[];
  projects_categories: ProjectCategoryRelation[];
  project_tracking: ProjectTracking[];
}

const getDirectusUrl = () => process.env.DIRECTUS_URL || 'http://localhost:8055';
const getDirectusToken = () => process.env.DIRECTUS_TOKEN || '';

type Client = DirectusClient<Schema> & StaticTokenClient<Schema> & RestClient<Schema>;

// Create client lazily to avoid issues during build/bundling
let _directus: Client | null = null;

export const directus = (): Client => {
  if (!_directus) {
    _directus = createDirectus<Schema>(getDirectusUrl())
      .with(staticToken(getDirectusToken()))
      .with(rest());
  }
  return _directus;
};

export const getDirectusFileUrl = (fileId: string | null) => {
  if (!fileId) return null;
  return `${getDirectusUrl()}/assets/${fileId}`;
};

export async function uploadAvatarToDirectus(imageUrl: string, fileName: string): Promise<string | null> {
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) return null;

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    const imageBlob = await imageResponse.blob();

    const formData = new FormData();
    formData.append('file', imageBlob, `${fileName}.${ext}`);

    const uploadResponse = await fetch(`${getDirectusUrl()}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getDirectusToken()}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      console.error('Failed to upload avatar to Directus');
      return null;
    }

    const result = await uploadResponse.json();
    return result.data?.id || null;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}
