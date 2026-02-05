# MT Cleaning Group - Cleaning Management System

A comprehensive, production-ready web application for commercial cleaning businesses. Built specifically for NSW government and healthcare contracts with verifiable digital proof of service, GPS-verified check-ins, real-time reporting, and incident management.

## Features

- **Role-Based Access Control**: Admin, Staff, and Client portals with appropriate permissions
- **GPS-Verified Check-In/Out**: Tamper-resistant location tracking for tender compliance
- **Digital Proof of Service**: PDF reports with timestamps, GPS coordinates, photos, and signatures
- **Real-Time Dashboard**: Live job monitoring and staff location tracking
- **Incident Reporting**: Quick incident logging with photos and severity levels
- **Asset Management**: Equipment register with maintenance tracking and certificate uploads
- **Photo Documentation**: Before/after photos with instant previews and cloud storage
- **Comprehensive Audit Trail**: Complete activity logging for compliance
- **Mobile-First Design**: Optimized for field staff on smartphones
- **Dark Mode**: Eye-friendly theme toggle
- **Offline Support**: Queue actions and sync when online (future enhancement)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **PDF Generation**: jsPDF
- **Maps**: Leaflet
- **PDF Viewing**: react-pdf + pdfjs-dist
- **Photo Handling**: Supabase Storage with compression

## Prerequisites

Before setting up this application, you need:

1. **Node.js** (v18 or later) - [Download](https://nodejs.org/)
2. **npm** or **yarn** package manager
3. **Your OWN Supabase project** (free tier available)

## Important: Supabase Setup

### ⚠️ CRITICAL: You Must Use Your Own Supabase Project

This application requires a Supabase backend. **You MUST create your own Supabase project.** Do not use any Bolt-provided or temporary Supabase instance.

### Step 1: Create Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization (or create one)
4. Set project details:
   - **Name**: MT Cleaning CMS (or your preference)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location (e.g., Sydney)
5. Click "Create new project" and wait for it to provision (1-2 minutes)

### Step 2: Get Your API Credentials

Once your project is ready:

1. In the Supabase dashboard, go to **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long JWT token)

### Step 3: Set Up the Database

