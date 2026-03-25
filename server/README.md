# Backend API Server

This is the secure backend server for the GitHub Roast Tool. It handles all API key management and external API calls.

## Why a Backend?

**API keys must NEVER be exposed to the frontend.** This backend server:

- ✅ Stores API keys securely in `.env.local`
- ✅ Makes secure calls to GitHub and OpenAI APIs
- ✅ Returns only safe data to the frontend
- ✅ Keeps API credentials completely hidden

## File Structure

```
server/
├── index.js  # Express server setup and routes
└── api.js    # API handler functions
```

## Key Features

### 1. Secure GitHub API Integration (`api.js`)

```javascript
// ✅ SECURE: Token stored on server
const headers = {
  Authorization: `Bearer ${githubToken}`, // from .env.local
};
```

### 2. Secure OpenAI API Integration (`api.js`)

```javascript
// ✅ SECURE: API key stored on server
Authorization: `Bearer ${process.env.AI_API_KEY}`;
```

### 3. Express Server (`index.js`)

- CORS handling
- Request validation
- Error handling
- Health checks

## API Endpoints

### POST /api/roast

Generates a roast for a GitHub user.

**Request:**

```bash
curl -X POST http://localhost:8080/api/roast \
  -H "Content-Type: application/json" \
  -d '{"username":"linus"}'
```

**Response (Success):**

```json
{
  "username": "linus",
  "score": 87,
  "roasts": [
    "Your commits are more legendary than your beard.",
    "You've influenced more code than you've written.",
    "Your pull requests are basically law."
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

### GET /api/health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-03-24T10:30:00.000Z"
}
```

## Running the Server

### Development Mode

```bash
npm run dev:server
```

The server will start on `http://localhost:8080` (or the PORT in .env.local)

### With Frontend

```bash
npm run dev:both
```

This runs both the frontend (Vite) and backend (Express) concurrently.

### Production Mode

```bash
npm run dev:server
```

(In production, you'd set `NODE_ENV=production` in environment)

## Environment Variables

Required variables in `.env.local`:

| Variable       | Purpose                   | Example                 |
| -------------- | ------------------------- | ----------------------- |
| `GITHUB_TOKEN` | GitHub API authentication | `ghp_xxxxx`             |
| `AI_API_KEY`   | OpenAI API key            | `sk-xxxxx`              |
| `PORT`         | Server port               | `8080`                  |
| `NODE_ENV`     | Environment               | `development`           |
| `FRONTEND_URL` | Frontend origin (CORS)    | `http://localhost:5173` |

## Architecture Diagram

```
┌─────────────────────────────────┐
│  Frontend (React + Vite)        │
│  http://localhost:5173          │
└────────────┬────────────────────┘
             │
             │ POST /api/roast
             │ {username: "user"}
             ▼
┌─────────────────────────────────┐
│  Backend (Express + Node.js)    │
│  http://localhost:8080          │
│                                 │
│  ✅ API keys kept safe here   │
│  ✅ Makes GitHub API calls     │
│  ✅ Makes OpenAI API calls     │
│  ✅ Returns only safe data     │
└──────┬──────────────┬───────────┘
       │              │
       │              │
       ▼              ▼
   [GitHub]      [OpenAI]
    API with     API with
    Token        API Key
```

## Error Handling

The backend provides detailed error types for frontend handling:

- `EMPTY_USERNAME` - No username provided
- `INVALID_USERNAME` - Invalid format
- `USER_NOT_FOUND` - GitHub user doesn't exist (404)
- `RATE_LIMIT_EXCEEDED` - GitHub API rate limit hit
- `NETWORK_ERROR` - Network/connection issues
- `AI_API_ERROR` - OpenAI API error
- `UNKNOWN_ERROR` - Unexpected error

Frontend displays user-friendly messages for each error.

## Security Practices

### ✅ Implemented

- [x] API keys in `.env.local` (server-side only)
- [x] No API keys in frontend code
- [x] CORS configured
- [x] Input validation
- [x] Error handling (no sensitive data in errors)
- [x] Logging (no API keys in logs)

### Before Production

- [ ] Use HTTPS (not HTTP)
- [ ] Move secrets to platform's secret management
- [ ] Implement rate limiting
- [ ] Add authentication if needed
- [ ] Enable CORS only for your domain
- [ ] Set up API key rotation
- [ ] Monitor API usage
- [ ] Add error tracking (Sentry, etc.)

## Debugging

### Check if server is running

```bash
curl http://localhost:8080/api/health
```

Should return:

```json
{ "status": "ok", "timestamp": "..." }
```

### Check environment variables

Add this to `server/index.js` temporarily:

```javascript
console.log(
  "GitHub Token:",
  process.env.GITHUB_TOKEN ? "✅ Found" : "❌ Missing",
);
console.log("AI API Key:", process.env.AI_API_KEY ? "✅ Found" : "❌ Missing");
```

### View server logs

Server logs all requests:

```
[2024-03-24T10:30:00.000Z] POST /api/roast
[2024-03-24T10:30:01.000Z] GET /api/health
```

## Deployment

### Option 1: Node.js Server

Run Express server on a Node.js hosting platform:

- Heroku
- Railway
- Render
- Fly.io
- AWS EC2

### Option 2: Serverless Functions

Convert to serverless (AWS Lambda, Vercel functions, etc.)

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build  # Build frontend
EXPOSE 8080
CMD ["node", "server/index.js"]
```

## Troubleshooting

### "Cannot find module 'express'"

```bash
npm install
```

### "EADDRINUSE: address already in use :::8080"

Port 8080 is busy. Change in `.env.local`:

```env
PORT=5001
```

### API keys not loading

Make sure `.env.local` exists and has:

```env
GITHUB_TOKEN=ghp_xxxxx
AI_API_KEY=sk_xxxxx
```

### CORS errors

Make sure `FRONTEND_URL` in `.env.local` matches your frontend URL

### GitHub rate limit errors

You're hitting API limits. Either:

1. Use proper GitHub token (increases limit to 5,000/hour)
2. Wait for rate limit to reset (1 hour)

## Support

See [SECURITY.md](../SECURITY.md) for detailed security information.
See [QUICKSTART.md](../QUICKSTART.md) for quick setup guide.
