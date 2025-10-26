# Variant Stock Management

## 🎯 Overview

Stock levels are now managed **per variant** (size + color combination), giving you precise inventory control for each product variation!

---

## ✨ Key Features

### 1. **Per-Variant Stock Tracking**
- Set individual stock levels for each size+color combination
- Example: "M + White" can have 10 units, "L + Black" can have 5 units
- Precise inventory management

### 2. **Visual Stock Matrix**
- Table layout with sizes as rows and colors as columns
- Easy to see all variants at a glance
- Color-coded stock levels (out of stock, low stock, in stock)

### 3. **Quick Set All**
- Set the same stock level for all variants with one click
- Then adjust individual variants as needed
- Saves time when most variants have similar stock

### 4. **Automatic Calculations**
- Total stock calculated automatically
- Counts in-stock, low-stock, and out-of-stock variants
- Real-time updates as you change stock levels

### 5. **Visual Indicators**
- **Red**: Out of stock (0 units)
- **Yellow**: Low stock (1-5 units)
- **Normal**: In stock (6+ units)
- Clear labels for each state

---

## 📐 Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Stock Management                         Total Stock: 45   │
│  Set stock levels for each size and color combination       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Quick Set All: [10] ← Set the same stock for all variants │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Size/Color │  White  │  Black  │  Beige  │  Brown   │ │
│  ├────────────┼─────────┼─────────┼─────────┼──────────┤ │
│  │     S      │  [10]   │  [8]    │  [5]    │  [0]     │ │
│  │            │         │         │ Low     │ Out of   │ │
│  │            │         │         │ Stock   │ Stock    │ │
│  ├────────────┼─────────┼─────────┼─────────┼──────────┤ │
│  │     M      │  [15]   │  [12]   │  [3]    │  [7]     │ │
│  │            │         │         │ Low     │          │ │
│  │            │         │         │ Stock   │          │ │
│  ├────────────┼─────────┼─────────┼─────────┼──────────┤ │
│  │     L      │  [20]   │  [10]   │  [8]    │  [5]     │ │
│  │            │         │         │         │ Low      │ │
│  │            │         │         │         │ Stock    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────┬─────────┬─────────┬─────────┐                │
│  │ Total   │ In      │ Low     │ Out of  │                │
│  │ Variants│ Stock   │ Stock   │ Stock   │                │
│  │   12    │   9     │   2     │   1     │                │
│  └─────────┴─────────┴─────────┴─────────┘                │
│                                                             │
│  💡 Tip: Stock levels are tracked per size+color           │
│     combination. Use "Quick Set All" to set the same       │
│     stock for all variants, then adjust as needed.         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 How It Works

### Step 1: Select Sizes and Colors
1. Choose available sizes (e.g., S, M, L, XL)
2. Choose available colors (e.g., White, Black, Beige)
3. Stock matrix appears automatically

### Step 2: Set Stock Levels

**Option 1: Quick Set All**
1. Enter a number in "Quick Set All" field
2. All variants get that stock level
3. Adjust individual variants as needed

**Option 2: Set Individually**
1. Click on each variant's stock field
2. Enter the stock level
3. Repeat for all variants

**Option 3: Mix Both**
1. Use "Quick Set All" for base stock
2. Then adjust specific variants
3. Example: Set all to 10, then set popular sizes higher

### Step 3: Review Summary
- Check total stock count
- See how many variants are in stock
- Identify low stock or out of stock variants
- Make adjustments if needed

### Step 4: Submit
- Stock levels are saved with the product
- Total stock is calculated automatically
- Each variant has its own SKU

---

## 💾 Data Structure

### Firestore Schema
```typescript
{
  variants: [
    {
      size: "M",
      color: "White",
      stock: 10,
      sku: "M-WHITE"
    },
    {
      size: "M",
      color: "Black",
      stock: 5,
      sku: "M-BLACK"
    },
    {
      size: "L",
      color: "White",
      stock: 8,
      sku: "L-WHITE"
    }
  ],
  stock: 23,  // Total stock (10 + 5 + 8)
  counts: {
    variants: 3,
    activeVariants: 3,  // Variants with stock > 0
    totalStock: 23,
    reviewCount: 0,
    ratingAvg: 0
  },
  sizes: ["M", "L"],
  colors: ["White", "Black"]
}
```

---

## 🎨 Visual Indicators

### Stock Levels

**Out of Stock (0 units)**
```
┌─────────┐
│   [0]   │  ← Red border
│ Out of  │  ← Red text
│ Stock   │
└─────────┘
```

**Low Stock (1-5 units)**
```
┌─────────┐
│   [3]   │  ← Yellow border
│  Low    │  ← Yellow text
│ Stock   │
└─────────┘
```

**In Stock (6+ units)**
```
┌─────────┐
│  [10]   │  ← Normal border
│         │
│         │
└─────────┘
```

---

## ✅ Benefits

### For Inventory Management
- ✅ Track exact stock per variant
- ✅ Know which size+color combos are low
- ✅ Reorder specific variants
- ✅ Avoid overselling

### For Customers
- ✅ See accurate availability
- ✅ Know if their size+color is in stock
- ✅ Better shopping experience
- ✅ Fewer disappointments

### For Business
- ✅ Better inventory control
- ✅ Reduce stockouts
- ✅ Optimize purchasing
- ✅ Improve cash flow

---

## 🎯 Best Practices

