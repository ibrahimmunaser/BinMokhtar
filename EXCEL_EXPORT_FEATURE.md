# Excel Export Feature for Orders

## Overview
Added the ability to export orders to Excel spreadsheets (.xlsx format) from:
1. **Orders List Page** - Export all orders at once
2. **Individual Order Detail Page** - Export a single order with detailed breakdown

## Implementation Details

### Dependencies
- **xlsx** (SheetJS) - Industry-standard library for generating Excel files

### Installation
```bash
npm install xlsx
```

### Files Modified
1. **app/admin/orders/page.tsx** (Orders List Page)
   - Added `Download` icon from lucide-react
   - Imported `xlsx` library
   - Added `exportToExcel()` function
   - Added "Export to Excel" button in the header

2. **app/admin/orders/[id]/page.tsx** (Order Detail Page)
   - Added `Download` icon from lucide-react
   - Imported `xlsx` library
   - Added `exportOrderToExcel()` function
   - Added "Export to Excel" button in the header

### Features

#### Export Button - Orders List Page
- Located in the orders page header (next to Refresh button)
- Disabled when there are no orders to export
- Shows tooltip with order count
- Styled with primary dark button for prominence
- **File Output**: Single file with all orders in one sheet

#### Export Button - Order Detail Page
- Located in the top right of the order detail page (next to Back button)
- Always available when viewing an order
- Styled with primary dark button
- **File Output**: Multi-sheet workbook with detailed breakdown

#### Data Included in Bulk Export (All Orders)
The Excel file includes comprehensive order information:

**Order Information:**
- Order Number
- Order ID
- Order Status
- Payment Status
- Created At
- Updated At
- Paid At

**Customer Information:**
- Customer Name
- Customer Email
- Phone
- Shipping Address (formatted as single line)

**Financial Information:**
- Subtotal
- Shipping Cost
- Tax
- Total

**Fulfillment Information:**
- Fulfillment Method (Shipping/Pickup/Local Delivery)
- Shippo Label Status
- Has Shippo Label (Yes/No)
- Has Internal Label (Yes/No)
- Shippo Tracking Number
- Shippo Tracking URL
- Shippo Error (if any)

**Items Information:**
- Items Count
- Items (detailed list with quantities)

#### Data Included in Single Order Export

The single order export creates a **multi-sheet workbook** with comprehensive details:

**Sheet 1: Order Summary** (Vertical layout with Field/Value pairs)
- Order Information:
  - Order Number, Order ID
  - Order Status, Payment Status
  - Created At, Updated At, Paid At
- Customer Information:
  - Customer Name, Email, Phone
- Shipping Information:
  - Full Name, Address Lines 1 & 2
  - City, State, ZIP, Country
- Fulfillment Information:
  - Fulfillment Method
  - Shippo Label Status, URLs
  - Tracking Number, Tracking URL
  - Internal Label Status, URL
  - Shippo Errors (if any)
  - Total Weight (grams)
- Financial Information:
  - Subtotal, Shipping Cost, Tax, Total

**Sheet 2: Order Items** (Table format)
- Item Name
- SKU
- Size, Color
- Quantity
- Unit Price
- Total Price
- Image URL

#### File Naming

**Bulk Export (All Orders):**
- Format: `BMR_Orders_YYYY-MM-DD.xlsx`
- Example: `BMR_Orders_2025-12-31.xlsx`

**Single Order Export:**
- Format: `Order_[ORDER_NUMBER].xlsx`
- Example: `Order_ABC12345.xlsx`

#### Column Formatting
- Auto-sized columns for optimal readability
- Properly formatted dates (MM/DD/YYYY HH:MM:SS AM/PM)
- Currency values formatted with $ prefix
- Wide columns for long text fields (addresses, items, URLs)

## Usage Instructions

### For Admins

**Export All Orders:**
1. **Navigate to Orders Page**
   - Go to `http://localhost:3000/admin/login`
   - Login with admin credentials
   - Navigate to Orders section

2. **Export Orders**
   - Click the "Export to Excel" button in the top right
   - The file will automatically download to your default Downloads folder
   - Filename includes current date for easy organization

**Export Single Order:**
1. **Navigate to Order Detail**
   - Go to Orders page
   - Click "View" on any order
   - Or navigate directly to `http://localhost:3000/admin/orders/[ORDER_ID]`

2. **Export Order**
   - Click the "Export to Excel" button in the top right
   - The file will automatically download
   - Filename includes order number
   - File contains 2 sheets: Summary and Items

3. **Open in Excel/Google Sheets**
   - Open the downloaded `.xlsx` file in:
     - Microsoft Excel
     - Google Sheets (File > Open)
     - LibreOffice Calc
     - Numbers (Mac)
   - All formatting and data will be preserved
   - Navigate between sheets using tabs at bottom

## Technical Details

### Export Function
```typescript
function exportToExcel() {
  // 1. Validate orders exist
  // 2. Transform order data to flat structure
  // 3. Create worksheet from JSON
  // 4. Set column widths
  // 5. Create workbook
  // 6. Generate filename with date
  // 7. Trigger download
}
```

### Data Transformation
- Nested objects (like `shippingAddress`) are flattened to single-line strings
- Arrays (like `items`) are concatenated with semicolons
- Dates are formatted for human readability
- Prices are formatted with currency symbols
- Boolean values converted to Yes/No

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- File download triggered via `XLSX.writeFile()`
- No server-side processing required

## Benefits

1. **Data Analysis**
   - Import into analytics tools
   - Create pivot tables
   - Generate charts and reports

2. **Record Keeping**
   - Archive orders by date
   - Share with accounting
   - Backup order data

3. **Bulk Operations**
   - Filter and sort orders
   - Search across all fields
   - Apply formulas

4. **Integration**
   - Import into other systems
   - Share with shipping partners
   - Provide to accountants

## Future Enhancements

Potential improvements:
- [ ] Date range filtering before export
- [ ] Select specific columns to export
- [ ] Export individual order details
- [ ] Multiple sheet workbook (orders, items, customers)
- [ ] CSV format option
- [ ] Schedule automatic exports
- [ ] Email export to admin

## Testing

### Test Cases
1. ✅ Export with orders present
2. ✅ Button disabled when no orders
3. ✅ Correct filename with date
4. ✅ All columns present
5. ✅ Data formatted correctly
6. ✅ File opens in Excel/Sheets
7. ✅ Wide columns display full content

### Manual Testing Steps
```
1. Login to admin panel
2. Navigate to Orders page
3. Wait for orders to load
4. Click "Export to Excel"
5. Verify file downloads
6. Open file in Excel
7. Verify all data is present and readable
```

## Troubleshooting

### Issue: Button is Disabled
**Solution:** Check that orders have loaded. Refresh the page if needed.

### Issue: File Won't Download
**Solution:** Check browser download settings. Some browsers require permission for downloads.

### Issue: File Won't Open
**Solution:** Ensure you have Excel, Google Sheets, or compatible software installed.

### Issue: Missing Data
**Solution:** Check that orders loaded successfully. Look for errors in browser console.

## Console Logging
When export completes, you'll see:
```
✅ Exported XX orders to BMR_Orders_YYYY-MM-DD.xlsx
```

## Support
For issues or questions, check:
- Browser console for errors
- Network tab for API call failures
- Ensure orders page displays correctly before exporting

