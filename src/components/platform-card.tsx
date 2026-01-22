'use client';

import Link from 'next/link';
import { ExternalLink, Plus, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Platform, getDirectusFileUrl } from '@/lib/directus';
import { useAuth } from '@/hooks/use-auth';
import { useBoardStore } from '@/stores/board-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useProjectStore } from '@/stores/project-store';

interface PlatformCardProps {
  platform: Platform;
}

export function PlatformCard({ platform }: PlatformCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { items, addToBoard, isAdding } = useBoardStore();
  const { currentProjectId } = useProjectStore();

  const isAdded = items.some((item) => {
    if (!item.platform_id) return false;
    if (typeof item.platform_id === 'number') {
      return item.platform_id === platform.id;
    }
    return item.platform_id.id === platform.id;
  });

  const getDaBadgeVariant = (da: number) => {
    if (da >= 70) return 'success';
    if (da >= 40) return 'warning';
    return 'secondary';
  };

  const handleAddToBoard = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    try {
      if (!currentProjectId) {
        toast.error('Create or select a project first');
        return;
      }
      await addToBoard(platform.id, currentProjectId);
      toast.success(`Added ${platform.name} to your board`);
    } catch {
      toast.error('Failed to add to board');
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-border/50 bg-background/50 hover:bg-background hover:border-primary/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {platform.logo ? (
              <img
                src={getDirectusFileUrl(platform.logo) || ''}
                alt={platform.name}
                className="h-12 w-12 rounded-xl object-cover border border-border shadow-sm group-hover:shadow-md transition-all"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-border group-hover:border-primary/20 transition-colors">
                <span className="text-lg font-bold text-primary font-heading">
                  {platform.name[0]}
                </span>
              </div>
            )}
            <div>
              <Link href={`/platform/${platform.slug}`}>
                <h3 className="font-heading font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-lg tracking-tight">{platform.name}</h3>
              </Link>
              <a
                href={platform.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center transition-colors font-medium mt-0.5"
              >
                Visit site <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
              </a>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {platform.description || 'No description available.'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant={getDaBadgeVariant(platform.domain_authority)} className="shadow-sm">
              DA: {platform.domain_authority}
            </Badge>
            <Badge variant={platform.cost_type === 'free' ? 'success' : 'secondary'} className="shadow-sm">
              {platform.cost_type.charAt(0).toUpperCase() + platform.cost_type.slice(1)}
            </Badge>
          </div>

          <Button
            size="sm"
            variant={isAdded ? 'secondary' : 'default'}
            onClick={handleAddToBoard}
            disabled={isAdded || isAdding}
            className={`transition-all duration-300 ${isAdded ? 'bg-secondary/80' : 'shadow-md shadow-primary/20 hover:shadow-primary/40'}`}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
