'use client';

interface SizeSelectProps {
  sizes: string[];
  selected: string | null;
  onChange: (size: string) => void;
}

export function SizeSelect({ sizes, selected, onChange }: SizeSelectProps) {
  return (
    <div>
      <div className="text-sm font-medium mb-3 uppercase tracking-wideish">Select Size</div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={`px-6 py-3 border text-sm transition-colors ${
              selected === size
                ? 'border-bmr-black bg-bmr-black text-bmr-white'
                : 'border-border hover:border-bmr-black'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}




