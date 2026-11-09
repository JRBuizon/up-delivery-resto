// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UP Food Delivery - Vendor Portal',
  description: 'Manage menu items and live orders for your campus eatery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#F8F9FA', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}