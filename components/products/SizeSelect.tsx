'use client';

interface SizeSelectProps {
  sizes: string[];
  selected: string | null;
  onChange: (size: string) => void;
}

export function SizeSelect({ sizes, selected, onChange }: SizeSelectProps) {
  const handleClick = (size: string) => {
    // Toggle: if already selected, deselect it
    if (selected === size) {
      onChange(null as any);
    } else {
      onChange(size);
    }
  };

  return (
    <div>
      <div className="text-sm font-medium mb-3 uppercase tracking-wideish">Select Size</div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => handleClick(size)}
            className={`px-6 py-3 border text-sm transition-colors rounded ${
              selected === size
                ? 'border-bmr-ink bg-bmr-ink text-surface-2'
                : 'border-line hover:border-bmr-ink'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}








