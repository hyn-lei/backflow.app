import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { GoogleAnalytics } from '@/components/google-analytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BacklinkFlow - SEO & Backlink Management',
  description: 'Manage your SEO and backlink strategy efficiently.',
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-M05YV6XWCG'} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
