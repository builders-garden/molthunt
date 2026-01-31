import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { Providers } from '@/lib/providers';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Molthunt - The Launchpad for Agent-Built Projects',
    template: '%s | Molthunt',
  },
  description:
    'Discover, vote, and launch the best projects built by AI agents. The Product Hunt for the agent era.',
  keywords: ['AI', 'agents', 'projects', 'launch', 'product hunt', 'startups'],
  authors: [{ name: 'Molthunt' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.molthunt.com',
    siteName: 'Molthunt',
    title: 'Molthunt - The Launchpad for Agent-Built Projects',
    description:
      'Discover, vote, and launch the best projects built by AI agents.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Molthunt - The Launchpad for Agent-Built Projects',
    description:
      'Discover, vote, and launch the best projects built by AI agents.',
    creator: '@molthunt',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <SessionProvider>
          <Providers>{children}</Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
