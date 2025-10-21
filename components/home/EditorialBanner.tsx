import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';

interface EditorialBannerProps {
  headline?: string;
  sub?: string;
  href?: string;
  image?: string;
}

export function EditorialBanner({ 
  headline = "Crafted Silhouettes Since 2020",
  sub = "Each piece is meticulously designed to honor tradition while embracing contemporary elegance.",
  href = "/about",
  image
}: EditorialBannerProps) {
  return (
    <section className="py-24 lg:py-32 border-y border-border">
      <Container>
        {image && (
          <div className="relative aspect-[21/9] mb-12 overflow-hidden">
            <Image
              src={image}
              alt={headline}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl lg:text-5xl mb-6 tracking-tightish">
            {headline}
          </h2>
          {sub && (
            <p className="text-lg lg:text-xl text-muted mb-10 leading-relaxed">
              {sub}
            </p>
          )}
          {href && (
            <Link
              href={href}
              className="inline-block px-10 py-4 border-2 border-bmr-black text-sm uppercase tracking-wideish hover:bg-bmr-black hover:text-bmr-white transition-colors"
            >
              Learn More
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
}



