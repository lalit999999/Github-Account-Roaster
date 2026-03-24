# 🚀 START HERE - GitHub Roast Tool

## ⚡ Quick Start (2 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env.local
# Edit .env.local and add your API keys:
#   GITHUB_TOKEN=ghp_xxxxx
#   AI_API_KEY=sk_xxxxx

# 3. Run everything
npm run dev:both

# 4. Open browser
# http://localhost:5173
```

**Done!** Enter a GitHub username and click "Roast Me!" 🔥

---

## 📖 Documentation (Based on Your Needs)

### 🏃 Just Want to Run It?

Read: **[QUICKSTART.md](./QUICKSTART.md)** (5 min)

### 🔐 Want to Understand Security?

Read: **[SECURITY.md](./SECURITY.md)** (15 min)

### 🎨 Want System Diagrams?

Read: **[VISUAL_GUIDE.md](./VISUAL_GUIDE.md)** (10 min)

### ✅ Want to Test Everything?

Read: **[VERIFICATION.md](./VERIFICATION.md)** (15 min)

### 🎯 Want Complete Overview?

Read: **[STATUS.md](./STATUS.md)** (5 min)

---

## 🎯 What You Have

### ✅ Working Frontend

- Vite + React application
- Beautiful UI with animations
- Error handling with friendly messages
- No API keys exposed

### ✅ Secure Backend

- Express.js server on port 5000
- GitHub API integration (with token)
- OpenAI API integration (with key)
- CORS and error handling

### ✅ Production Ready

- Environment variable configuration
- Proper error handling
- Security best practices
- Complete documentation

### ✅ 7 Documentation Files

- QUICKSTART.md - Setup guide
- SECURITY.md - Security architecture
- ARCHITECTURE.md - System design
- VISUAL_GUIDE.md - Diagrams
- VERIFICATION.md - Testing checklist
- IMPLEMENTATION_SUMMARY.md - What was built
- server/README.md - Backend guide

---

## 🔧 Commands Reference

```bash
# Development
npm run dev              # Frontend only
npm run dev:server      # Backend only
npm run dev:both        # Both (RECOMMENDED) ⭐

# Building
npm run build           # Build for production

# Preview
npm preview             # Preview the build
```

---

## 🌐 Endpoints

### Frontend

- **URL:** http://localhost:5173
- **Status:** Development server

### Backend

- **URL:** http://localhost:5000
- **Health:** GET http://localhost:5000/api/health
- **Roast:** POST http://localhost:5000/api/roast

---

## 📋 Key Files

### Frontend

- `src/app/App.tsx` - Main app (calls backend)
- `src/app/components/ErrorDisplay.tsx` - Error messages
- `src/app/components/UsernameInput.tsx` - Input field

### Backend

- `server/index.js` - Express server
- `server/api.js` - API handlers

### Configuration

- `.env.local` - Your API keys (git-ignored)
- `.env.example` - Template (safe to commit)

---

## ⚠️ Important: Setup Your API Keys

1. **GitHub Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token"
   - Select "public_repo" scope
   - Copy the token
   - Paste into `.env.local` as `GITHUB_TOKEN=ghp_xxxxx`

2. **OpenAI API Key:**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key
   - Paste into `.env.local` as `AI_API_KEY=sk_xxxxx`

3. **Update .env.local:**
   ```env
   GITHUB_TOKEN=ghp_your_token_here
   AI_API_KEY=sk_your_key_here
   VITE_API_URL=http://localhost:5000
   PORT=5000
   ```

---

## ✨ The Magic 🎩

**API keys NEVER reach your browser!**

```
Frontend (Your Browser)
  ↓ Only sends: { username }
  ↓ NO API KEYS
  ↓
Backend (Node.js Server)
  ├─ Has GITHUB_TOKEN (from .env)
  ├─ Has AI_API_KEY (from .env)
  ├─ Calls GitHub API
  ├─ Calls OpenAI API
  └─ Sends back only: { username, score, roasts }
  ↑ NO API KEYS IN RESPONSE
  ↑
Frontend
  └─ Displays results safely!
```

---

## 🎯 Typical Flow

```
1. You type "github" → Frontend
2. You click "Roast Me" → Frontend sends "github" to backend
3. Backend calls GitHub API with GITHUB_TOKEN (secure!)
4. Backend calls OpenAI API with AI_API_KEY (secure!)
5. Backend sends back roasts
6. Frontend displays roasts 🔥
7. Browser NEVER sees the API keys!
```

---

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Change in .env.local
PORT=5001
```

### Module Not Found

```bash
npm install
```

### API Key Errors

- Check .env.local has correct keys
- Verify keys haven't expired
- Check GitHub token has "public_repo" scope

### Can't Connect to Backend

- Make sure backend is running: `npm run dev:both`
- Check http://localhost:5000/api/health in browser/curl

---

## 📚 Full Docs

| File             | What It Is              | Read When                      |
| ---------------- | ----------------------- | ------------------------------ |
| QUICKSTART.md    | Quick setup guide       | You want to get running        |
| SECURITY.md      | Complete security guide | You need to understand why     |
| ARCHITECTURE.md  | System diagrams         | You're curious about design    |
| VISUAL_GUIDE.md  | Visual diagrams         | You learn better with pictures |
| VERIFICATION.md  | Testing checklist       | You want to verify everything  |
| STATUS.md        | Project status          | You want a summary             |
| server/README.md | Backend documentation   | You need backend details       |

---

## ✅ One Last Thing

When you run this successfully:

1. ✅ Frontend loads at http://localhost:5173
2. ✅ Backend running at http://localhost:5000
3. ✅ Enter a GitHub username
4. ✅ Click "Roast Me!"
5. ✅ See funny roasts appear! 🔥
6. ✅ Know your API keys are 100% safe 🔒

**You now have production-grade API security implemented!**

---

## 🎓 What You're Learning

This implementation teaches you:

- ✅ How companies protect API keys
- ✅ Backend-as-proxy pattern
- ✅ Proper error handling
- ✅ Security best practices
- ✅ Production deployment

---

## 🎉 Let's Go!

```bash
npm run dev:both
```

Then open: **http://localhost:5173**

Happy roasting! 🔥

---

**Questions?** Check the docs above or read SECURITY.md for detailed explanations.
