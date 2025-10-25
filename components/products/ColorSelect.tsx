'use client';

interface ColorSelectProps {
  colors: string[];
  selected: string | null;
  onChange: (color: string) => void;
}

export function ColorSelect({ colors, selected, onChange }: ColorSelectProps) {
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    gray: '#CACACA',
    beige: '#F5F5DC',
    brown: '#8B4513',
    navy: '#000080',
  };

  const handleClick = (color: string) => {
    // Toggle: if already selected, deselect it
    if (selected === color) {
      onChange(null as any);
    } else {
      onChange(color);
    }
  };

  return (
    <div>
      <div className="text-sm font-medium mb-3 uppercase tracking-wideish">
        Select Color{selected && <span className="capitalize">: {selected}</span>}
      </div>
      <div className="flex gap-3">
        {colors.map((color) => {
          const hexColor = colorMap[color.toLowerCase()] || '#CCCCCC';
          return (
            <button
              key={color}
              type="button"
              onClick={() => handleClick(color)}
              className={`w-10 h-10 border-2 transition-all rounded ${
                selected === color ? 'border-bmr-ink scale-110' : 'border-line'
              }`}
              style={{ backgroundColor: hexColor }}
              aria-label={color}
              title={color}
            />
          );
        })}
      </div>
    </div>
  );
}








