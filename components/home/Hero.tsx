import Link from 'next/link';
import { Container } from '@/components/layout/Container';

interface HeroProps {
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
}

export function Hero({ headline, subline, ctaLabel, ctaHref }: HeroProps) {
  return (
    <section className="py-24 lg:py-32 bg-bmr-white">
      <Container narrow>
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tightish text-balance">
            {headline}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl mx-auto">
            {subline}
          </p>
          <Link
            href={ctaHref}
            className="inline-block mt-8 px-12 py-4 bg-bmr-black text-bmr-white text-sm uppercase tracking-wideish hover:bg-bmr-black/90 transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>
      </Container>
    </section>
  );
}




