# Testing Guide - MT Cleaning CMS

This guide helps you test all features of the MT Cleaning Management System.

## Pre-Testing Setup

### 1. Database Setup

Ensure you've completed:
- [ ] Created Supabase project
- [ ] Run `schema.sql`
- [ ] Run `functions.sql`
- [ ] Created storage buckets
- [ ] Created at least one admin user
- [ ] (Optional) Run `seed-data.sql` for test data

### 2. Local Development

```bash
npm install
npm run dev
```

Application runs at: http://localhost:5173

## Testing Checklist

### Authentication Tests

#### Test 1: Admin Login
1. Navigate to http://localhost:5173/login
2. Enter admin credentials
3. ✅ Should redirect to `/admin` dashboard
4. ✅ Should see navigation sidebar
5. ✅ Should see dashboard statistics

#### Test 2: Invalid Login
1. Try logging in with wrong password
2. ✅ Should show error toast notification
3. ✅ Should remain on login page

#### Test 3: Password Reset
1. Click "Forgot Password?"
2. Enter email address
3. ✅ Should show success message
4. Check email for reset link (in development, check Supabase Auth logs)

### Admin Dashboard Tests

#### Test 4: Dashboard Statistics
1. Log in as admin
2. Navigate to Dashboard
3. ✅ Should display 6 stat cards
4. ✅ Numbers should reflect actual database data
5. ✅ Should show recent jobs table

#### Test 5: Recent Jobs Table
1. On dashboard, scroll to "Recent Jobs"
2. ✅ Should display jobs with site names
3. ✅ Should show assigned staff names
4. ✅ Status badges should have correct colors
5. ✅ "View" links should work

### Staff Management Tests

#### Test 6: View All Staff
1. Navigate to Admin → Staff Management
2. ✅ Should list all users
3. ✅ Should show role badges
4. ✅ Should show status (active/inactive)
5. ✅ Search and filters should work

#### Test 7: Create New Staff
1. Click "Add Staff" button
2. Fill in form:
   - Email: teststaff@example.com
   - Password: Test123456
   - Full Name: Test Staff
   - Phone: 0412345678
   - Role: staff
   - Status: active
3. Click "Create"
4. ✅ Should show success toast
5. ✅ New staff should appear in list
6. ✅ Staff should be able to log in

#### Test 8: Edit Staff
1. Click edit icon on any staff member
2. Change name or phone
3. Click "Update"
4. ✅ Should show success toast
5. ✅ Changes should reflect in list

#### Test 9: Deactivate/Activate Staff
1. Click "Deactivate" on active staff
2. ✅ Should show success toast
3. ✅ Status should change to "inactive"
4. ✅ Staff should not be able to log in
5. Click "Activate"
6. ✅ Status should change back to "active"

#### Test 10: Delete Staff
1. Click delete icon
2. Confirm deletion
3. ✅ Should show confirmation dialog
4. ✅ Should remove from list
5. ✅ User should be deleted from Supabase Auth

### Clients Management Tests

#### Test 11: Create Client
1. Navigate to Admin → Clients
2. Click "Add Client"
3. Fill in:
   - Name: Test Hospital
   - Email: contact@testhospital.com
   - Phone: 02 9000 0000
   - Address: 123 Test St, Sydney NSW
   - Notes: Test client for system
4. Click "Create"
5. ✅ Client should appear as card
6. ✅ All details should be displayed

#### Test 12: Edit and Delete Client
1. Click "Edit" on a client card
2. Modify name
3. ✅ Should update successfully
4. Click "Delete"
5. ✅ Should remove client (if no dependent sites)

### Sites Management Tests

#### Test 13: Create Site with GPS
1. Navigate to Admin → Sites
2. Click "Add Site"
3. Fill in:
   - Name: Test Building
   - Address: 1 Martin Place, Sydney NSW 2000
   - Latitude: -33.8671 (Sydney CBD)
   - Longitude: 151.2074
   - Instructions: Test access instructions
4. ✅ Site should be created
5. ✅ GPS coordinates should be stored

#### Test 14: GPS Coordinate Validation
1. Try creating site with invalid coordinates
2. ✅ Should validate latitude (-90 to 90)
3. ✅ Should validate longitude (-180 to 180)

### Jobs Management Tests

#### Test 15: View All Jobs
1. Navigate to Admin → Jobs
2. ✅ Should list all jobs
3. ✅ Should show site names (joined data)
4. ✅ Should show assigned staff names
5. ✅ Status colors should be correct

### Settings Tests

#### Test 16: GPS Radius Setting
1. Navigate to Admin → Settings
2. Change GPS radius to 500 meters
3. Click "Save Settings"
4. ✅ Should save successfully
5. ✅ Should apply to check-ins immediately

#### Test 17: Dark Mode Toggle
1. Click dark mode button in sidebar
2. ✅ Theme should change immediately
3. ✅ Should persist on page refresh
4. ✅ All colors should remain readable

