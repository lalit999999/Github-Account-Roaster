# 🔒 Security Architecture

This document explains the secure API architecture and how to run the GitHub Roast Tool safely.

## Architecture Overview

### ✅ SECURE Architecture (What we implemented)

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Frontend - Vite React)                            │
│  - Only knows about backend API URL                         │
│  - NO API keys stored                                       │
│  - NO direct GitHub/AI API calls                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ POST /api/roast
                       │ { username: "user" }
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend Server (Express.js - Node.js)                      │
│  - Stores API keys securely (.env.local)                   │
│  - Makes GitHub API calls with token                        │
│  - Makes AI API calls with key                              │
│  - Returns only safe data to frontend                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    GitHub API                    AI API (OpenAI)
    (with Bearer token)           (with API key)
```

### ❌ INSECURE Architecture (What NOT to do)

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (Frontend)                                          │
│  - Has API keys stored in code/env variables ❌            │
│  - Makes direct calls to GitHub API ❌                     │
│  - Makes direct calls to AI API ❌                         │
│  - Keys exposed in network traffic ❌                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    GitHub API                    AI API
    (vulnerable!)                (vulnerable!)
```

## Why This Matters

### Frontend Exposure Risks:

- **Browser DevTools**: Anyone can see API keys in Network tab
- **Source Maps**: Keys visible in JavaScript bundles
- **localStorage/cookies**: Attackers can steal from local storage
- **XSS Attacks**: Malicious scripts can access all keys
- **Third-party libraries**: Compromised npm packages can steal keys

### Backend Protection:

- ✅ API keys never leave the server
- ✅ Frontend can't see or access keys
- ✅ Keys are in `.env.local` (git-ignored)
- ✅ Network traffic only contains safe data
- ✅ CORS prevents cross-origin abuse

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This installs both frontend and backend dependencies.

### 2. Configure Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Fill in your API keys in `.env.local`:

```env
# Get from GitHub Settings → Developer settings → Personal access tokens
GITHUB_TOKEN=ghp_your_token_here

# Get from OpenAI Platform → API keys
AI_API_KEY=sk-your_key_here

# Backend server configuration
PORT=5000
NODE_ENV=development
VITE_API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

### 3. Run Frontend + Backend Together

**Option A: Run both in one terminal (recommended)**

```bash
npm run dev:both
```

This command:

- Starts React frontend on `http://localhost:5173`
- Starts Express backend on `http://localhost:5000`
- Backend makes secure API calls to GitHub & AI

**Option B: Run separately in two terminals**

Terminal 1 (Frontend):

```bash
npm run dev
```

Terminal 2 (Backend):

```bash
npm run dev:server
```

### 4. Test the Application

1. Open `http://localhost:5173` in your browser
2. Enter a GitHub username
3. The frontend calls `http://localhost:5000/api/roast`
4. The backend securely:
   - Uses GITHUB_TOKEN to call GitHub API
   - Uses AI_API_KEY to call OpenAI API
   - Returns roasts to the frontend
5. Frontend displays results

## API Endpoints

### POST /api/roast

**Request:**

```json
{
  "username": "github-username"
}
```

**Response (Success):**

```json
{
  "username": "github-username",
  "score": 75,
  "roasts": [
    "You start projects faster than you finish them.",
    "Your README files appear to be optional."
  ]
}
```

**Response (Error):**

```json
{
  "error": {
    "type": "USER_NOT_FOUND",
    "message": "GitHub user \"nonexistent\" not found"
  }
}
```

## Security Best Practices

### ✅ DO:

- Store API keys in `.env.local` (server-side only)
- Use backend API route for all sensitive operations
- Pass only necessary data to frontend
- Use CORS to restrict request origins
- Validate all user input on backend
- Log API errors (not sensitive data)

### ❌ DON'T:

- Put API keys in frontend environment variables (`VITE_*`)
- Call external APIs directly from frontend
- Expose error details that contain sensitive info
- Store API keys in git/version control
- Pass API keys as URL parameters
- Log full API responses with sensitive data

## Environment Variables Reference

| Variable       | Location              | Purpose                     |
| -------------- | --------------------- | --------------------------- |
| `GITHUB_TOKEN` | Server (.env.local)   | GitHub API authentication   |
| `AI_API_KEY`   | Server (.env.local)   | OpenAI API authentication   |
| `PORT`         | Server (.env.local)   | Backend server port         |
| `NODE_ENV`     | Server (.env.local)   | Development/production mode |
| `VITE_API_URL` | Frontend (.env.local) | Backend API endpoint        |
| `FRONTEND_URL` | Server (.env.local)   | Frontend origin (for CORS)  |

## Deployment Considerations

### Vercel / Netlify Functions:

Use serverless functions instead of Express server:

- Functions are the "backend"
- Deploy API as serverless function
- Frontend calls function endpoint

### Docker:

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build  # Build frontend
EXPOSE 5000
CMD ["node", "server/index.js"]
```

### Environment Variables in Production:

- Use platform's secret management (not .env file)
- GitHub Actions secrets
- Vercel/Netlify environment variable UI
- Kubernetes secrets
- AWS Secrets Manager

## Troubleshooting

### "Cannot find module 'express'"

```bash
npm install
```

### "API_API_KEY not configured"

Check that `.env.local` has `AI_API_KEY` set on the server

### CORS errors in browser console

Make sure `FRONTEND_URL` in `.env.local` matches your frontend address

### "User not found" errors

Verify the GitHub username is correct and public

### Rate limit errors

GitHub API has rate limits:

- 60 requests/hour (unauthenticated)
- 5,000 requests/hour (authenticated with token)

Wait before retrying if rate limited.

## Security Audit Checklist

Before deploying to production:

- [ ] API keys are in `.env.local` (not in code)
- [ ] `.env.local` is in `.gitignore`
- [ ] Frontend has no `VITE_GITHUB_TOKEN` or `VITE_AI_API_KEY`
- [ ] All external API calls are in backend only
- [ ] CORS is configured correctly
- [ ] Input validation exists on backend
- [ ] Error messages don't expose sensitive data
- [ ] Secrets are in platform's secret management
- [ ] HTTPS is enabled in production
- [ ] Rate limiting is implemented
- [ ] Logging doesn't capture sensitive data

## Questions?

See the main README.md for more information about the GitHub Roast Tool.
