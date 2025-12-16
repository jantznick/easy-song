# Easy Song Marketing Website

A modern, static marketing website for the Easy Song mobile app.

## Features

- 🎨 Modern, hip design with Tailwind CSS
- 📱 Fully responsive
- ⚡ Fast static site (no build process needed)
- 🧩 Web components for reusable parts (header, footer)
- 🎯 SEO-friendly structure

## Structure

```
marketing/
├── index.html          # Main landing page
├── about.html          # About page (personal story)
├── components/         # Web components
│   ├── header.js      # Header component
│   └── footer.js      # Footer component
├── images/            # App screenshots (copy from frontend/public/)
│   ├── mobile-play-along.png
│   └── mobile-study-mode.png
├── styles.css         # Custom styles
└── README.md          # This file
```

## Setup

Before deploying, copy the app screenshots to the `images` folder:

```bash
# From the repo root
mkdir -p marketing/images
cp frontend/public/mobile-play-along.png marketing/images/
cp frontend/public/mobile-study-mode.png marketing/images/
```

## Deployment

This is a static site that can be deployed to any static hosting service:

### Option 1: Netlify
1. Drag and drop the `marketing` folder to Netlify
2. Done!

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the marketing directory
3. Follow prompts

### Option 3: GitHub Pages
1. Create a `gh-pages` branch
2. Copy files to the branch
3. Enable GitHub Pages in repository settings

### Option 4: Render Static Site
1. Connect your repository
2. Set root directory to `marketing`
3. Build command: (leave empty - no build needed)
4. Publish directory: `.` (current directory)

### Option 5: Any Static Host
- Upload all files in the `marketing` directory
- Ensure `index.html` is in the root
- Web components will work in modern browsers

## Customization

### Update Images
The site expects images in the `marketing/images/` folder:
- `images/mobile-play-along.png`
- `images/mobile-study-mode.png`

Copy these from `frontend/public/` before deploying, or replace with your own screenshots.

### Update Colors
The site uses Tailwind CSS. You can customize colors by:
1. Using Tailwind's color classes directly in HTML
2. Adding custom CSS in `styles.css`
3. Using Tailwind's config (requires build process)

### Update Content
Edit `index.html` directly - it's all in one file for easy customization.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Web Components API required (all modern browsers support this)
- Mobile responsive design

## Notes

- **Images**: Copy `mobile-play-along.png` and `mobile-study-mode.png` from `frontend/public/` to `marketing/images/` before deploying
- **Download links**: Update iOS and Android download buttons with actual App Store/Play Store URLs
- **About page**: The about page has a personal, indie developer tone. Feel free to customize it with your own story