### Staff Workflow Tests

#### Test 18: Staff Login
1. Log out as admin
2. Log in with staff credentials
3. ✅ Should redirect to `/staff` dashboard
4. ✅ Should see different navigation menu
5. ✅ Should only see assigned jobs

#### Test 19: View Assigned Jobs
1. As staff, check dashboard
2. ✅ Should see "Today's Jobs" section
3. ✅ Should see "Upcoming Jobs" section
4. ✅ Should only see own assignments
5. ✅ Cannot see other staff's jobs

#### Test 20: Job Details
1. Click on a job card
2. ✅ Should show site details
3. ✅ Should show GPS coordinates
4. ✅ Should show task checklist
5. ✅ Should have check-in button (if pending)

### GPS Check-In Tests

> Note: For development testing, either increase GPS radius in Settings to 5000m, or test at the actual site coordinates.

#### Test 21: Check-In at Site
1. Open a pending job
2. Click "Check In" button
3. Allow browser location access
4. ✅ Should capture GPS coordinates
5. ✅ Should verify within radius
6. ✅ Should record timestamp
7. ✅ Should change job status to "in_progress"

#### Test 22: Check-In Outside Radius
1. With normal GPS radius (100m)
2. Try checking in far from site
3. ✅ Should show error
4. ✅ Should not create check-in record
5. ✅ Job status should remain unchanged

#### Test 23: Browser Location Blocked
1. Block location permissions
2. Try to check in
3. ✅ Should show permission error
4. ✅ Should provide helpful message

### Photo Upload Tests

#### Test 24: Upload Before Photos
1. In job detail, find a task
2. Click photo upload for "Before"
3. Select image file (<5MB)
4. ✅ Should show upload progress
5. ✅ Should display thumbnail preview immediately
6. ✅ Photo should be stored in Supabase Storage
7. ✅ URL should be saved in database

#### Test 25: Upload After Photos
1. Mark task in progress
2. Upload "After" photo
3. ✅ Should upload successfully
4. ✅ Should display alongside before photo
5. ✅ Both photos should be visible

#### Test 26: Photo Size Validation
1. Try uploading file > 5MB
2. ✅ Should show error or auto-compress
3. ✅ Should not crash app

#### Test 27: Photo Compression
1. Upload large image
2. ✅ Should automatically compress
3. ✅ Should still maintain reasonable quality
4. ✅ Upload should be faster

### Task Completion Tests

#### Test 28: Complete Task
1. In job detail, mark task checkbox
2. Add notes
3. Upload after photo
4. ✅ Should mark as completed
5. ✅ Should record completion timestamp
6. ✅ Should update UI immediately

#### Test 29: All Tasks Completion
1. Complete all tasks in a job
2. ✅ Job progress should show 100%
3. ✅ Check-out button should become available

### GPS Check-Out Tests

#### Test 30: Check-Out
1. After completing tasks
2. Click "Check Out" button
3. ✅ Should capture GPS coordinates
4. ✅ Should verify within radius
5. ✅ Should record checkout timestamp
6. ✅ Job status should change to "completed"

### Incident Reporting Tests

#### Test 31: Report Incident
1. Navigate to Staff → Incidents
2. Click "Report Incident"
3. Fill in:
   - Title: Test Incident
   - Description: Broken equipment found
   - Severity: medium
   - Upload photos
4. ✅ Should create incident
5. ✅ Photos should upload
6. ✅ Should appear in incidents list

#### Test 32: Admin View Incidents
1. Log in as admin
2. Navigate to Admin → Incidents
3. ✅ Should see all incidents
4. ✅ Should show reporter names
5. ✅ Should show severity badges
6. ✅ Should be able to update status

### Asset Management Tests

#### Test 33: Create Asset
1. Navigate to Admin → Assets
2. Create new asset:
   - Name: Test Vacuum
   - Serial: VAC-2024-001
   - Purchase Date: Today
   - Location: Store Room A
   - Status: operational
3. ✅ Should create successfully
4. ✅ Should display in list

#### Test 34: Log Maintenance
1. Click on an asset
2. Add maintenance record
3. Upload certificate (optional)
4. Set next due date
5. ✅ Should save maintenance log
6. ✅ Should show in history

### PDF Report Tests

#### Test 35: Generate PDF Report
1. Open a completed job
2. Click "Generate Report"
3. ✅ Should create PDF with:
   - Job details
   - Check-in/out times and GPS
   - Task completion status
   - Before/after photos
   - Staff signature
4. ✅ Should be downloadable

#### Test 36: View PDF In-Browser
1. After generating PDF
2. Click "View Report"
3. ✅ Should display PDF in modal/new tab
4. ✅ Should be readable
5. ✅ Photos should be visible
6. ✅ Should be printable

### Access Control Tests

