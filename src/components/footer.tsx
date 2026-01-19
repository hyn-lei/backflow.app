import Link from 'next/link';
import { Layers } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Layers className="h-6 w-6" />
          <p className="text-center text-sm leading-loose md:text-left">
            Built for indie hackers. Stop guessing where to post.
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <Link href="/submit" className="hover:text-foreground">
            Submit a Platform
          </Link>
          <span>|</span>
          <span>&copy; {new Date().getFullYear()} BacklinkFlow</span>
        </div>
      </div>
    </footer>
  );
}
