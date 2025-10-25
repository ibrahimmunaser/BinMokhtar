'use client';

interface SleeveSelectProps {
  sleeves: Array<'short' | 'long'>;
  selected: string | null;
  onChange: (sleeve: string) => void;
}

export function SleeveSelect({ sleeves, selected, onChange }: SleeveSelectProps) {
  if (!sleeves || sleeves.length === 0) return null;

  const handleClick = (sleeve: string) => {
    // Toggle: if already selected, deselect it
    if (selected === sleeve) {
      onChange(null as any);
    } else {
      onChange(sleeve);
    }
  };

  return (
    <div>
      <div className="text-sm font-medium mb-3 uppercase tracking-wideish">Select Sleeve</div>
      <div className="flex flex-wrap gap-2">
        {sleeves.map((sleeve) => (
          <button
            key={sleeve}
            type="button"
            onClick={() => handleClick(sleeve)}
            className={`px-6 py-3 border text-sm capitalize transition-colors rounded ${
              selected === sleeve
                ? 'border-bmr-ink bg-bmr-ink text-surface-2'
                : 'border-line hover:border-bmr-ink'
            }`}
          >
            {sleeve} Sleeve
          </button>
        ))}
      </div>
    </div>
  );
}






