import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { VeriSaglayici } from '@/lib/durum';
import { Kabuk } from '@/components/Kabuk';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Saha46 Yönetim',
    template: '%s — Saha46 Yönetim',
  },
  description: 'Saha46 moderasyon ve yönetim paneli.',
  // Panel arama motorlarına kapalıdır.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0097B2" />
      </head>
      <body>
        <VeriSaglayici>
          <Kabuk>{children}</Kabuk>
        </VeriSaglayici>
      </body>
    </html>
  );
}
