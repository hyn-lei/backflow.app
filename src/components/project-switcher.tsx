'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useProjectStore } from '@/stores/project-store';
import { cn } from '@/lib/utils';

export function ProjectSwitcher() {
  const { user } = useAuth();
  const {
    projects,
    currentProjectId,
    isLoading,
    setCurrentProject,
    fetchProjects,
  } = useProjectStore();

  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const shouldForceOpen = Boolean(user && !isLoading && projects.length === 0);
  const isModalOpen = shouldForceOpen || showCreate;

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) || null,
    [projects, currentProjectId]
  );

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="secondary"
        className="rounded-full px-4 h-9 shadow-sm"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-xs uppercase tracking-wider text-muted-foreground mr-2">
          Current Project
        </span>
        <span className="font-semibold">
          {currentProject?.name || 'Select Project'}
        </span>
        <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
      </Button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl border border-border bg-background shadow-xl z-50">
          <div className="p-2 space-y-1">
            {projects.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No projects yet.
              </div>
            )}
            {projects.map((project) => (
              <button
                key={project.id}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  project.id === currentProjectId
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
                onClick={() => {
                  setCurrentProject(project.id);
                  setOpen(false);
                }}
              >
                {project.name}
              </button>
            ))}
          </div>
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setShowCreate(true);
                setOpen(false);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Project
            </Button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ProjectCreateModal
          forceOpen={shouldForceOpen}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

interface ProjectCreateModalProps {
  forceOpen: boolean;
  onClose: () => void;
}

function ProjectCreateModal({ forceOpen, onClose }: ProjectCreateModalProps) {
  const {
    categories,
    isLoadingCategories,
    fetchCategories,
    createProject,
    isCreating,
  } = useProjectStore();
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [prefillGeneral, setPrefillGeneral] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      await createProject({
        name: name.trim(),
        website_url: websiteUrl.trim() || null,
        tagIds: selectedTags,
        prefillGeneral,
      });
      setName('');
      setWebsiteUrl('');
      setSelectedTags([]);
      if (!forceOpen) onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Add New Project</h2>
            <p className="text-sm text-muted-foreground">
              Tell us what you want to promote to unlock personalized recommendations.
            </p>
          </div>
          {!forceOpen && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Close
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MindMap AI"
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Website URL</label>
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://mindmap.ai"
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {isLoadingCategories && (
                <span className="text-sm text-muted-foreground">Loading tags...</span>
              )}
              {!isLoadingCategories &&
                categories.map((category) => {
                  const active = selectedTags.includes(category.id);
                  return (
                    <Badge
                      key={category.id}
                      variant={active ? 'default' : 'secondary'}
                      className={cn(
                        'cursor-pointer hover:opacity-80',
                        active ? 'bg-primary text-primary-foreground' : ''
                      )}
                      onClick={() => toggleTag(category.id)}
                    >
                      {category.name}
                    </Badge>
                  );
                })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={prefillGeneral}
              onChange={(e) => setPrefillGeneral(e.target.checked)}
              className="rounded border-border"
            />
            Auto-add must-have platforms (General)
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={isCreating}
          >
            <Rocket className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Start Building'}
          </Button>
        </div>
      </div>
    </div>
  );
}
