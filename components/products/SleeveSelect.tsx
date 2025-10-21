'use client';

interface SleeveSelectProps {
  sleeves: Array<'short' | 'long'>;
  selected: string | null;
  onChange: (sleeve: string) => void;
}

export function SleeveSelect({ sleeves, selected, onChange }: SleeveSelectProps) {
  if (!sleeves || sleeves.length === 0) return null;

  return (
    <div>
      <div className="text-sm font-medium mb-3 uppercase tracking-wideish">Select Sleeve</div>
      <div className="flex flex-wrap gap-2">
        {sleeves.map((sleeve) => (
          <button
            key={sleeve}
            onClick={() => onChange(sleeve)}
            className={`px-6 py-3 border text-sm capitalize transition-colors ${
              selected === sleeve
                ? 'border-bmr-black bg-bmr-black text-bmr-white'
                : 'border-border hover:border-bmr-black'
            }`}
          >
            {sleeve} Sleeve
          </button>
        ))}
      </div>
    </div>
  );
}


