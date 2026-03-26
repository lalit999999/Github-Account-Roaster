# 🔥 GitHub Account Roaster

**Generate hilarious, AI-powered roasts of GitHub developers based on their actual profile data.** A playful web application that analyzes GitHub accounts and delivers witty, clever commentary on coding habits, repository stars, followers, and more.

---

## ✨ Features

- **AI-Powered Roasts**: Uses OpenAI API to generate unique, funny commentary tailored to each developer
- **GitHub Profile Analysis**: Fetches real data including repos, stars, followers, and bio information
- **Beautiful UI**: Modern React + TypeScript interface with Tailwind CSS styling
- **Screenshot Capture**: Download your roast as a high-quality PNG image using `html-to-image`
- **Social Sharing**: Share roasts directly to Twitter, LinkedIn, or Instagram
- **Rate Limiting**: Built-in protection against API abuse
- **Test Mode**: Mock roasts for development and testing without API calls
- **CORS Proxy**: Handles image proxying to bypass browser restrictions
- **Request Tracking**: Unique request IDs for debugging and monitoring

---

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript for type-safe UI development
- **Vite** for lightning-fast builds and dev server
- **Tailwind CSS** for responsive, utility-first styling
- **Radix UI** components for accessible, unstyled primitives
- **html-to-image** for screenshot generation

### Backend

- **Node.js + Express** for the API server
- **OpenAI API** for AI-powered roast generation
- **GitHub API** for fetching user profile and repository data
- **Helmet** for security headers
- **CORS** for cross-origin requests with whitelist protection

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- OpenAI API key (for AI roasts)
- GitHub Personal Access Token (for GitHub API access)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/github-account-roaster.git
   cd github-account-roaster
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Frontend Configuration
   VITE_API_URL=http://localhost:4001

   # Backend Configuration (Server only - NEVER expose to frontend)
   GITHUB_TOKEN=ghp_your_github_token_here
   AI_API_KEY=sk_your_openai_api_key_here
   PORT=4001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   OPENAI_MODEL=gpt-3.5-turbo
   TEST_MODE=false
   ```

4. **Start the development server**

   ```bash
   # Run both frontend and backend concurrently
   npm run dev:both

   # Or run them separately:
   npm run dev          # Frontend on http://localhost:5173
   npm run dev:server   # Backend on http://localhost:4001
   ```

---

## 📖 Usage

### 1. Web Interface

Simply visit `http://localhost:5173` and:

1. Enter a GitHub username
2. Click "Get Roasted!" to generate a custom roast
3. Download the roast card as a PNG or share it on social media

### 2. API Endpoints

#### Generate Roast

```bash
POST /api/roast
Content-Type: application/json

{
  "username": "octocat"
}
```

**Response:**

```json
{
  "username": "octocat",
  "score": 8.5,
  "roasts": "Your witty roast text here..."
}
```

#### Health Check

```bash
GET /api/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-03-26T10:30:00.000Z",
  "requestId": "req-12345"
}
```

#### Proxy Image

```bash
GET /api/proxy-image?url=https://example.com/image.png
```

**Response:**

```json
{
  "dataUrl": "data:image/png;base64,..."
}
```

---

## ⚙️ Configuration

### Environment Variables

| Variable       | Required | Description                                              |
| -------------- | -------- | -------------------------------------------------------- |
| `VITE_API_URL` | ✅       | Frontend API endpoint (e.g., `http://localhost:4001`)    |
| `GITHUB_TOKEN` | ✅       | GitHub Personal Access Token for API access              |
| `AI_API_KEY`   | ✅       | OpenAI API key for roast generation                      |
| `PORT`         | ❌       | Server port (default: `4001`)                            |
| `NODE_ENV`     | ❌       | Environment mode (development/production)                |
| `FRONTEND_URL` | ❌       | Frontend URL for CORS (default: `http://localhost:5173`) |
| `OPENAI_MODEL` | ❌       | OpenAI model (default: `gpt-3.5-turbo`)                  |
| `TEST_MODE`    | ❌       | Enable mock roasts for testing (default: `false`)        |

### Rate Limiting

The API implements configurable rate limiting to prevent abuse:

- Default: 10 requests per 15 minutes per IP
- Customize in `server/middleware/rateLimiter.js`

---

## 📁 Project Structure

