export default function SizeGuidePage() {
  return (
    <div className="bg-surface-1 min-h-screen">
      <div className="container-narrow py-12 lg:py-20">
        <h1 className="font-display text-4xl lg:text-5xl mb-6 text-center">Size Guide</h1>
        
        <p className="text-lg text-bmr-muted mb-16 text-center max-w-2xl mx-auto">
          Find your perfect fit with our comprehensive sizing guide
        </p>

        {/* Thobes Size Guide */}
        <div className="bg-surface-2 rounded-lg border border-line p-8 lg:p-12 mb-12">
          <h2 className="font-display text-2xl lg:text-3xl mb-8">Thobes Size Guide</h2>
          
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-line">
                  <th className="py-4 px-4 font-medium">Size</th>
                  <th className="py-4 px-4 font-medium">Height (cm)</th>
                  <th className="py-4 px-4 font-medium">Chest (cm)</th>
                  <th className="py-4 px-4 font-medium">Length (cm)</th>
                </tr>
              </thead>
              <tbody className="text-bmr-muted">
                <tr className="border-b border-line hover:bg-surface-3">
                  <td className="py-4 px-4 font-medium">S</td>
                  <td className="py-4 px-4">160-165</td>
                  <td className="py-4 px-4">90-95</td>
                  <td className="py-4 px-4">140</td>
                </tr>
                <tr className="border-b border-line hover:bg-surface-3">
                  <td className="py-4 px-4 font-medium">M</td>
                  <td className="py-4 px-4">165-175</td>
                  <td className="py-4 px-4">95-105</td>
                  <td className="py-4 px-4">145</td>
                </tr>
                <tr className="border-b border-line hover:bg-surface-3">
                  <td className="py-4 px-4 font-medium">L</td>
                  <td className="py-4 px-4">175-180</td>
                  <td className="py-4 px-4">105-115</td>
                  <td className="py-4 px-4">150</td>
                </tr>
                <tr className="border-b border-line hover:bg-surface-3">
                  <td className="py-4 px-4 font-medium">XL</td>
                  <td className="py-4 px-4">180-185</td>
                  <td className="py-4 px-4">115-125</td>
                  <td className="py-4 px-4">155</td>
                </tr>
                <tr className="hover:bg-surface-3">
                  <td className="py-4 px-4 font-medium">XXL</td>
                  <td className="py-4 px-4">185-190</td>
                  <td className="py-4 px-4">125-135</td>
                  <td className="py-4 px-4">160</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-surface-3 rounded-lg p-6 border border-line">
            <h3 className="font-medium mb-3">How to Measure</h3>
            <ul className="space-y-2 text-bmr-muted">
              <li><strong>Height:</strong> Stand straight against a wall and measure from floor to top of head</li>
              <li><strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape parallel to the floor</li>
              <li><strong>Length:</strong> Measure from the top of your shoulder to your desired thobe length</li>
            </ul>
          </div>
        </div>

        {/* Kids Size Guide */}
        <div className="bg-surface-2 rounded-lg border border-line p-8 lg:p-12 mb-12">
          <h2 className="font-display text-2xl lg:text-3xl mb-8">Kids Size Guide</h2>
          
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-line">
                  <th className="py-4 px-4 font-medium">Age</th>
                  <th className="py-4 px-4 font-medium">Height (cm)</th>
                  <th className="py-4 px-4 font-medium">Chest (cm)</th>
                  <th className="py-4 px-4 font-medium">Length (cm)</th>
                </tr>
              </thead>
              <tbody className="text-bmr-muted">
                {[
                  { age: '4Y', height: '100-110', chest: '55-60', length: '75' },
                  { age: '6Y', height: '110-120', chest: '60-65', length: '85' },
                  { age: '8Y', height: '120-130', chest: '65-70', length: '95' },
                  { age: '10Y', height: '130-140', chest: '70-75', length: '105' },
                  { age: '12Y', height: '140-150', chest: '75-80', length: '115' },
                ].map((size) => (
                  <tr key={size.age} className="border-b border-line last:border-0 hover:bg-surface-3">
                    <td className="py-4 px-4 font-medium">{size.age}</td>
                    <td className="py-4 px-4">{size.height}</td>
                    <td className="py-4 px-4">{size.chest}</td>
                    <td className="py-4 px-4">{size.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
