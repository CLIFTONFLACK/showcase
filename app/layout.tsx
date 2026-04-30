import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gut-Friendly Recipes | EPAVANCE',
  description: 'Anti-inflammatory, whole-food recipes designed to support people living with IBD. Gluten-free, dairy-free, and nutrient-dense meals for every occasion.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* No site header / footer — this app is embedded inside the EPAVANCE ecommerce page,
            which provides its own chrome. Keep the surface clean. Disclaimers live on the
            recipe detail pages where they're contextually relevant. */}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
