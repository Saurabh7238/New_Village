# Development Projects - Complete Testing Guide

## Quick Start Testing

### 1. Seed Sample Data (Fastest Way)

```bash
# Run this command to populate 6 sample development projects
curl -X POST http://localhost:3000/api/development/seed
```

The seed will create projects with:
- ✅ Various schemes (15th Finance Commission, MNREGA, Gram Nidhi, PMAY, Swachh Bharat, Jal Jeevan Mission)
- ✅ Different statuses (Completed, Ongoing, Sanctioned)
- ✅ Progress percentages (0-100%)
- ✅ Sanctioned vs spent amounts
- ✅ GPS coordinates for map display
- ✅ Ward numbers 1-5
- ✅ Beneficiary information

### 2. Test Admin Panel

1. Go to: **http://localhost:3000/admin/development**
2. You should see:
   - 📊 **Stats Dashboard**: Total projects, sanctioned amount, spent amount, avg progress, status breakdown
   - 📄 **Report Generation**: Button to download Gram Sabha report
   - 📝 **Project Table**: All 6 test projects with edit/delete options

### 3. Test Public Listing Page

1. Go to: **http://localhost:3000/development**
2. Test **View Toggle**:
   - 📋 **By Scheme**: Projects grouped by scheme name
   - 📍 **By Ward**: Projects grouped by Ward number (1-5)
   - 🗺️ **On Map**: Interactive map showing all project locations with color-coded markers

### 4. Test Map Features

1. Click "View on Map" on development listing
2. Verify:
   - ✅ Map loads with all 6 project markers
   - ✅ Marker colors: Green (Completed), Blue (Ongoing), Purple (Sanctioned), Amber (On Hold)
   - ✅ Marker shows progress % or ✓ if completed
   - ✅ Click marker → shows project name, scheme, status, progress
   - ✅ Click "View Details →" in popup → navigates to project detail page

### 5. Test Project Detail Page

1. Click any project card on listing → goes to project detail
2. Verify these sections:
   - ✅ **Header**: Title, status badge, scheme, ward number
   - ✅ **Timeline**: Sanctioned → Started → Expected → Completed (if done)
   - ✅ **Financial Details**: Sanctioned, Spent, Remaining, Budget Utilization %
   - ✅ **Project Location**: Map with single project pin + GPS coordinates
   - ✅ **Right Sidebar**: Project info, progress bar, RTI compliance badge
   - ✅ **Documents**: Shows document names if uploaded

### 6. Test Admin Create/Edit

1. Go to: **http://localhost:3000/admin/development**
2. **Create New Project**:
   - Fill all mandatory fields (title, scheme, FY, amount, ward, location, status, progress, dates, agency)
   - Click "Create Project"
   - ✅ Should appear in projects table
   - ✅ Should appear on public development page
   - ✅ Should appear on map if GPS coords added

3. **Edit Project**:
   - Click "Edit" on any project in table
   - Change progress % from 65% → 75%
   - Change status from "Ongoing" → "Completed"
   - Click "Update Project"
   - ✅ Changes should appear immediately on public page

4. **Delete Project**:
   - Click "Delete" on any project
   - ✅ Project disappears from table and public pages

### 7. Test Gram Sabha Report Generation

1. Go to: **http://localhost:3000/admin/development**
2. Click "📄 Generate Report" button
3. File downloads: `gram-panchayat-development-report-YYYY-MM-DD.txt`
4. Report contains:
   - ✅ Summary statistics (total projects, total sanctioned, total spent, avg progress)
   - ✅ Status breakdown (completed, ongoing, sanctioned, on hold)
   - ✅ Detailed project list with all fields
   - ✅ "FOR GRAM SABHA DISPLAY" note at bottom

### 8. Test Filter & Search (Admin)

1. **Search**: Type "road" in search box → filters to projects with "road" in title/agency
2. **Filter by Scheme**: Select "MNREGA" → shows only MNREGA projects
3. **Filter by Ward**: Select "Ward 3" → shows only Ward 3 projects
4. **Filter by Status**: Select "Completed" → shows only completed projects
5. ✅ Can combine filters

### 9. Test Dark Mode

1. Toggle dark mode (button in top right)
2. Go to all development pages:
   - **Admin page**: Stats dashboard, project table, form all should have dark colors
   - **Public listing**: Cards, timeline should be dark-friendly
   - **Detail page**: All sections, map, sidebar should be dark
   - **Map**: Should switch to dark tiles
3. ✅ No white text on white background issues

### 10. Test Responsive Design

1. **Desktop** (1920px): Grid showing 3 columns of project cards
2. **Tablet** (768px): Grid showing 2 columns
3. **Mobile** (375px): Grid showing 1 column, buttons stack vertically
4. ✅ All readable, no overflow, map accessible

## Manual Testing (Without Seed)

If you don't use seed data, manually add a project:

1. Go to: **http://localhost:3000/admin/development**
2. Fill form:
   - Title: `CC Road - Ward 3 School`
   - Scheme: `15th Finance Commission`
   - FY: `2025-2026`
   - Sanctioned: `850000`
   - Ward: `3`
   - Location Address: `Ward No. 3, Near Hanuman Mandir`
   - Status: `Ongoing`
   - Progress: `65`
   - Start Date: `2025-04-15`
   - Expected: `2025-09-30`
   - Agency: `PWD, Lucknow Division`
   - Latitude: `28.5355`
   - Longitude: `77.3937`
3. Click "Create Project"
4. Now test all 10 scenarios above with this single project

## What Each Feature Tests

| Feature | Tests | Expected Result |
|---------|-------|-----------------|
| **Admin Stats Dashboard** | Database aggregation, calculations | Shows correct totals and averages |
| **Project Form** | Input validation, date handling, file upload | Form submits and creates/updates |
| **Search & Filter** | Query parameters, filtering logic | Returns filtered results correctly |
| **Map View** | Leaflet integration, GPS coordinates | All markers visible and clickable |
| **Detail Page** | Dynamic routing, file download | Shows all sections, downloads work |
| **Report Generation** | Data aggregation, file download | Report downloads with all data |
| **Dark Mode** | CSS classes, theme context | Readable in both light/dark |
| **Responsive Grid** | CSS grid, breakpoints | Layout correct on all sizes |

## Success Criteria

✅ All 10 tests pass
✅ No console errors
✅ Admin can CRUD projects
✅ Public can view all project information
✅ Map shows all projects with correct colors
✅ Report generates with complete data
✅ Dark mode works throughout
✅ Mobile responsive without issues
✅ RTI compliance badge visible on detail page
✅ Before/After photos display correctly when uploaded

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not loading | Check browser console for Leaflet CDN errors |
| Seed returns 400 | Delete existing projects first via admin or `db.developments.deleteMany({})` |
| Photos not showing | Ensure file upload completes before clicking Create |
| Report downloads blank | Check admin page loaded stats correctly |
| Dark mode toggle missing | Refresh page, check theme-provider is loaded |

## Next Steps After Testing

1. ✅ **Export Real Data**: Migrate actual panchayat projects from spreadsheet
2. ✅ **Add Before/After Photos**: Upload for 2-3 existing projects to test photo carousel
3. ✅ **Upload Work Order PDFs**: Add for 2 projects to test document download
4. ✅ **Go Live**: Put URL on panchayat website/notice board
5. ✅ **Social Audit**: Display report in Gram Sabha meetings monthly
