'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PlatformCard } from '@/components/platform-card';
import { FilterSidebar } from '@/components/filter-sidebar';
import { Platform, Category } from '@/lib/directus';
import { useAuth } from '@/hooks/use-auth';
import { useBoardStore } from '@/stores/board-store';

interface DirectoryClientProps {
  platforms: Platform[];
  categories: Category[];
}

export function DirectoryClient({ platforms, categories }: DirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [costFilter, setCostFilter] = useState('all');

  const { user } = useAuth();
  const { fetchBoard } = useBoardStore();

  useEffect(() => {
    if (user) {
      fetchBoard(user.id);
    }
  }, [user, fetchBoard]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredPlatforms = useMemo(() => {
    return platforms.filter((platform) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !platform.name.toLowerCase().includes(query) &&
          !platform.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Cost filter
      if (costFilter !== 'all' && platform.cost_type !== costFilter) {
        return false;
      }

      // Category filter
      if (selectedCategories.length > 0) {
        const platformCategoryIds = platform.categories?.map((c) =>
          typeof c.categories_id === 'string' ? c.categories_id : c.categories_id?.id
        ) || [];
        if (!selectedCategories.some((id) => platformCategoryIds.includes(id))) {
          return false;
        }
      }

      return true;
    });
  }, [platforms, searchQuery, costFilter, selectedCategories]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-muted/30">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Build your Backlink Strategy
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover platforms, track submissions, and grow your SEO presence.
              </p>
              {!user && (
                <Link href="/sign-up">
                  <Button size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Directory Section */}
        <section className="py-12">
          <div className="container">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar */}
              <aside className="w-full md:w-64 shrink-0">
                <FilterSidebar
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onCategoryChange={handleCategoryChange}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  costFilter={costFilter}
                  onCostFilterChange={setCostFilter}
                />
              </aside>

              {/* Platform Grid */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">
                    Platforms ({filteredPlatforms.length})
                  </h2>
                </div>

                {filteredPlatforms.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No platforms found matching your filters.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPlatforms.map((platform) => (
                      <PlatformCard key={platform.id} platform={platform} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
