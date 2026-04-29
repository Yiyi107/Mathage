# Mathage

A math learning village for middle school students (Grades 6-8).

## Setup

### 1. Environment Variable (Required for AI features)

In Vercel dashboard:
- Go to your project → Settings → Environment Variables
- Add: `ANTHROPIC_API_KEY` = your API key from console.anthropic.com

### 2. Deploy

Push to GitHub — Vercel auto-deploys.

## API Routes

- `POST /api/sage-hint` — AI hint from Sage during tasks
- `POST /api/sage-journey` — Personalized journey reflection

## File Structure

```
mathage/
├── api/
│   ├── sage-hint.js       ← Sage hint API
│   └── sage-journey.js    ← Journey reflection API
├── chapters/
│   ├── chapter-ratios-1.html
│   ├── chapter-ratios-2.html
│   └── chapter-ratios-3.html
├── images/
│   ├── sage-default.png
│   ├── sage-smile.png
│   └── sage-surprise.png
├── index.html
├── dashboard.html
├── story.html
├── build.html
├── build-shopping.html
├── journey.html
├── sage-component.js
└── vercel.json
```
