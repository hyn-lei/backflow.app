'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Link2, LayoutDashboard, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { ProjectSwitcher } from '@/components/project-switcher';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const navLinks = [
    { href: '/', label: 'Platforms', icon: Link2 },
    { href: '/board', label: 'My Board', icon: LayoutDashboard, protected: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2 transition-opacity hover:opacity-90">
          <Image src="/web-app-manifest-512x512.png" alt="BacklinkFlow" width={32} height={32} className="rounded-lg" />
          <span className="font-heading font-bold text-lg tracking-tight">BacklinkFlow</span>
        </Link>

        <ProjectSwitcher />

        <nav className="flex flex-1 items-center space-x-1 text-sm font-medium">
          {navLinks.map((link) => {
            if (link.protected && !user) return null;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center space-x-2 rounded-full px-4 py-2 transition-all hover:bg-secondary/80 hover:text-foreground',
                  pathname === link.href ? 'bg-secondary text-foreground font-semibold' : 'text-muted-foreground'
                )}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 text-sm">
                <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-border">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link href="/sign-in">
              <Button variant="default" size="sm" className="rounded-full px-6 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
