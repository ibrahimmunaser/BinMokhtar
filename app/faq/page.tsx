'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    category: 'Orders & Shipping',
    questions: [
      {
        q: 'How long does shipping take?',
        a: 'Standard shipping takes 5-7 business days within the US. International shipping takes 10-14 business days. Express shipping options are available at checkout.',
      },
      {
        q: 'Do you offer free shipping?',
        a: 'Yes! We offer free standard shipping on all orders over $99. Orders under $99 have a flat shipping rate of $9.99.',
      },
      {
        q: 'Can I track my order?',
        a: 'Absolutely! Once your order ships, you'll receive a tracking number via email. You can also track your order on our Track Order page.',
      },
    ],
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 14 days of delivery. Items must be unworn, unwashed, and in original condition with tags attached.',
      },
      {
        q: 'How do I initiate a return?',
        a: 'Contact our customer service team with your order number. We'll provide you with a return label and instructions.',
      },
      {
        q: 'Do you offer exchanges?',
        a: 'Yes! We're happy to exchange items for a different size or color. Contact us within 14 days of receiving your order.',
      },
    ],
  },
  {
    category: 'Products & Sizing',
    questions: [
      {
        q: 'How do I choose the right size?',
        a: 'Please refer to our detailed Size Guide page. We provide measurements for height, chest, and length. If you're between sizes, we recommend sizing up.',
      },
      {
        q: 'What fabrics do you use?',
        a: 'We use premium cotton blends, pure cotton, and polyester blends depending on the product. Each product page lists specific fabric composition.',
      },
      {
        q: 'Are your thobes pre-shrunk?',
        a: 'Yes, most of our thobes are pre-shrunk to minimize shrinkage. However, we recommend following care instructions carefully.',
      },
    ],
  },
  {
    category: 'Payment & Security',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, and Google Pay.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Absolutely. We use industry-standard SSL encryption and never store your full credit card information on our servers.',
      },
      {
        q: 'Can I use multiple payment methods?',
        a: 'Currently, we accept one payment method per order. However, you can use gift cards in combination with other payment methods.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-surface-1 min-h-screen">
      <div className="container-narrow py-12 lg:py-20">
        <h1 className="font-display text-4xl lg:text-5xl mb-6 text-center">Frequently Asked Questions</h1>
        
        <p className="text-lg text-bmr-muted mb-16 text-center max-w-2xl mx-auto">
          Find answers to common questions about orders, shipping, returns, and more
        </p>

        <div className="space-y-12">
          {faqs.map((category, catIndex) => (
            <div key={category.category}>
              <h2 className="font-display text-2xl lg:text-3xl mb-6">{category.category}</h2>

              <div className="bg-surface-2 rounded-lg border border-line overflow-hidden">
                {category.questions.map((faq, qIndex) => {
                  const id = `faq-${catIndex}-${qIndex}`;
                  const isOpen = openItems.includes(id);

                  return (
                    <div key={id} className="border-b border-line last:border-0">
                      <button
                        onClick={() => toggleItem(id)}
                        className="w-full px-6 lg:px-8 py-6 flex items-center justify-between gap-4 text-left hover:bg-surface-3 transition-colors"
                      >
                        <span className="font-medium text-lg pr-4">{faq.q}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-bmr-muted transition-transform flex-shrink-0 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-6 lg:px-8 pb-6">
                          <p className="text-bmr-muted leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-20 bg-bmr-night text-surface-2 rounded-lg p-8 lg:p-12 text-center">
          <h2 className="font-display text-2xl lg:text-3xl mb-4">Still have questions?</h2>
          <p className="opacity-90 mb-8 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our customer support team is here to help.
          </p>
          <a href="/contact" className="inline-block bg-surface-2 text-bmr-ink px-8 py-4 rounded-lg font-medium hover:bg-surface-3 transition-colors">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
