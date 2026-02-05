# Quick Start Guide - MT Cleaning CMS

Get up and running with the MT Cleaning Management System in under 30 minutes.

## Prerequisites

- Node.js 18+ installed ([Download](https://nodejs.org/))
- A code editor (VS Code recommended)
- A web browser (Chrome recommended for testing)

## Step 1: Create Supabase Project (10 minutes)

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in:
   - **Organization**: Create or select one
   - **Name**: `mt-cleaning-cms`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Select closest to you (e.g., Sydney)
4. Click "Create new project" and wait 1-2 minutes

5. Once ready, go to **Settings** → **API**:
   - Copy **Project URL** (e.g., `https://abc123.supabase.co`)
   - Copy **anon public** key (starts with `eyJ...`)

## Step 2: Set Up Database (5 minutes)

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open `schema.sql` from this project
4. Copy entire contents and paste into SQL Editor
5. Click "Run" (wait ~10 seconds)
6. ✅ You should see "Success. No rows returned"

7. Repeat for `functions.sql` (optional but recommended)

## Step 3: Create Storage Buckets (3 minutes)

1. In Supabase, go to **Storage**
2. Create these buckets (all public):
   - `task-photos`
   - `incident-photos`
   - `maintenance-certificates`
   - `avatars`

For each bucket:
- Click "New bucket"
- Enter name
- Set "Public bucket" to **ON**
- Click "Create"

## Step 4: Create Your Admin User (2 minutes)

1. In Supabase, go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Fill in:
   - **Email**: your-email@example.com
   - **Password**: YourSecurePassword123
   - **Auto Confirm User**: **Yes**
4. Click "Create user"
5. **Copy the User ID** (UUID shown in the table)

6. Go back to **SQL Editor** → "New query"
7. Paste this (replace `YOUR-USER-ID` with the UUID you copied):

```sql
INSERT INTO profiles (id, full_name, role, status)
VALUES ('YOUR-USER-ID', 'Your Name', 'admin', 'active');
```

8. Click "Run"

## Step 5: Install and Configure App (5 minutes)

1. Open terminal in the project folder:

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

2. Open `.env` in your code editor
3. Paste your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Save the file

## Step 6: Run the App (1 minute)

```bash
npm run dev
```

Open your browser to: http://localhost:5173

## Step 7: First Login

1. Log in with the admin credentials you created
2. You should see the admin dashboard

**🎉 Congratulations! You're ready to use the system.**

## Next Steps

### Add Test Data (Optional)

1. Edit `seed-data.sql`:
   - Replace the placeholder UUIDs with your actual user IDs
2. Run it in Supabase SQL Editor
3. You'll see sample clients, sites, and jobs

### Create More Users

1. Admin → Staff Management → Add Staff
2. Create staff members for testing
3. Log in with staff credentials to see their view

### Create Your First Site

1. Admin → Sites → Add Site
2. Fill in:
   - Name: Test Building
   - Address: 1 Martin Place, Sydney NSW 2000
   - Latitude: -33.8671
   - Longitude: 151.2074 (Sydney CBD coordinates)
3. Add special instructions

**Tip**: Get GPS coordinates from Google Maps:
- Right-click on map location
- Click coordinates to copy
- Format: latitude, longitude

### Create Your First Job

1. Admin → Jobs → Create Job
2. Select site and staff member
3. Set date and time
4. Add notes

### Test Staff Workflow

1. Log out
2. Log in as staff member
3. See your assigned jobs
4. Open a job
5. Test check-in (adjust GPS radius in Settings if needed)

## Testing GPS Check-In

For development testing, either:

**Option 1**: Use real location
- Create site near your current location
- Use your actual GPS coordinates

**Option 2**: Increase GPS radius (recommended for testing)
- Admin → Settings
- Change GPS radius to 5000 meters
- Save settings
- Now you can check in from anywhere

## Common Issues

### "Missing Supabase environment variables"
- Ensure `.env` file exists
- Check variable names start with `VITE_`
- Restart dev server: `Ctrl+C` then `npm run dev`

### Can't login
- Verify you created profile record in Step 4
- Check email/password are correct
- Ensure user is confirmed in Supabase Auth

### "Schema errors" when running schema.sql
- Ensure using YOUR Supabase project (not Bolt's)
- Check for typos in SQL
- Try running schema.sql sections separately

### Photos not uploading
- Verify storage buckets exist
- Check buckets are set to "Public"
- Try smaller image first (<1MB)

## Keyboard Shortcuts

- `Ctrl+C` in terminal: Stop dev server
- `F12` in browser: Open DevTools (check console for errors)
- `Ctrl+Shift+R`: Hard refresh browser

## File Structure

```
mt-cleaning-cms/
├── public/              # Static files (logos)
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (Auth, Theme)
│   ├── lib/            # Utilities, Supabase client
│   ├── pages/          # Application pages
│   │   ├── admin/     # Admin pages
│   │   └── staff/     # Staff pages
│   └── App.tsx        # Main app component
├── schema.sql          # Database setup
├── functions.sql       # Database functions
├── seed-data.sql       # Test data (optional)
└── README.md          # Full documentation
```

## What to Read Next

- **README.md**: Complete documentation
- **TESTING.md**: How to test all features
- **DEPLOYMENT.md**: How to deploy to production

## Getting Help

1. Check browser console (F12) for errors
2. Check Supabase logs for backend errors
3. Review README.md for detailed docs
4. Check TESTING.md for feature walkthroughs

## Production Deployment

When ready for production:

1. Test thoroughly in development
2. Create production Supabase project
3. Deploy to Vercel/Netlify (see DEPLOYMENT.md)
4. Set production environment variables
5. Update Supabase redirect URLs
6. Create real user accounts

**Never use test/development credentials in production!**

## Feature Highlights

✅ Role-based access (Admin, Staff, Client)
✅ GPS-verified check-in/check-out
✅ Photo documentation with previews
✅ PDF report generation
✅ Real-time dashboard
✅ Incident reporting
✅ Asset management
✅ Dark mode
✅ Mobile-first responsive design
✅ Complete audit trail

---

**You're all set!** Start exploring the system and creating your cleaning management workflow.

Need more details? Check the full **README.md** for comprehensive documentation.
