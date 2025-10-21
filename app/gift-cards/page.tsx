import { Container } from '@/components/layout/Container';
import { Gift } from 'lucide-react';

export default function GiftCardsPage() {
  return (
    <Container narrow className="py-16 lg:py-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-border mb-6">
          <Gift className="w-8 h-8" />
        </div>
        <h1 className="font-display text-4xl lg:text-5xl mb-4">Gift Cards</h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Share the gift of timeless elegance with a BMR gift card. Perfect for any occasion.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {[50, 100, 200].map((amount) => (
          <div key={amount} className="border border-border p-8 text-center hover:border-bmr-black transition-colors">
            <div className="text-3xl font-display mb-2">${amount}</div>
            <p className="text-sm text-muted mb-6">Gift Card</p>
            <button className="w-full px-6 py-3 bg-bmr-black text-bmr-white text-sm uppercase tracking-wideish hover:bg-bmr-black/90 transition-colors">
              Purchase
            </button>
          </div>
        ))}
      </div>

      <div className="bg-[#F5F5F5] p-8 lg:p-12">
        <h2 className="font-display text-2xl mb-6 text-center">Custom Amount</h2>
        <div className="max-w-md mx-auto">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
              <input
                type="number"
                placeholder="50.00"
                min="10"
                step="10"
                className="w-full pl-8 pr-4 py-3 border border-border bg-bmr-white focus:outline-none focus:border-bmr-black"
              />
            </div>
            <button className="px-8 py-3 bg-bmr-black text-bmr-white text-sm uppercase tracking-wideish hover:bg-bmr-black/90 transition-colors">
              Purchase
            </button>
          </div>
          <p className="text-xs text-muted text-center">Minimum $10, maximum $500</p>
        </div>
      </div>

      <div className="mt-16 space-y-8 text-center max-w-2xl mx-auto">
        <div>
          <h3 className="font-display text-xl mb-2">How It Works</h3>
          <p className="text-muted">
            Purchase a gift card online and receive it instantly via email. The recipient can redeem it at checkout using the unique code.
          </p>
        </div>
        <div>
          <h3 className="font-display text-xl mb-2">Never Expires</h3>
          <p className="text-muted">
            Our gift cards never expire and can be used on any product in our store.
          </p>
        </div>
      </div>
    </Container>
  );
}




