import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Bin Mukhtar Retail — shipping, sizing, returns, and our product collection.',
  openGraph: {
    title: 'FAQ — Bin Mukhtar Retail',
    description: 'Answers to common questions about orders, sizing, delivery, and our thobes.',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
