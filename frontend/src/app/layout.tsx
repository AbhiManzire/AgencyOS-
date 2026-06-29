import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { OfflineBanner } from '@/components/offline-banner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AgencyOS',
  description: 'Enterprise Operating System for Digital Marketing Agencies',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
