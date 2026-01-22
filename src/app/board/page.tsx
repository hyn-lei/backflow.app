'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { KanbanBoard } from '@/components/kanban-board';
import { useAuth } from '@/hooks/use-auth';
import { useBoardStore } from '@/stores/board-store';
import { useProjectStore } from '@/stores/project-store';

export default function BoardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { items, isLoading: boardLoading, fetchBoard } = useBoardStore();
  const { currentProjectId } = useProjectStore();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (currentProjectId) {
      fetchBoard(currentProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const actionableItems = items.filter((item) => item.status !== 'rejected');
  const completedCount = actionableItems.filter((item) => item.status === 'live').length;
  const progressPercent = actionableItems.length > 0
    ? Math.round((completedCount / actionableItems.length) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">My Board</h1>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Progress: {completedCount}/{items.length} Live ({progressPercent}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'board'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              Board
            </button>
          </div>
        </div>

        {/* Board Content */}
        {!currentProjectId ? (
          <div className="text-center py-12 text-muted-foreground">
            Select a project to view its board.
          </div>
        ) : boardLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading your board...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Your board is empty. Start by adding platforms from the directory.
            </p>
            <a
              href="/"
              className="text-primary hover:underline"
            >
              Browse platforms
            </a>
          </div>
        ) : (
          <KanbanBoard items={items} viewMode={viewMode} />
        )}
      </main>

      <Footer />
    </div>
  );
}
