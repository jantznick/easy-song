# Deployment Checklist

Use this checklist when deploying to Render + Backblaze B2.

## Pre-Deployment

- [ ] Generate `songs-list.json`: `cd backend && npm run generate-songs-list`
- [ ] Upload all files to Backblaze B2 with correct structure:
  - [ ] `songs-list.json` in bucket root
  - [ ] All `songs/{videoId}.json` files
  - [ ] All `study/{videoId}.json` files (if any)
- [ ] Note your B2 public URL format
- [ ] Configure B2 bucket as public
- [ ] Set up B2 CORS rules (add Render domain after deployment)

## Render Setup

- [ ] Push code to GitHub
- [ ] Create new Static Site on Render
- [ ] Connect GitHub repository
- [ ] Configure build settings:
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm install && npm run build`
  - [ ] Publish Directory: `dist`
- [ ] Add environment variables:
  - [ ] `VITE_API_MODE=static`
  - [ ] `VITE_STATIC_BASE_URL=<your-b2-url>`
- [ ] Deploy and wait for build to complete

## Post-Deployment

- [ ] Get your Render site URL
- [ ] Update B2 CORS rules with Render domain
- [ ] Test site functionality:
  - [ ] Home page loads song list
  - [ ] Can navigate to song player
  - [ ] Lyrics scroll correctly
  - [ ] Can navigate to study mode
  - [ ] No CORS errors in browser console
- [ ] (Optional) Set up custom domain
- [ ] (Optional) Update B2 CORS with custom domain

## Quick Commands Reference

```bash
# Generate songs list
cd backend && npm run generate-songs-list

# Local build test
cd frontend && npm run build && npm run preview

# Check environment variables (in Render dashboard)
# VITE_API_MODE=static
# VITE_STATIC_BASE_URL=https://f004.backblazeb2.com/file/your-bucket
```

## Troubleshooting Quick Fixes

- **Build fails:** Check Node.js version, ensure all deps are in package.json
- **404 on routes:** Verify `_redirects` file is in `frontend/public/`
- **CORS errors:** Check B2 CORS config, verify Render domain is allowed
- **Files not loading:** Verify B2 URL in env vars, check file paths match structure
- **Env vars not working:** Must start with `VITE_`, rebuild after changes