```
github-account-roaster/
├── src/                          # Frontend React application
│   ├── app/
│   │   ├── App.tsx              # Main app component
│   │   ├── api/                 # API client functions
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks
│   │   └── utils/
│   │       ├── captureCard.ts   # Screenshot & download logic
│   │       └── errorMapping.ts  # Error handling utilities
│   ├── styles/                  # Global CSS and Tailwind config
│   └── main.tsx                 # React entry point
│
├── server/                       # Node.js/Express backend
│   ├── index.js                 # Server entry point
│   ├── api.js                   # Main roast generation logic
│   ├── routes/
│   │   └── roast.js            # API endpoints
│   ├── services/
│   │   ├── githubService.js    # GitHub API integration
│   │   └── aiService.js         # OpenAI API integration
│   ├── middleware/
│   │   ├── rateLimiter.js      # Rate limiting middleware
│   │   └── requestId.js         # Request tracking middleware
│   └── utils/
│       └── logger.js            # Logging utilities
│
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS config
├── package.json                # Dependencies and scripts
└── .env.local                  # Environment variables (not in git)
```

---

## 🔐 Security

- **API keys are server-side only**: Never exposed to the frontend
- **CORS whitelisting**: Only specified origins can access the API
- **Helmet.js**: Provides HTTP security headers
- **Rate limiting**: Prevents API abuse and brute-force attempts
- **Request validation**: Input sanitization on all API endpoints
- **No credentials in git**: `.gitignore` excludes `.env.local`

---

## 🛠️ Development

### Build for Production

```bash
npm run build
```

### Run Production Build Preview

```bash
npm run preview
```

### Testing in Mock Mode

Set `TEST_MODE=true` in `.env.local` to generate mock roasts without API calls:

```env
TEST_MODE=true
```

---

## 🤝 Contributing

We love contributions! Here's how to get involved:

1. **Fork the repository**

   ```bash
   git clone https://github.com/yourusername/github-account-roaster.git
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Test your changes in development mode

4. **Commit your work**

   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your branch**

   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe what your PR does
   - Reference any related issues
   - Include before/after screenshots if UI changes

### Development Guidelines

- **Code style**: Use TypeScript for frontend, modern JavaScript for backend
- **Naming**: camelCase for variables, PascalCase for components/classes
- **Comments**: Add comments for non-obvious logic
- **Error handling**: Always provide meaningful error messages

---

## 🐛 Troubleshooting

### "AI API key not configured"

- Ensure `AI_API_KEY` is set in `.env.local`
- Restart the server after updating environment variables

### "GitHub user not found"

- Verify the GitHub username is spelled correctly
- Ensure your `GITHUB_TOKEN` has public repo access permissions

### Images not displaying in captured card

- Check that `VITE_API_URL` is correctly set
- Verify the backend proxy endpoint is running
- Browser console may show CORS errors—check rate limiting

### "Rate limit exceeded"

- Wait 15 minutes before making new requests
- Consider upgrading API plans for higher limits

---

## 📊 API Limits

- **GitHub API**: 5,000 requests/hour (with authenticated token)
- **OpenAI API**: Based on your plan (typically 3-90 requests/min)
- **Rate Limiter**: 10 requests/user/15 minutes (configurable)

---

## 💡 Tips for Making It Stand Out

1. **Personalize the Humor**: Edit `generateMockRoast()` in `aiService.js` to add project-specific roasts
2. **Add Animations**: Enhance the UI with scroll/fade animations using the `motion` library already included
3. **Dark Mode Toggle**: Extend the existing theme system to include light/dark mode switching
4. **Roast History**: Store generated roasts in browser localStorage to show a user's "roast timeline"
5. **Leaderboard**: Track which developers get roasted most and display a fun leaderboard
6. **Custom Prompts**: Allow users to select roast "styles" (e.g., "Pirate Mode," "Shakespearean," "Tech Bro")
7. **Interactive Feedback**: Add reaction buttons (😂 👎 🔥) to rate roasts and improve AI prompts
8. **Export Formats**: Add PDF, SVG, or video export options using the existing capture infrastructure
9. **Batch Processing**: Allow users to roast multiple accounts at once and compare results
10. **Analytics Dashboard**: Show metrics like "Most Roasted Language" or "Average Stars per Repo"

---

## 📝 License

This project is licensed under the **MIT License**—feel free to use it for fun, learning, or building something awesome.

---

## 🙏 Acknowledgments

- Powered by **OpenAI** for the clever roast generation
- GitHub API for providing access to developer profiles
- Built with **React**, **Express**, and **Tailwind CSS**

---

## 📬 Contact & Support

Found a bug? Have an idea? Let us know!

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/github-account-roaster/issues)
- **Email**: your-email@example.com

---

**Happy roasting! 🔥** Remember: it's all in good fun—keep it clever, not cruel.
