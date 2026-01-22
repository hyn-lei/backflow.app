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
import { useBoardStore } from '@/stores/board-store';
import { useProjectStore } from '@/stores/project-store';

interface DirectoryClientProps {
  categories: Category[];
}

export function DirectoryClient({ categories }: DirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [costFilter, setCostFilter] = useState('all');
  const [recommendedPlatforms, setRecommendedPlatforms] = useState<Platform[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const { fetchBoard } = useBoardStore();
  const { currentProjectId, projects } = useProjectStore();
  const currentProject = projects.find((p) => p.id === currentProjectId);

  useEffect(() => {
    if (currentProjectId) {
      fetchBoard(currentProjectId);
    }
  }, [currentProjectId, fetchBoard]);

  useEffect(() => {
    if (!currentProjectId) {
      setRecommendedPlatforms([]);
      return;
    }

    const run = async () => {
      setIsLoadingRecommendations(true);
      try {
        const res = await fetch(`/api/recommendations?projectId=${currentProjectId}`);
        if (!res.ok) throw new Error('Failed to fetch recommendations');
        const data = await res.json();
        setRecommendedPlatforms(data.items || []);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
        setRecommendedPlatforms([]);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    run();
  }, [currentProjectId]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredPlatforms = useMemo(() => {
    return recommendedPlatforms.filter((platform) => {
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
  }, [recommendedPlatforms, searchQuery, costFilter, selectedCategories]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/40 bg-background pt-16 pb-20 md:pt-24 md:pb-32">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                SEO & Backlink Management
              </div>
              <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent pb-2">
                Build your Backlink Strategy
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
                Discover curated platforms, track your submissions, and grow your SEO presence with data-driven insights.
              </p>
              {!user && (
                <div className="flex items-center justify-center gap-4">
                  <Link href="/sign-up">
                    <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-xl shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#directory">
                    <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
                      Explore Platforms
                    </Button>
                  </Link>
                </div>
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
                    {currentProject?.name ? `Recommended for ${currentProject.name}` : 'Recommended Platforms'}
                    <span className="text-muted-foreground"> ({filteredPlatforms.length})</span>
                  </h2>
                </div>

                {!currentProjectId ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Select or create a project to see personalized recommendations.
                  </div>
                ) : isLoadingRecommendations ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading recommendations...
                  </div>
                ) : filteredPlatforms.length === 0 ? (
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
