import { create } from 'zustand';
import { Project, Category } from '@/lib/directus';

interface CreateProjectInput {
  name: string;
  website_url?: string | null;
  tagIds: string[];
  prefillGeneral?: boolean;
}

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  isCreating: boolean;
  categories: Category[];
  isLoadingCategories: boolean;
  fetchProjects: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  setCurrentProject: (projectId: string) => void;
  createProject: (input: CreateProjectInput) => Promise<Project>;
}

const PROJECT_STORAGE_KEY = 'backlinkflow.currentProjectId';

const loadStoredProjectId = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(PROJECT_STORAGE_KEY);
};

const persistProjectId = (projectId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROJECT_STORAGE_KEY, projectId);
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  isLoading: false,
  isCreating: false,
  categories: [],
  isLoadingCategories: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      const projects = data.projects as Project[];
      const storedId = loadStoredProjectId();
      const nextId =
        storedId && projects.some((p) => p.id === storedId)
          ? storedId
          : projects[0]?.id || null;

      set({ projects, currentProjectId: nextId });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCategories: async () => {
    if (get().categories.length > 0) return;
    set({ isLoadingCategories: true });
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      set({ categories: data.categories as Category[] });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      set({ isLoadingCategories: false });
    }
  },

  setCurrentProject: (projectId: string) => {
    persistProjectId(projectId);
    set({ currentProjectId: projectId });
  },

  createProject: async (input) => {
    set({ isCreating: true });
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          website_url: input.website_url || null,
          tagIds: input.tagIds,
          prefillGeneral: input.prefillGeneral !== false,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create project');
      }

      const data = await res.json();
      const project = data.project as Project;
      const nextProjects = [...get().projects, project];
      persistProjectId(project.id);
      set({
        projects: nextProjects,
        currentProjectId: project.id,
      });
      return project;
    } finally {
      set({ isCreating: false });
    }
  },
}));
