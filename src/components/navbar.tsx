'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LayoutDashboard, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const navLinks = [
    { href: '/', label: 'Directory', icon: Layers },
    { href: '/board', label: 'My Board', icon: LayoutDashboard, protected: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Layers className="h-6 w-6" />
          <span className="font-bold">BacklinkFlow</span>
        </Link>

        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => {
            if (link.protected && !user) return null;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center space-x-1 transition-colors hover:text-foreground/80',
                  pathname === link.href ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {isLoading ? (
            <Button variant="ghost" size="sm" disabled>
              Loading...
            </Button>
          ) : user ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name || ''} className="h-8 w-8 rounded-full" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="hidden md:inline">{user.name || user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
