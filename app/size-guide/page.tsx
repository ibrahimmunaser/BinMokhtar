export default function SizeGuidePage() {
  // Full thobe size chart data
  const thobeSizes = [
    { size: '30', heightFt: '2\'11" – 3\'1"', heightCm: '90–95 cm' },
    { size: '32', heightFt: '3\'2" – 3\'3"', heightCm: '96–100 cm' },
    { size: '34', heightFt: '3\'4" – 3\'5"', heightCm: '101–105 cm' },
    { size: '36', heightFt: '3\'6" – 3\'7"', heightCm: '106–110 cm' },
    { size: '38', heightFt: '3\'8" – 3\'10"', heightCm: '111–117 cm' },
    { size: '40', heightFt: '3\'11" – 4\'1"', heightCm: '118–125 cm' },
    { size: '42', heightFt: '4\'2" – 4\'3"', heightCm: '126–130 cm' },
    { size: '44', heightFt: '4\'4" – 4\'5"', heightCm: '131–135 cm' },
    { size: '46', heightFt: '4\'6" – 4\'7"', heightCm: '136–140 cm' },
    { size: '48', heightFt: '4\'8" – 4\'10"', heightCm: '141–147 cm' },
    { size: '50', heightFt: '4\'11" – 5\'3"', heightCm: '150–160 cm' },
    { size: '52', heightFt: '5\'4" – 5\'5"', heightCm: '162–165 cm' },
    { size: '54', heightFt: '5\'6" – 5\'7"', heightCm: '167–170 cm' },
    { size: '55', heightFt: '5\'7" – 5\'8"', heightCm: '170–173 cm' },
    { size: '56', heightFt: '5\'9" – 5\'10"', heightCm: '175–178 cm' },
    { size: '57', heightFt: '5\'10" – 5\'11"', heightCm: '178–180 cm' },
    { size: '58', heightFt: '6\'0" – 6\'1"', heightCm: '183–185 cm' },
    { size: '59', heightFt: '6\'1" – 6\'2"', heightCm: '185–188 cm' },
    { size: '60', heightFt: '6\'2" – 6\'3"', heightCm: '188–190 cm' },
    { size: '62', heightFt: '6\'4" – 6\'6"', heightCm: '193–198 cm' },
  ];

  // Kids sizes (30-50)
  const kidsSizes = thobeSizes.filter(s => parseInt(s.size) <= 50);
  // Adult sizes (52-62)
  const adultSizes = thobeSizes.filter(s => parseInt(s.size) >= 52);

  return (
    <div className="bg-surface-1 min-h-screen">
      <div className="container-narrow py-12 lg:py-20">
        <h1 className="font-display text-4xl lg:text-5xl mb-6 text-center">Size Guide</h1>
        
        <p className="text-lg text-bmr-muted mb-16 text-center max-w-2xl mx-auto">
          Find your perfect thobe size based on your height. Our sizes range from 30 to 62.
        </p>

        {/* Adult Sizes (52-62) */}
        <div className="bg-surface-2 rounded-lg border border-line p-8 lg:p-12 mb-12">
          <h2 className="font-display text-2xl lg:text-3xl mb-4">Men's Thobe Sizes</h2>
          <p className="text-bmr-muted mb-8">Sizes 52–62 for adults</p>
          
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-line bg-surface-3">
                  <th className="py-4 px-6 font-semibold">Thobe Size</th>
                  <th className="py-4 px-6 font-semibold">Height (ft/in)</th>
                  <th className="py-4 px-6 font-semibold">Height (cm)</th>
                </tr>
              </thead>
              <tbody className="text-bmr-muted">
                {adultSizes.map((size, index) => (
                  <tr 
                    key={size.size} 
                    className={`border-b border-line hover:bg-surface-3 transition-colors ${
                      index % 2 === 0 ? 'bg-surface-1' : ''
                    }`}
                  >
                    <td className="py-4 px-6 font-bold text-bmr-ink text-lg">{size.size}</td>
                    <td className="py-4 px-6">{size.heightFt}</td>
                    <td className="py-4 px-6">{size.heightCm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kids Sizes (30-50) */}
        <div className="bg-surface-2 rounded-lg border border-line p-8 lg:p-12 mb-12">
          <h2 className="font-display text-2xl lg:text-3xl mb-4">Boys' Thobe Sizes</h2>
          <p className="text-bmr-muted mb-8">Sizes 30–50 for children</p>
          
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-line bg-surface-3">
                  <th className="py-4 px-6 font-semibold">Thobe Size</th>
                  <th className="py-4 px-6 font-semibold">Height (ft/in)</th>
                  <th className="py-4 px-6 font-semibold">Height (cm)</th>
                </tr>
              </thead>
              <tbody className="text-bmr-muted">
                {kidsSizes.map((size, index) => (
                  <tr 
                    key={size.size} 
                    className={`border-b border-line hover:bg-surface-3 transition-colors ${
                      index % 2 === 0 ? 'bg-surface-1' : ''
                    }`}
                  >
                    <td className="py-4 px-6 font-bold text-bmr-ink text-lg">{size.size}</td>
                    <td className="py-4 px-6">{size.heightFt}</td>
                    <td className="py-4 px-6">{size.heightCm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to Measure */}
        <div className="bg-surface-2 rounded-lg border border-line p-8 lg:p-12 mb-12">
          <h2 className="font-display text-2xl lg:text-3xl mb-6">How to Measure</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-surface-3 rounded-lg p-6 border border-line">
              <div className="w-12 h-12 bg-bmr-ink text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
              <h3 className="font-semibold text-lg mb-2">Measure Your Height</h3>
              <p className="text-bmr-muted">
                Stand straight against a wall without shoes. Measure from the floor to the top of your head.
              </p>
            </div>
            <div className="bg-surface-3 rounded-lg p-6 border border-line">
              <div className="w-12 h-12 bg-bmr-ink text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
              <h3 className="font-semibold text-lg mb-2">Find Your Size</h3>
              <p className="text-bmr-muted">
                Match your height measurement to the corresponding thobe size in the chart above.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              <strong>💡 Tip:</strong> If you're between sizes, we recommend choosing the larger size for a more comfortable fit.
            </p>
          </div>
        </div>

        {/* Fit Tips */}
        <div className="bg-bmr-night text-surface-2 rounded-lg p-8 lg:p-12">
          <h2 className="font-display text-2xl lg:text-3xl mb-6">Fit Tips</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3 text-lg">Classic Fit</h3>
              <p className="opacity-90">
                Our classic fit thobes offer a relaxed, comfortable silhouette with room for movement. 
                Ideal for daily wear and traditional styling.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-lg">Slim Fit</h3>
              <p className="opacity-90">
                Slim fit thobes are tailored closer to the body for a modern, streamlined appearance. 
                Perfect for formal occasions and contemporary style.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-center opacity-90">
              Still unsure about sizing?{' '}
              <a href="/contact" className="underline hover:no-underline font-medium">
                Contact our team
              </a>{' '}
              for personalized assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
