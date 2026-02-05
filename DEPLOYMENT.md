# Deployment Guide - MT Cleaning CMS

This guide provides step-by-step instructions for deploying the MT Cleaning Management System to production.

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Created your own Supabase project
- [ ] Run the `schema.sql` file in Supabase SQL Editor
- [ ] Run the `functions.sql` file in Supabase SQL Editor (optional but recommended)
- [ ] Created storage buckets: `task-photos`, `incident-photos`, `maintenance-certificates`, `avatars`
- [ ] Set buckets to public access
- [ ] Created at least one admin user in Supabase Auth
- [ ] Created a profile record for the admin user
- [ ] Tested the app locally
- [ ] Obtained Supabase URL and anon key

## Option 1: Deploy to Vercel (Recommended)

Vercel provides the easiest deployment experience with automatic HTTPS, CDN, and zero configuration.

### Steps:

1. **Push Code to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - MT Cleaning CMS"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Configure build settings (auto-detected):
     - Framework: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Add Environment Variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - Click "Deploy"

3. **Post-Deployment**
   - Your app will be live at `https://your-project.vercel.app`
   - Vercel provides automatic SSL certificates
   - Every git push will trigger a new deployment
   - Use Vercel's preview deployments for testing

### Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Vercel will automatically provision SSL

## Option 2: Deploy to Netlify

### Steps:

1. **Push Code to Git**
   (Same as Vercel step 1)

2. **Deploy to Netlify**
   - Go to [https://netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Click "Add new site" → "Import an existing project"
   - Connect your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add Environment Variables (under Site Settings → Environment Variables):
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Deploy site"

3. **Post-Deployment**
   - Your site will be live at `https://your-project.netlify.app`
   - Configure custom domain in Site Settings → Domain management
   - Enable automatic deployments from git

## Option 3: Deploy to Your Own Server (VPS)

For full control, deploy to your own server (DigitalOcean, AWS, etc.)

### Requirements:
- Ubuntu 20.04+ or similar Linux server
- Node.js 18+ installed
- Nginx or Apache web server
- Domain name pointed to your server
- SSL certificate (Let's Encrypt recommended)

### Steps:

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Transfer Files to Server**
   ```bash
   # Option 1: Using SCP
   scp -r dist/* user@your-server:/var/www/mt-cleaning-cms/

   # Option 2: Using rsync
   rsync -avz dist/ user@your-server:/var/www/mt-cleaning-cms/
   ```

3. **Configure Nginx**

   Create `/etc/nginx/sites-available/mt-cleaning-cms`:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       root /var/www/mt-cleaning-cms;
       index index.html;

       # SPA routing
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Gzip compression
       gzip on;
       gzip_types text/css application/javascript application/json image/svg+xml;
       gzip_min_length 1000;

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **Enable Site and Restart Nginx**
   ```bash
   sudo ln -s /etc/nginx/sites-available/mt-cleaning-cms /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Set Up SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Environment Variables for Production

Ensure these environment variables are set in your deployment platform:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Security Notes:**
- Never commit `.env` file to git
- Use deployment platform's environment variable management
- Rotate keys periodically
- Monitor Supabase logs for suspicious activity

## Post-Deployment Configuration

### 1. Update Supabase Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

Add your production URLs:
- Site URL: `https://your-domain.com`
- Redirect URLs:
  - `https://your-domain.com/**`
  - `https://your-domain.com/reset-password`

### 2. Configure CORS (If needed)

If accessing Supabase from multiple domains, update CORS settings in Supabase Dashboard.

### 3. Set Up Monitoring

#### Vercel:
- Built-in analytics available
- Set up error tracking (e.g., Sentry)

#### Self-hosted:
```bash
# Set up log rotation
sudo apt install logrotate

# Monitor Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### 4. Create Backup Strategy

#### Database Backups:
- Supabase automatically backs up databases
- Create manual backups periodically:
  - Go to Supabase Dashboard → Database → Backups
  - Download SQL dump

#### Application Backups:
- Git repository serves as code backup
- For self-hosted: Use automated backup scripts

## Performance Optimization

### 1. Enable CDN (Vercel/Netlify)
Both platforms provide CDN by default.

### 2. Optimize Images
The app automatically compresses uploaded photos, but ensure logo images are optimized.

### 3. Monitor Performance
- Use Lighthouse in Chrome DevTools
- Aim for 90+ scores in all categories
- Monitor Core Web Vitals

## Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Restart dev server / redeploy after changing variables
- Check deployment platform's environment variable UI

### Supabase Connection Issues
- Verify Supabase project is running
- Check API keys are correct
- Ensure redirect URLs are configured
- Check Supabase service status

### 404 Errors on Refresh (SPA routing)
- Ensure server is configured for SPA routing
- For Vercel/Netlify, create `_redirects` or `vercel.json` (auto-handled)
- For Nginx, use `try_files $uri $uri/ /index.html;`

## Maintenance

### Regular Tasks:
- [ ] Monitor Supabase usage and billing
- [ ] Review audit logs for security
- [ ] Update dependencies monthly (`npm outdated`)
- [ ] Test critical paths after updates
- [ ] Backup database weekly
- [ ] Review and rotate API keys quarterly
- [ ] Monitor error logs

### Updating the Application:

1. **Test Changes Locally**
   ```bash
   git pull origin main
   npm install
   npm run build
   npm run preview
   ```

2. **Deploy Update**
   - For Vercel/Netlify: Simply push to git
   - For self-hosted: Re-run deployment steps

## Scaling Considerations

### When to Scale:

- **Database**: Upgrade Supabase plan when approaching limits
- **Storage**: Monitor photo storage usage in Supabase
- **Hosting**: Vercel/Netlify scale automatically
- **API Limits**: Watch Supabase API request quotas

### Performance Monitoring:

Monitor these metrics:
- Page load times
- API response times
- Database query performance
- Storage usage
- Active user count

## Security Checklist

- [ ] HTTPS enabled (automatic on Vercel/Netlify)
- [ ] Environment variables secured
- [ ] Supabase RLS policies tested
- [ ] User authentication working
- [ ] File upload limits enforced
- [ ] Regular security updates applied
- [ ] Backup strategy implemented
- [ ] Error logging configured
- [ ] Rate limiting considered

## Support & Maintenance Plan

### Monthly Tasks:
- Review audit logs
- Check Supabase usage
- Update dependencies
- Test critical user paths
- Review user feedback

### Quarterly Tasks:
- Security audit
- Performance optimization review
- Backup testing
- Disaster recovery drill
- Key rotation

---

**Need Help?**
- Check Supabase Documentation: https://supabase.com/docs
- Vercel Documentation: https://vercel.com/docs
- Netlify Documentation: https://docs.netlify.com

Remember: Always test changes in a staging environment before deploying to production!
