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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8C59FE" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ORBIT Marketing Hub" />
        <link rel="icon" type="image/png" sizes="192x192" href="/images/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/images/icon-512.png" />
        <link rel="apple-touch-icon" href="/images/icon-192.png" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(reg) { console.log('SW registrado'); })
                  .catch(function(err) { console.log('SW error:', err); });
              });
            }
          `
        }} />
      </head>
      <body style={{ height: '100vh', overflow: 'hidden', backgroundColor: '#0F172A' }}>
        <InstallBanner />
        {children}
      </body>
    </html>
  );
}
