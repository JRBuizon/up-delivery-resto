// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'UP Delivery - Merchant Portal',
  description: 'Manage your campus restaurant orders and menu.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif', backgroundColor: '#FAFAFA' }}>
        {children}
      </body>
    </html>
  );
}