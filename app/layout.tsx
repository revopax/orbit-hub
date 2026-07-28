import type { Metadata } from 'next';
import { InstallBanner } from './components/shared/InstallBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'ORBIT Marketing Hub',
  description: 'Marketing Corp · Grupo UPAX',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#262a3d" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/orbit-icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/orbit-icon-512.png" />
        <link rel="apple-touch-icon" href="/orbit-icon-192.png" />
      </head>
      <body style={{ height: '100vh', overflow: 'hidden', margin: 0 }}>
        <InstallBanner />
        {children}
      </body>
    </html>
  );
}
