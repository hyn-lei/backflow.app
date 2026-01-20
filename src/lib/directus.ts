import { createDirectus, rest, staticToken, RestClient, DirectusClient, StaticTokenClient } from '@directus/sdk';

export interface Platform {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  description: string;
  logo: string | null;
  domain_authority: number;
  cost_type: 'free' | 'paid' | 'freemium';
  status: 'published' | 'pending_review' | 'rejected';
  categories: CategoryRelation[] | null;
  date_created: string;
  user_created: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryRelation {
  id?: string;
  platforms_id?: string;
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
  platform: string | Platform;
  status: 'todo' | 'in_progress' | 'submitted' | 'live';
  backlink_url: string | null;
  notes: string | null;
  date_created: string;
  date_updated: string;
}

export interface Schema {
  platforms: Platform[];
  categories: Category[];
  platforms_categories: CategoryRelation[];
  users: User[];
  user_boards: UserBoard[];
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