### Stock Levels
1. **Popular Variants**: Keep higher stock (15-20 units)
2. **Standard Variants**: Medium stock (8-12 units)
3. **Less Popular**: Lower stock (3-5 units)
4. **Test Variants**: Minimal stock (1-2 units)

### Reordering
- Set low stock threshold at 5 units
- Reorder when variants hit low stock
- Keep 2-3 weeks of safety stock
- Monitor fast-moving variants

### Organization
- Use "Quick Set All" for initial setup
- Adjust based on historical data
- Review stock levels weekly
- Update after receiving inventory

---

## 💡 Usage Examples

### Example 1: Standard Setup
**Product**: White Thobe
**Sizes**: M, L, XL
**Colors**: White, Cream

**Stock Strategy**:
1. Quick Set All: 10
2. Adjust popular sizes:
   - L + White: 15 (most popular)
   - M + White: 12 (popular)
   - Keep others at 10

**Result**: Total stock = 47 units

### Example 2: New Product Launch
**Product**: New Shemagh Design
**Sizes**: One Size
**Colors**: Red, Black, Navy, Brown

**Stock Strategy**:
1. Quick Set All: 5 (testing demand)
2. All variants start with 5 units
3. Monitor sales
4. Restock popular colors

**Result**: Total stock = 20 units

### Example 3: Seasonal Product
**Product**: Summer Thobe
**Sizes**: S, M, L, XL, XXL
**Colors**: White, Beige, Light Blue

**Stock Strategy**:
1. Quick Set All: 8
2. Increase popular sizes:
   - M: 12 each color
   - L: 15 each color
3. Reduce less popular:
   - XXL: 3 each color

**Result**: Total stock = 114 units

---

## 🔄 Workflow

```
1. Select Sizes (e.g., S, M, L, XL)
   ↓
2. Select Colors (e.g., White, Black, Beige)
   ↓
3. Stock Matrix Appears (4 sizes × 3 colors = 12 variants)
   ↓
4. Quick Set All to 10 (all variants = 10)
   ↓
5. Adjust Popular Variants
   - M + White: 15
   - L + White: 15
   - M + Black: 12
   ↓
6. Review Summary
   - Total Stock: 127
   - In Stock: 12
   - Low Stock: 0
   - Out of Stock: 0
   ↓
7. Submit Product
   ↓
8. Stock Saved to Firestore
```

---

## 📊 Calculations

### Total Stock
```
Total = Sum of all variant stock levels
Example: 10 + 5 + 8 + 12 + 0 + 3 = 38 units
```

### Active Variants
```
Active = Variants with stock > 0
Example: 5 variants with stock, 1 with 0 = 5 active
```

### Low Stock Count
```
Low Stock = Variants with 1-5 units
Example: 2 variants with 3 units each = 2 low stock
```

### Out of Stock Count
```
Out of Stock = Variants with 0 units
Example: 1 variant with 0 units = 1 out of stock
```

---

## 🎨 Color Coding

### Border Colors
- **Red Border**: Stock = 0 (out of stock)
- **Yellow Border**: Stock = 1-5 (low stock)
- **Normal Border**: Stock ≥ 6 (in stock)

### Text Colors
- **Red Text**: "Out of Stock" label
- **Yellow Text**: "Low Stock" label
- **Normal Text**: No label

### Background Colors
- **Red Background**: Light red tint (out of stock)
- **Yellow Background**: Light yellow tint (low stock)
- **Normal Background**: White (in stock)

---

## 🔍 Troubleshooting

### Matrix doesn't appear
- Make sure you've selected at least 1 size
- Make sure you've selected at least 1 color
- Both are required for matrix to show

### Can't change stock levels
- Click directly in the input field
- Enter a number (0 or higher)
- Negative numbers are not allowed

### Total stock is wrong
- Total is calculated automatically
- Check individual variant stock levels
- Refresh the page if needed

### Quick Set All not working
- Enter a valid number
- Must be 0 or positive
- Changes apply to all variants

---

## 🚀 Advanced Tips

### Keyboard Navigation
- Tab to move between stock fields
- Enter to confirm and move to next
- Arrow keys to navigate table

### Bulk Updates
1. Use Quick Set All for base stock
2. Multiply adjust for popular variants
3. Zero out unavailable variants

### SKU Generation
- Auto-generated as SIZE-COLOR
- Example: "M-WHITE", "L-BLACK"
- Uppercase with hyphens
- Can be customized later

---

## ✅ Comparison: Before vs After

### Before (Single Stock)
- ❌ One stock level for entire product
- ❌ No way to track size+color combos
- ❌ Overselling risk
- ❌ Poor inventory control

### After (Variant Stock)
- ✅ Stock per size+color combination
- ✅ Precise inventory tracking
- ✅ No overselling
- ✅ Better inventory control
- ✅ Visual stock matrix
- ✅ Automatic calculations
- ✅ Color-coded indicators

---

## 📚 Related Features

- **Multi-Image Upload**: Show different variants
- **Size Selection**: Choose available sizes
- **Color Selection**: Choose available colors
- **Product Variants**: Complete variant management

---

## 🎉 Summary

The variant stock management system provides:
- ✅ **Per-variant stock** tracking
- ✅ **Visual matrix** for easy management
- ✅ **Quick set all** for efficiency
- ✅ **Automatic calculations** for totals
- ✅ **Color-coded indicators** for stock levels
- ✅ **Real-time updates** as you type

**Never oversell again! Track stock precisely for every variant.** 📊✨


