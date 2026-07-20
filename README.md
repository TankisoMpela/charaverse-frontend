# Mpela CO AI Companions

A single-page React application for browsing and chatting with AI-powered professional companions.

## Companions

| Companion | Title | Category |
|---|---|---|
| Thabo Molefe | Legal Counsel | Legal |
| Amara Dlamini | Therapeutic Counsellor | Wellness |
| Lerato Nkosi | Business Strategy Consultant | Business |
| Sipho Zulu | Career Development Coach | Career |
| Zanele Khumalo | Personal Finance Advisor | Finance |

## Features

- Streaming AI responses via OpenRouter
- Suggestion chips per companion
- Dark mode (persisted in localStorage)
- Session sidebar with conversation history
- Copy-to-clipboard for AI responses
- Intro modals with AI disclaimers
- PWA support (service worker + manifest)

## Tech Stack

- React 19, React Router DOM v7, Vite 6
- Plain CSS with custom properties (light/dark theme)
- react-markdown + remark-gfm for AI formatting
- Node.js API server (Vercel serverless function)
- OpenRouter API with fallback model chain

## Development

```bash
npm run dev    # Vite dev server
npm run api    # API server on port 3001
npm run build  # Production build
npm start      # Production mode (node server.js)
```

## Deployment

Deployed on Vercel at [mpela-co-ai-companions.vercel.app](https://mpela-co-ai-companions.vercel.app).

```bash
npx vercel --prod
```

## Environment Variables

- `OPENROUTER_API_KEY` — required for AI responses
