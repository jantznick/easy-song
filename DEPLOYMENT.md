# Deployment Guide: Render Static Site + Backblaze B2

This guide walks you through deploying the Easy Song frontend as a static site on Render, with data files hosted on Backblaze B2.

## Prerequisites

- A Render account (free tier works)
- A Backblaze B2 account and bucket
- Your song data files ready to upload

## Step 1: Prepare Your Data Files

1. **Generate the songs list:**
   ```bash
   cd backend
   npm install
   npm run generate-songs-list
   ```
   This creates `backend/data/songs-list.json`.

2. **Upload files to Backblaze B2:**
   
   Upload your files to your B2 bucket with this structure:
   ```
   your-bucket/
   ├── songs-list.json          # From backend/data/songs-list.json
   ├── songs/
   │   ├── {videoId1}.json
   │   ├── {videoId2}.json
   │   └── ...
   └── study/
       ├── {videoId1}.json      # Optional study data
       ├── {videoId2}.json
       └── ...
   ```

3. **Get your B2 public URL:**
   - In Backblaze B2, go to your bucket
   - Note the public URL format: `https://f{accountId}.{region}.backblazeb2.com/file/{bucketName}/`
   - Or if you have a custom domain/CDN: `https://your-cdn-domain.com/`

## Step 2: Configure Backblaze B2 CORS

To allow your Render site to fetch files from B2, configure CORS:

1. In Backblaze B2, go to **Bucket Settings** → **CORS Rules**
2. Add a CORS rule with these settings:
   ```json
   {
     "corsRules": [
       {
         "corsRuleName": "AllowRenderSite",
         "allowedOrigins": [
           "https://your-app-name.onrender.com",
           "http://localhost:5173"
         ],
         "allowedHeaders": ["*"],
         "allowedOperations": ["b2_download_file_by_name", "sGet"],
         "exposeHeaders": ["x-bz-content-sha1", "x-bz-file-id", "x-bz-file-name"],
         "maxAgeSeconds": 3600
       }
     ]
   }
   ```
   Replace `your-app-name.onrender.com` with your actual Render domain.

   **Note:** For development, you can use `["*"]` for `allowedOrigins`, but restrict it in production.

3. **Make your bucket public:**
   - Go to **Bucket Settings** → **File List Authorization**
   - Select **Public** (or configure specific file permissions)

## Step 3: Set Up Render Static Site

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create a new Static Site on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **New +** → **Static Site**
   - Connect your GitHub repository

3. **Configure the build settings:**
   - **Name:** `easy-song` (or your preferred name)
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Add Environment Variables:**
   Click **Environment** and add:
   ```
   VITE_API_MODE=static
   VITE_STATIC_BASE_URL=https://f{accountId}.{region}.backblazeb2.com/file/{bucketName}
   ```
   
   Replace with your actual B2 URL. Example:
   ```
   VITE_STATIC_BASE_URL=https://f004.backblazeb2.com/file/my-music-bucket
   ```

5. **Advanced Settings:**
   - **Headers:** Render automatically handles client-side routing for React Router
   - The `_redirects` file in `frontend/public/` is included as a backup (uses Netlify format)
   - **Custom Headers:** You can add custom headers if needed for security

6. **Deploy:**
   - Click **Create Static Site**
   - Render will build and deploy your site
   - Your site will be available at `https://your-app-name.onrender.com`

## Step 4: Verify Deployment

1. **Check the build logs:**
   - Ensure the build completes successfully
   - Verify environment variables are set correctly

2. **Test your site:**
   - Visit your Render URL
   - Check browser console for any CORS errors
   - Verify songs load correctly
   - Test navigation between pages

3. **If you see CORS errors:**
   - Double-check your B2 CORS configuration
   - Ensure your Render domain is in the `allowedOrigins` list
   - Verify the bucket is public

## Step 5: Custom Domain (Optional)

1. **In Render:**
   - Go to your static site settings
   - Click **Custom Domains**
   - Add your domain and follow DNS setup instructions

2. **Update B2 CORS:**
   - Add your custom domain to the `allowedOrigins` in B2 CORS rules

3. **Update Environment Variable:**
   - If needed, update `VITE_STATIC_BASE_URL` to use your custom CDN domain

## Updating Your Site

### Adding New Songs

1. Generate new song data using your backend scripts
2. Run `npm run generate-songs-list` to update the list
3. Upload new files to B2:
   - Upload `songs-list.json` (overwrite existing)
   - Upload new `songs/{videoId}.json` files
   - Upload new `study/{videoId}.json` files if applicable
4. Clear your browser cache or wait for CDN cache to expire

### Redeploying Frontend

- Push changes to your GitHub repository
- Render will automatically rebuild and redeploy
- Or manually trigger a deploy from the Render dashboard

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Files Not Loading
- Check browser console for 404 or CORS errors
- Verify B2 URLs are correct in environment variables
- Ensure files are uploaded to correct paths in B2
- Check B2 bucket is public and CORS is configured

### Routing Issues
- Render should handle client-side routing automatically
- If you see 404s on direct URL access, ensure `_redirects` file is in place (see below)

### Environment Variables Not Working
- Environment variables must start with `VITE_` to be available in the build
- Rebuild the site after changing environment variables
- Check that variables are set in Render dashboard, not just locally

## File Structure Reference

```
your-repo/
├── frontend/
│   ├── src/
│   ├── public/
│   │   └── _redirects          # For client-side routing
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   └── data/
│       ├── songs-list.json     # Generated, upload to B2 root
│       ├── songs/              # Upload contents to B2/songs/
│       └── study/              # Upload contents to B2/study/
└── DEPLOYMENT.md
```

## Cost Considerations

- **Render:** Free tier includes 750 hours/month (enough for always-on static sites)
- **Backblaze B2:** 
  - First 10GB storage: Free
  - Download: $0.01/GB (first 1GB free per day)
  - Very cost-effective for static file hosting

## Security Notes

- B2 bucket should be public for file access
- CORS should be restricted to your Render domain(s) in production
- Consider using a CDN in front of B2 for better performance and caching
