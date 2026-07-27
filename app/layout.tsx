import type { Metadata } from 'next';
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
        <meta name="theme-color" content="#8C59FE" />
      </head>
      <body style={{ height: '100vh', overflow: 'hidden', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
