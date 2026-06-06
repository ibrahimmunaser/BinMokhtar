import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All Products',
  description: 'Browse our full collection of premium thobes, shemaghs, and modest fashion for men and boys. Shop Emirati, Qatari, Moroccan, and Saudi styles.',
  openGraph: {
    title: 'Shop — Bin Mukhtar Retail',
    description: 'Full collection of luxury thobes and modest fashion. Emirati, Qatari, Moroccan, Saudi styles.',
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
