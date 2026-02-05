# Edge Functions Deployment Guide

This folder contains Supabase Edge Functions that need to be deployed to your Supabase project.

## Functions

### create-user
Creates a new user in Supabase Auth and adds their profile to the profiles table.

### delete-user
Deletes a user from Supabase Auth (which also cascades to delete their profile).

## Manual Deployment Instructions

### Prerequisites
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

### Deploy Functions

From the project root directory, run:

```bash
# Link your project (first time only)
supabase link --project-ref jjrsvaiucajoofxcoang

# Deploy create-user function
supabase functions deploy create-user

# Deploy delete-user function
supabase functions deploy delete-user
```

### Verify Deployment

You can verify the functions are deployed by checking your Supabase dashboard:
https://supabase.com/dashboard/project/jjrsvaiucajoofxcoang/functions

## Testing

After deployment, you should be able to:
- Add new staff members from the Staff Management page
- Delete staff members from the Staff Management page

Both operations will now use the Edge Functions instead of trying to use admin SDK methods directly from the browser.

## Troubleshooting

If you get authentication errors:
1. Make sure you're logged in as an admin user in the app
2. Check that the Edge Functions are deployed correctly in the Supabase dashboard
3. Verify that JWT verification is enabled for both functions
