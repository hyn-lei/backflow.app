'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Category } from '@/lib/directus';

interface FilterSidebarProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  costFilter: string;
  onCostFilterChange: (cost: string) => void;
}

export function FilterSidebar({
  categories,
  selectedCategories,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  costFilter,
  onCostFilterChange,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6 p-4 bg-card rounded-lg border border-border">
      <div>
        <h3 className="font-semibold mb-3 text-foreground">Search</h3>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search platforms..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-foreground">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={() => onCategoryChange(category.id)}
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-foreground">Cost Type</h3>
        <div className="space-y-2">
          {['all', 'free', 'paid', 'freemium'].map((cost) => (
            <label
              key={cost}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="cost"
                checked={costFilter === cost}
                onChange={() => onCostFilterChange(cost)}
                className="h-4 w-4 border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
              />
              <span className="text-sm text-foreground capitalize group-hover:text-primary transition-colors">
                {cost === 'all' ? 'All' : cost}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
