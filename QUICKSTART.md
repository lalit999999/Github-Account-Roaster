# 🚀 Quick Start Guide - GitHub Roast Tool

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- GitHub account (for API token)
- OpenAI account (for AI API key)

## Step 1: Clone & Install

```bash
# Install all dependencies (frontend + backend)
npm install
```

## Step 2: Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# GitHub Personal Access Token
# Go to: https://github.com/settings/tokens
# Click "Generate new token" → Select "public_repo" scope
GITHUB_TOKEN=ghp_your_token_here

# OpenAI API Key
# Go to: https://platform.openai.com/api-keys
# Click "Create new secret key"
AI_API_KEY=sk_your_key_here

# Keep these defaults
VITE_API_URL=http://localhost:5000
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Step 3: Run Frontend + Backend

```bash
# Start both frontend and backend together
npm run dev:both
```

You should see:

```
VITE v6.3.5  ready in 123 ms

➜  Local:   http://localhost:5173/
```

And in another part of the output:

```
GitHub Roast API Server
Server running on port 5000
```

## Step 4: Use the App

1. Open `http://localhost:5173` in your browser
2. Enter a GitHub username
3. Click "Roast Me!" button
4. Watch as AI generates a funny roast! 🔥

## Available Commands

```bash
# Run frontend only
npm run dev

# Run backend only
npm run dev:server

# Run both (recommended)
npm run dev:both

# Build for production
npm run build

# Preview production build
npm preview
```

## Architecture

```
Frontend (Vite React) → Backend (Express) → GitHub API + OpenAI API
http://localhost:5173 → http://localhost:5000 → External APIs
```

**Key Security Point:** API keys NEVER reach the frontend. The backend keeps them safe.

## Troubleshooting

### Port Already in Use

If port 5000 is busy:

```bash
# Change in .env.local
PORT=5001
```

### Module Not Found Errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### API Errors

1. Check that API keys in `.env.local` are correct
2. On GitHub: Settings → Developer settings → Personal access tokens → Check expiration
3. On OpenAI: Check that API account has credits

### Network Errors

Make sure both services are running:

- Frontend: `http://localhost:5173` should be accessible
- Backend: `http://localhost:5000/api/health` should return `{"status":"ok"}`

## Next Steps

- Read [SECURITY.md](./SECURITY.md) for detailed security architecture
- See comments in `server/api.js` for API implementation details
- Check `src/app/App.tsx` to see how frontend calls the backend

## File Structure

```
githubroasttool/
├── src/                    # Frontend (Vite React)
│   ├── app/
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── utils/
│   └── main.tsx
├── server/                 # Backend (Express)
│   ├── index.js          # Express server
│   └── api.js            # API handlers
├── .env.local            # API keys (git-ignored)
├── .env.example          # Example configuration
├── package.json          # Dependencies & scripts
├── vite.config.ts        # Frontend config
└── SECURITY.md           # Security documentation
```

## Support

For issues:

1. Check that all dependencies are installed: `npm install`
2. Verify API keys are set correctly in `.env.local`
3. Make sure both frontend and backend are running: `npm run dev:both`
4. Check the SECURITY.md guide for detailed troubleshooting

Happy roasting! 🔥
