import { Package, RotateCcw, Scissors } from 'lucide-react';
import { Container } from '@/components/layout/Container';

interface USPStripProps {
  items: string[];
}

export function USPStrip({ items }: USPStripProps) {
  const icons = [Package, RotateCcw, Scissors];

  return (
    <section className="border-y border-border py-8">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x divide-border">
          {items.slice(0, 3).map((item, index) => {
            const Icon = icons[index];
            return (
              <div key={index} className="flex items-center justify-center gap-3 text-center">
                <Icon className="w-5 h-5 text-bmr-black flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm">{item}</span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}