1. In the Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `schema.sql` (from this project's root directory)
4. Paste it into the SQL editor and click "Run"
5. This will create all tables, indexes, and RLS policies

6. Create the following storage buckets:
   - Go to **Storage** in Supabase dashboard
   - Create these buckets (all public):
     - `task-photos`
     - `incident-photos`
     - `maintenance-certificates`
     - `avatars`

### Step 4: Create Your First Admin User

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Enter:
   - **Email**: your admin email
   - **Password**: create a secure password
   - **Auto Confirm User**: Yes
4. After creating the user, note the User ID (UUID)
5. Go back to **SQL Editor** and run:

```sql
INSERT INTO profiles (id, full_name, role, status)
VALUES ('your-user-id-here', 'Your Name', 'admin', 'active');
```

Replace `'your-user-id-here'` with the actual UUID from step 4.

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository (or extract the zip file)
cd mt-cleaning-cms

# Install dependencies
npm install
```

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **⚠️ Important**: Use the credentials from YOUR Supabase project created in the setup steps above.

### 3. Run the Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### 4. Login

Use the admin credentials you created in the Supabase setup step.

## Building for Production

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

The built files will be in the `dist/` directory.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub (or GitLab/Bitbucket)
2. Go to [https://vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Configure environment variables:
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
6. Click "Deploy"

Your app will be live at `https://your-project.vercel.app`

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [https://netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variables in Site Settings
7. Click "Deploy"

## Project Structure

```
mt-cleaning-cms/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Base UI components (Button, Input, Modal, etc.)
│   │   ├── Layout.tsx       # Main layout with navigation
│   │   ├── ProtectedRoute.tsx
│   │   └── Router.tsx       # Client-side routing
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── ThemeContext.tsx # Dark mode
│   ├── lib/                 # Utilities and configuration
│   │   ├── supabase.ts      # Supabase client
│   │   ├── database.types.ts # TypeScript types
│   │   ├── utils.ts         # Helper functions
│   │   └── storage.ts       # File upload utilities
│   ├── pages/               # Application pages
│   │   ├── Login.tsx
│   │   ├── admin/          # Admin pages
│   │   └── staff/          # Staff pages
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── public/                  # Static assets
├── schema.sql              # Database schema
└── functions.sql           # Edge functions (future)
```

## Key Features Guide

### For Administrators

1. **Staff Management**: Create, edit, deactivate, and delete staff members
2. **Sites Management**: Add cleaning locations with GPS coordinates
3. **Job Scheduling**: Assign jobs to staff with dates and times
4. **Real-Time Monitoring**: View job status and staff locations
5. **Reports**: Generate PDF reports with proof of service
6. **Settings**: Configure GPS radius, feature toggles, and system preferences

### For Staff/Cleaners

1. **View Jobs**: See today's and upcoming assigned jobs
2. **GPS Check-In**: Check in at job site (verified within 100m)
3. **Task Completion**: Mark tasks as complete with before/after photos
4. **Incident Reporting**: Report issues with photos and severity
5. **GPS Check-Out**: Check out when job complete
6. **View History**: Access completed job records

### GPS Verification

- Staff must be within the configured radius (default: 100 meters) of the site to check in/out
- GPS coordinates are recorded with timestamps for compliance
- Tamper-resistant for tender requirements

### Photo Uploads

- Automatic compression for faster uploads
- Instant preview after upload
- Stored securely in Supabase Storage
- Included in PDF reports

## Testing the Application

### Create Test Data

1. **Add a Client**:
   - Go to Admin → Clients
   - Add a test client organization

2. **Add a Site**:
   - Go to Admin → Sites
   - Add a site with GPS coordinates (use your current location for testing)
   - Get coordinates from Google Maps: Right-click location → Copy coordinates

3. **Create Staff Members**:
   - Go to Admin → Staff Management
   - Add test staff accounts

4. **Create Jobs**:
   - Go to Admin → Jobs
   - Create jobs and assign to staff

5. **Test Staff Workflow**:
   - Log in as staff user
   - View assigned jobs
   - Test check-in (be near the GPS coordinates or adjust the radius in settings)
   - Upload photos
   - Complete tasks
   - Check out

### Testing GPS Check-In

For development/testing, you can:
1. Use your actual location and create a site nearby
2. Temporarily increase GPS radius in Settings (e.g., 500 meters)
3. Use browser dev tools to simulate GPS location

## Troubleshooting

### "Missing Supabase environment variables" Error

- Ensure `.env` file exists in the project root
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly
- Restart the dev server after changing `.env`

### Database Errors

- Ensure you've run the `schema.sql` file in your Supabase SQL editor
- Check RLS policies are enabled (should be automatic from schema.sql)
- Verify your anon key has correct permissions

### Cannot Login

- Ensure you created a profile record for your user (see Setup Step 4)
- Check user email is confirmed in Supabase Auth dashboard
- Verify password is correct

### Photos Not Uploading

- Ensure storage buckets exist in Supabase (task-photos, incident-photos, etc.)
- Check buckets are set to public
- Verify file size is under 5MB

### GPS Check-In Not Working

- Enable location permissions in browser
- Check GPS radius setting in Settings page
- Ensure site coordinates are accurate
- Test with higher radius temporarily

## Data Privacy & Compliance

This application is designed with Australian Privacy Principles in mind:

- Minimal data collection
- Secure authentication
- GPS data only for job verification
- Photos stored securely with access controls
- Audit trail for compliance
- RLS policies prevent unauthorized data access

## Future Enhancements

- Full offline mode with background sync
- Push notifications for job assignments
- Integration with NSW Health Environmental Cleaning Audit Tool
- Automated email reports on job completion
- Advanced analytics and trends
- Client portal for facility managers
- QR code check-ins as GPS backup
- Integration with accounting software

## Support & Contribution

This is a production-ready system built for MT Cleaning Group. For customization or support:

- Review code documentation
- Check Supabase logs for backend errors
- Use browser console for frontend debugging

## License

Proprietary - MT Cleaning Group

## Security Notes

- Never commit `.env` file to version control
- Keep Supabase keys secure
- Regularly update dependencies
- Use strong passwords for all accounts
- Enable MFA on Supabase account
- Regularly backup database
- Monitor audit logs for suspicious activity

---

Built with ❤️ for professional cleaning operations in Australia.
