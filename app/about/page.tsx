export default function AboutPage() {
  return (
    <div className="bg-surface-1 min-h-screen">
      <div className="container-narrow py-12 lg:py-20">
        <h1 className="font-display text-4xl lg:text-5xl mb-6 text-center">About Bin Mukhtar Retail</h1>
        
        <p className="text-lg text-bmr-muted mb-16 text-center max-w-2xl mx-auto">
          Your premier destination for authentic traditional Islamic attire
        </p>

        <div className="bg-surface-2 rounded-lg border border-line p-8 lg:p-12 mb-12">
          <div className="space-y-8 text-lg text-bmr-ink leading-relaxed max-w-3xl mx-auto">
            <p>
              Welcome to Bin Mukhtar Retail, where tradition meets timeless elegance. For over a decade, 
              we've been dedicated to providing the finest quality thobes, shemaghs, and modest Islamic attire 
              for discerning customers worldwide.
            </p>

            <p>
              Our journey began with a simple mission: to make authentic, high-quality Islamic clothing 
              accessible to everyone. Today, we proudly serve thousands of customers across the globe, 
              from our roots in the Middle East to communities in North America, Europe, and beyond.
            </p>

            <p>
              Every piece in our collection is carefully selected for its quality, craftsmanship, and 
              cultural authenticity. We work directly with skilled artisans and trusted manufacturers 
              to ensure that each garment meets our exacting standards.
            </p>
          </div>
        </div>

        {/* Values */}
        <h2 className="font-display text-3xl lg:text-4xl mb-12 text-center">Our Values</h2>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            {
              title: 'Quality',
              description: 'We source only premium fabrics and work with skilled artisans to ensure every garment meets our high standards of excellence.',
            },
            {
              title: 'Authenticity',
              description: 'Our designs respect traditional Islamic clothing styles while incorporating modern comfort and contemporary fit.',
            },
            {
              title: 'Service',
              description: "We're committed to providing exceptional customer service and ensuring your complete satisfaction with every purchase.",
            },
          ].map((value) => (
            <div key={value.title} className="bg-surface-2 rounded-lg border border-line p-8 text-center">
              <h3 className="font-display text-2xl mb-4">{value.title}</h3>
              <p className="text-bmr-muted leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Why Choose Us */}
        <div className="bg-bmr-night text-surface-2 rounded-lg p-8 lg:p-12">
          <h2 className="font-display text-3xl lg:text-4xl mb-8 text-center">Why Choose Us?</h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              'Curated selection of authentic Islamic attire',
              'Premium quality fabrics and craftsmanship',
              'Wide range of sizes and styles for the whole family',
              'Fast, reliable worldwide shipping',
              'Easy returns and exchanges within 14 days',
              'Responsive customer support team',
            ].map((reason) => (
              <div key={reason} className="flex items-start gap-3">
                <svg className="w-6 h-6 text-bmr-acc-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="opacity-90">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div className="mt-20 text-center">
          <p className="text-lg text-bmr-muted mb-8">
            Thank you for choosing Bin Mukhtar Retail. We look forward to serving you and your family.
          </p>
          <a href="/shop" className="btn-primary inline-block">
            Shop Our Collection
          </a>
        </div>
      </div>
    </div>
  );
}
