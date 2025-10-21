# BMR Color Scheme - Elegant Monochromatic Design

This document describes the official color scheme for Bin Mukhtar Retail, matching the sophisticated aesthetic of the BMR logo.

## Color Palette

### Primary Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **BMR Black** | `#000000` | Primary text, buttons, headers, footer background |
| **BMR Silver** | `#C0C0C0` | Main page background (matches logo background) |
| **BMR Silver Light** | `#D3D3D3` | Product cards, avatars, lighter accents |
| **BMR Silver Dark** | `#A8A8A8` | Darker accents, hover states |
| **BMR Gray** | `#808080` | Medium gray for secondary elements |
| **BMR White** | `#FFFFFF` | Cards, sections, header, clean backgrounds |

### Utility Colors

| Color Name | Value | Usage |
|------------|-------|-------|
| **Border** | `rgba(0, 0, 0, 0.1)` | Borders throughout the site |
| **Muted Text** | `rgba(0, 0, 0, 0.6)` | Secondary text, descriptions |

## Design Philosophy

The color scheme is inspired by the sophisticated, minimalist aesthetic of the BMR logo:
- **Elegant**: Silver and white create a premium, refined look
- **High Contrast**: Black text on silver/white provides excellent readability
- **Timeless**: Monochromatic palette that won't go out of style
- **Professional**: Conveys quality and traditional craftsmanship

## Component Usage

### Backgrounds
- **Page Background**: `bg-bmr-silver` - Main site background
- **Card/Section Background**: `bg-bmr-white` - White cards on silver background
- **Hero/Footer**: `bg-bmr-black` - Black sections for contrast
- **Feature Cards**: `bg-bmr-white` with `shadow-md` or `shadow-lg`

### Text
- **Primary Text**: `text-bmr-black` - Headers, main content
- **Secondary Text**: `text-muted` - Descriptions, captions
- **On Dark BG**: `text-white` or `text-bmr-silver-light`

### Buttons
- **Primary CTA**: `bg-bmr-black text-bmr-white hover:bg-bmr-gray`
- **Secondary**: `border-2 border-bmr-black text-bmr-black`
- **On Dark**: `bg-bmr-white text-bmr-black hover:bg-bmr-silver-light`

### Product Cards
- **Image Placeholder**: `bg-bmr-silver-light`
- **Card Shadow**: `shadow-md hover:shadow-lg`
- **Badges**: `bg-bmr-black text-bmr-white`

### Navigation
- **Header**: `bg-bmr-white/95` with `backdrop-blur-sm`
- **Links**: `text-bmr-black hover:text-muted`
- **Active State**: Full `text-bmr-black`

## Tailwind Configuration

The colors are configured in `tailwind.config.ts`:

```typescript
colors: {
  bmr: {
    black: '#000000',
    silver: '#C0C0C0',
    'silver-light': '#D3D3D3',
    'silver-dark': '#A8A8A8',
    gray: '#808080',
    white: '#FFFFFF',
  },
  border: 'rgba(0, 0, 0, 0.1)',
  muted: 'rgba(0, 0, 0, 0.6)',
}
```

## CSS Variables

Available in `globals.css`:

```css
:root {
  --bmr-black: #000000;
  --bmr-silver: #C0C0C0;
  --bmr-silver-light: #D3D3D3;
  --bmr-silver-dark: #A8A8A8;
  --bmr-gray: #808080;
  --bmr-white: #ffffff;
  --text: #000000;
  --bg: #C0C0C0;
  --muted: rgba(0, 0, 0, 0.6);
  --border: rgba(0, 0, 0, 0.1);
}
```

## Logo Usage

The BMR logo follows this structure to match the original design:

```jsx
<Link href="/" className="flex flex-col items-center leading-none">
  <span className="font-display text-3xl font-bold tracking-tight">BMR</span>
  <span className="font-display text-[9px] tracking-[0.3em] mt-0.5">
    BIN MUKHTAR RETAIL
  </span>
</Link>
```

## Accessibility

- **Contrast Ratio**: Black text on silver background provides sufficient contrast
- **Text Readability**: White cards ensure optimal reading experience
- **Focus States**: All interactive elements have visible focus states
- **Alternative Text**: All images include descriptive alt attributes

## Best Practices

1. **Consistency**: Always use the defined color tokens (e.g., `bg-bmr-silver` instead of hardcoded hex)
2. **Shadows**: Use `shadow-md` and `shadow-lg` for depth on white cards
3. **Hover States**: Add subtle transitions on hover for better UX
4. **Spacing**: White/silver alternation creates visual rhythm
5. **Typography**: Playfair Display for headings (serif), Inter for body (sans-serif)

## Examples

### Hero Section
```jsx
<section className="relative h-[600px] bg-bmr-black">
  <div className="absolute inset-0 bg-gradient-to-br from-bmr-black via-bmr-gray to-bmr-black" />
  {/* Content with white text */}
</section>
```

### Product Card
```jsx
<div className="aspect-[3/4] bg-bmr-silver-light shadow-md hover:shadow-lg transition-shadow">
  {/* Product image */}
</div>
```

### White Section on Silver Background
```jsx
<section className="py-16 bg-bmr-white">
  {/* Content */}
</section>
```

### Newsletter Card
```jsx
<div className="bg-bmr-white p-8 shadow-lg">
  {/* Newsletter form */}
</div>
```

## Migration Notes

The following colors were updated:
- Main background: White (`#FFFFFF`) → Silver (`#C0C0C0`)
- Product cards: Gray (`#CACACA`) → Silver Light (`#D3D3D3`)
- Sections: Gray backgrounds → White with shadows
- Added: Multiple silver shades for depth

All changes maintain or improve accessibility while creating a more sophisticated, premium aesthetic.



