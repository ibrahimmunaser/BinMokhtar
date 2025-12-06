import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TopBar } from '@/components/layout/TopBar';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Footer } from '@/components/layout/Footer';
import { defaultMetadata } from '@/lib/seo';
import './globals.css';

// Font configurations
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable}`}
    >
      <body>
        <AuthProvider>
        <LocaleProvider>
          <ToastProvider>
          <TopBar />
          <SiteHeader />
          <main className="min-h-screen">{children}</main>
          <Footer />
          </ToastProvider>
        </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}



