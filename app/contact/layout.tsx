import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Bin Mukhtar Retail. Questions about our thobes, orders, or sizing? We\'re here to help.',
  openGraph: {
    title: 'Contact Bin Mukhtar Retail',
    description: 'Reach out to our team for questions about orders, products, or sizing.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
