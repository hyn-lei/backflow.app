import Link from 'next/link';
import { Layers } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container py-8 md:py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-lg">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Built for <span className="text-foreground font-semibold">indie hackers</span>. Manage your backlink strategy.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/submit" className="font-medium text-muted-foreground transition-colors hover:text-primary hover:underline underline-offset-4">
              Submit a Platform
            </Link>
            <span className="h-4 w-px bg-border/60" />
            <span className="text-muted-foreground/60">&copy; {new Date().getFullYear()} BacklinkFlow</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
