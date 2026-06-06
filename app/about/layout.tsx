import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Bin Mukhtar Retail — where tradition meets quality and modesty meets style. Premium thobes and modest fashion for men in Dearborn, Michigan.',
  openGraph: {
    title: 'About Bin Mukhtar Retail',
    description: 'Premium thobes and modest fashion. Our story, values, and commitment to quality Islamic apparel.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
