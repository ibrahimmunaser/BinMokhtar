export default function AboutPage() {
  return (
    <div className="bg-surface-1 min-h-screen">
      <div className="container-narrow py-12 lg:py-20">
        <h1 className="font-display text-4xl lg:text-5xl mb-6 text-center">About Bin Mukhtar Retail</h1>
        
        <p className="text-lg text-bmr-muted mb-16 text-center max-w-2xl mx-auto">
          Where tradition meets quality, and modesty meets style
        </p>

        <div className="bg-surface-2 rounded-lg border border-line p-8 lg:p-12 mb-12">
          <div className="space-y-8 text-lg text-bmr-ink leading-relaxed max-w-3xl mx-auto">
            <p>
              Bin Mukhtar Retail is a modest clothing and Islamic wear company dedicated to providing 
              high-quality traditional apparel for men. We specialize in a wide range of thobes and 
              garments that honor heritage, elevate comfort, and meet the needs of modern-day style.
            </p>

            <p>
              At Bin Mukhtar Retail, we believe that modesty and elegance should be accessible to everyone. 
              That's why our collection features both affordable everyday thobes and premium luxury designs—each 
              crafted with care, attention to detail, and exceptional value. Whether you're looking for 
              something simple and refined or a statement piece with elevated fabrics and tailoring, we 
              offer options that suit every preference and occasion.
            </p>

            <p>
              Our mission is to bring timeless Islamic wear to our customers at great prices without 
              compromising quality. With a focus on craftsmanship, comfort, and authenticity, Bin Mukhtar 
              Retail continues to grow as a trusted destination for modest fashion and traditional attire.
            </p>

            <p className="font-medium text-center italic">
              Bin Mukhtar Retail — where tradition meets quality, and modesty meets style.
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