#### Test 37: Staff Cannot Access Admin
1. Log in as staff
2. Try navigating to `/admin`
3. ✅ Should redirect back to `/staff`
4. ✅ Should not see admin menu items

#### Test 38: Admin Can Access All
1. Log in as admin
2. ✅ Should access all admin pages
3. ✅ Should see all jobs (not just own)
4. ✅ Should see all staff data

### Mobile Responsive Tests

#### Test 39: Mobile Layout
1. Open in Chrome DevTools mobile view
2. Test on iPhone and Android sizes
3. ✅ Navigation should be hamburger menu
4. ✅ All buttons should be large enough
5. ✅ Forms should be easy to fill
6. ✅ Photos should display properly
7. ✅ No horizontal scrolling

#### Test 40: Touch Interactions
1. On mobile device
2. ✅ Buttons should respond to touch
3. ✅ Modals should open/close
4. ✅ Forms should be usable
5. ✅ File upload should work with camera

### Performance Tests

#### Test 41: Page Load Speed
1. Use Chrome DevTools Lighthouse
2. Run performance audit
3. ✅ Should score 90+ on Performance
4. ✅ First Contentful Paint < 1.5s
5. ✅ Time to Interactive < 3s

#### Test 42: Image Load Optimization
1. Upload several photos to a job
2. ✅ Thumbnails should load quickly
3. ✅ Full images should be lazy-loaded
4. ✅ Page should remain responsive

### Data Persistence Tests

#### Test 43: Refresh During Job
1. Start a job, complete some tasks
2. Refresh browser
3. ✅ Job status should persist
4. ✅ Completed tasks should still be marked
5. ✅ Photos should still be visible

#### Test 44: Logout and Login
1. Complete some work as staff
2. Log out
3. Log back in
4. ✅ All data should be intact
5. ✅ Session should restore properly

### Security Tests

#### Test 45: RLS Policy Enforcement
1. Using browser DevTools, try accessing:
   ```javascript
   // This should fail for staff users
   supabase.from('jobs').select('*')
   ```
2. ✅ Staff should only see assigned jobs
3. ✅ Cannot access other users' data
4. ✅ Cannot modify admin settings

#### Test 46: SQL Injection Protection
1. Try entering SQL in text fields
2. E.g., `'; DROP TABLE jobs; --`
3. ✅ Should be treated as literal text
4. ✅ No database errors
5. ✅ No data loss

### Error Handling Tests

#### Test 47: Network Error
1. Go offline (disable network)
2. Try submitting a form
3. ✅ Should show friendly error message
4. ✅ Should not crash
5. ✅ Should retry when online (future feature)

#### Test 48: Invalid Data
1. Submit forms with invalid data
2. ✅ Should show validation errors
3. ✅ Should highlight problem fields
4. ✅ Should prevent submission

## Testing Tools

### Browser DevTools
- Console: Check for errors
- Network: Monitor API calls
- Application: Inspect localStorage
- Lighthouse: Performance audit

### Supabase Dashboard
- Authentication: Monitor user logins
- Database: Query data directly
- Storage: Check uploaded files
- Logs: View API errors

### Mobile Testing
- Chrome DevTools device mode
- BrowserStack (for real devices)
- Physical iOS/Android devices

## Test Data Cleanup

After testing, clean up test data:

```sql
-- In Supabase SQL Editor

-- Delete test jobs
DELETE FROM jobs WHERE notes LIKE '%test%';

-- Delete test staff (be careful!)
-- DELETE FROM profiles WHERE full_name LIKE 'Test%';

-- Delete test sites
DELETE FROM sites WHERE name LIKE 'Test%';

-- Or reset entire database and re-run schema.sql
```

## Continuous Testing

### Before Each Deployment:
1. Run all critical path tests
2. Test on mobile device
3. Check browser console for errors
4. Verify Supabase connection
5. Test with production data (if safe)

### After Deployment:
1. Test login immediately
2. Verify database connection
3. Check one complete workflow
4. Monitor error logs for 24 hours

## Automated Testing (Future)

Consider adding:
- Jest for unit tests
- Cypress for E2E tests
- Playwright for cross-browser testing

## Known Issues / Limitations

Document any issues found during testing:

1. **GPS Accuracy**: May vary by device/browser
2. **Photo Upload**: Large files take time
3. **Offline Mode**: Not yet implemented
4. **Email Reports**: Manual setup required

## Bug Reporting

When you find a bug, document:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/device
- Screenshots
- Console errors

---

**Remember**: Test in a development environment first! Never test destructive operations in production.

## Test Summary Template

```
Date: ____________________
Tester: __________________
Environment: Development / Staging / Production

Tests Passed: _____ / 48
Critical Issues: _____
Minor Issues: _____

Notes:
_____________________________________
_____________________________________
_____________________________________
```

Good luck with testing! 🧪
