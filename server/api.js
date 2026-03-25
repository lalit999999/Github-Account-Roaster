import fetch from 'node-fetch';

// ==================== CONFIGURATION ====================

// Read environment variables dynamically (after dotenv.config() in index.js)
const getConfig = () => ({
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    AI_API_KEY: process.env.AI_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    FETCH_TIMEOUT: 10000,
    MAX_USERNAME_LENGTH: 39,
    MAX_ROAST_LENGTH: 2000,
    CACHE_TTL: 5 * 60 * 1000,
});

let CONFIG = null;
let configLogged = false;

// Helper function to get config with lazy initialization and logging
function ensureConfig() {
    if (!CONFIG) {
        CONFIG = getConfig();
        if (!configLogged) {
            console.log('[api.js] Environment configuration loaded:');
            console.log(`  - GITHUB_TOKEN: ${CONFIG.GITHUB_TOKEN ? 'Configured ✓' : 'NOT CONFIGURED ✗'}`);
            console.log(`  - AI_API_KEY: ${CONFIG.AI_API_KEY ? 'Configured ✓' : 'NOT CONFIGURED ✗'}`);
            console.log(`  - GEMINI_MODEL: ${CONFIG.GEMINI_MODEL}`);
            configLogged = true;
        }
    }
    return CONFIG;
}

// ==================== CACHING ====================

/**
 * Simple in-memory cache for GitHub data
 * In production, use Redis or similar
 */
class DataCache {
    constructor() {
        this.data = new Map();
    }

    get(key) {
        const cached = this.data.get(key);
        if (!cached) return null;

        const isExpired = Date.now() - cached.timestamp > CONFIG.CACHE_TTL;
        if (isExpired) {
            this.data.delete(key);
            return null;
        }

        return cached.value;
    }

    set(key, value) {
        this.data.set(key, {
            value,
            timestamp: Date.now(),
        });
    }

    clear() {
        this.data.clear();
    }
}

const cache = new DataCache();

// ==================== UTILITIES ====================

/**
 * Fetch with timeout
 * Prevents hanging requests
 */
async function fetchWithTimeout(url, options = {}, timeout = CONFIG.FETCH_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
    }
}

/**
 * Validate GitHub username format and length
 */
function validateUsername(username) {
    const trimmed = username?.trim() || '';

    // Check if empty
    if (trimmed.length === 0) {
        return { valid: false, error: 'Username is required' };
    }

    // Check length
    if (trimmed.length > CONFIG.MAX_USERNAME_LENGTH) {
        return {
            valid: false,
            error: `Username too long (max ${CONFIG.MAX_USERNAME_LENGTH} characters)`,
        };
    }

    // Check format - GitHub allows alphanumeric, hyphens, underscores
    if (!/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
        return {
            valid: false,
            error: 'Username can only contain letters, numbers, hyphens, and underscores',
        };
    }

    // Username cannot start or end with hyphen
    if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
        return { valid: false, error: 'Username cannot start or end with a hyphen' };
    }

    return { valid: true, error: null };
}

// ==================== GITHUB API ====================

/**
 * Fetch GitHub user data and repositories
 * Only called from backend - API key never exposed to frontend
 */
export async function fetchGitHubData(username, requestId = 'unknown') {
    const logPrefix = `[${requestId}] [fetchGitHubData]`;
    console.log(`${logPrefix} Starting for username: ${username}`);

    // Validate username
    const validation = validateUsername(username);
    if (!validation.valid) {
        console.error(`${logPrefix} Validation failed: ${validation.error}`);
        throw {
            status: 400,
            type: 'INVALID_USERNAME',
            message: validation.error,
        };
    }

    const cleanUsername = username.trim();

    // Check cache first
    const cacheKey = `gh:${cleanUsername}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log(`${logPrefix} Cache hit for ${cleanUsername}`);
        return cached;
    }

    const headers = {
        Accept: 'application/vnd.github.v3+json',
    };

    if (CONFIG.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${CONFIG.GITHUB_TOKEN}`;
        console.log(`${logPrefix} Using authenticated GitHub API`);
    } else {
        console.warn(`${logPrefix} No GitHub token - using unauthenticated API (limited to 60 req/hour)`);
    }

    try {
        // Fetch user profile
        console.log(`${logPrefix} Fetching user profile for: ${cleanUsername}`);
        const userResponse = await fetchWithTimeout(
            `https://api.github.com/users/${cleanUsername}`,
            { headers },
            CONFIG.FETCH_TIMEOUT
        );
        console.log(`${logPrefix} User profile response status: ${userResponse.status}`);

        // Handle specific HTTP status codes
        if (userResponse.status === 404) {
            console.error(`${logPrefix} User not found: ${cleanUsername}`);
            throw {
                status: 404,
                type: 'USER_NOT_FOUND',
                message: `GitHub user "${cleanUsername}" not found`,
            };
        }

        if (userResponse.status === 403) {
            const rateLimitRemaining = userResponse.headers.get('x-ratelimit-remaining');
            console.warn(`${logPrefix} 403 Forbidden - Rate limit remaining: ${rateLimitRemaining}`);

            if (rateLimitRemaining === '0') {
                throw {
                    status: 429,
                    type: 'RATE_LIMIT_EXCEEDED',
                    message: 'GitHub API rate limit exceeded. Please try again in an hour.',
                };
            }

            throw {
                status: 403,
                type: 'ACCESS_DENIED',
                message: 'GitHub API access denied. Check token permissions.',
            };
        }

        if (!userResponse.ok) {
            console.error(`${logPrefix} GitHub API error: ${userResponse.statusText}`);
            throw {
                status: userResponse.status || 503,
                type: 'GITHUB_API_ERROR',
                message: `GitHub API error: ${userResponse.statusText}`,
            };
        }

        const userData = await userResponse.json();
        console.log(`${logPrefix} Successfully fetched user: ${userData.login}`);

        // Fetch user repositories (sorted by stars, not just updated)
        // Limit to top 30 repositories by stars for efficiency
        console.log(`${logPrefix} Fetching repositories for: ${cleanUsername}`);
        const reposResponse = await fetchWithTimeout(
            `https://api.github.com/users/${cleanUsername}/repos?per_page=30&sort=stars&order=desc`,
            { headers },
            CONFIG.FETCH_TIMEOUT
        );
        console.log(`${logPrefix} Repos response status: ${reposResponse.status}`);

        if (!reposResponse.ok) {
            console.error(`${logPrefix} Failed to fetch repos: ${reposResponse.statusText}`);
            throw {
                status: reposResponse.status || 503,
                type: 'GITHUB_API_ERROR',
                message: 'Failed to fetch user repositories',
            };
        }

        const repos = await reposResponse.json();
        console.log(`${logPrefix} Successfully fetched ${repos.length} repositories`);

        const result = {
            profile: userData,
            repos,
            stats: {
                publicRepos: userData.public_repos,
                followers: userData.followers,
                following: userData.following,
                bio: userData.bio,
                company: userData.company,
                location: userData.location,
            },
        };

        // Cache the result
        cache.set(cacheKey, result);
        console.log(`${logPrefix} Cached result for ${cleanUsername}`);

        return result;
    } catch (error) {
        console.error(`${logPrefix} Error caught:`, error.message);

        // Re-throw structured errors
        if (error.status && error.type) {
            throw error;
        }

        // Network/timeout errors
        if (error.message.includes('timeout')) {
            throw {
                status: 504,
                type: 'REQUEST_TIMEOUT',
                message: 'GitHub API request timed out. Please try again.',
            };
        }

        console.error(`${logPrefix} Network error:`, error.message);
        throw {
            status: 503,
            type: 'NETWORK_ERROR',
            message: 'Failed to fetch GitHub data. Please check your internet connection.',
            details: error?.message,
        };
    }
}

// ==================== AI API ====================

/**
 * Generate roast using Google Gemini API
 * API key is never exposed to frontend
 */
export async function generateRoast(gitHubData, requestId = 'unknown') {
    const logPrefix = `[${requestId}] [generateRoast]`;
    console.log(`${logPrefix} Starting for user: ${gitHubData.profile.login}`);

    if (!CONFIG.AI_API_KEY) {
        console.error(`${logPrefix} AI API key not configured`);
        throw {
            status: 500,
            type: 'AI_CONFIG_ERROR',
            message: 'AI API key is not configured on the server',
        };
    }

    const totalStars = gitHubData.repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

    const prompt = `Roast this GitHub developer with 3-5 funny bullet points. Be playful and humorous, not mean-spirited. Make it witty and clever.

Profile:
- Username: ${gitHubData.profile.login}
- Public repos: ${gitHubData.stats.publicRepos}
- Total stars: ${totalStars}
- Followers: ${gitHubData.stats.followers}
- Bio: ${gitHubData.profile.bio || 'N/A'}
- Company: ${gitHubData.profile.company || 'N/A'}
- Location: ${gitHubData.profile.location || 'N/A'}

Top Repositories:
${gitHubData.repos
            .slice(0, 5)
            .map(
                (repo) =>
                    `- ${repo.name} (${repo.stargazers_count} ⭐): ${repo.description || 'No description provided'}`
            )
            .join('\n')}

Generate 3-5 funny, clever roast bullet points about this developer. Each point should be a complete sentence or short phrase starting with a bullet point (-).`;

    try {
        console.log(`${logPrefix} Calling Gemini API (model: ${CONFIG.GEMINI_MODEL})...`);
        const response = await fetchWithTimeout(
            `https://generativelanguage.googleapis.com/v1/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.AI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are a funny, clever comedian roasting GitHub developers. Keep it playful, witty, and entertaining. Never be mean-spirited or insulting.\n\n${prompt}`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 300,
                        topP: 0.95,
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                        },
                    ],
                }),
            },
            CONFIG.FETCH_TIMEOUT
        );

        console.log(`${logPrefix} Gemini API response status: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`${logPrefix} Gemini API error:`, errorData);

            if (response.status === 429) {
                throw {
                    status: 429,
                    type: 'AI_RATE_LIMIT',
                    message: 'AI API rate limit exceeded. Please try again later.',
                };
            }

            if (response.status === 401) {
                throw {
                    status: 500,
                    type: 'AI_AUTH_ERROR',
                    message: 'AI API authentication failed',
                };
            }

            throw {
                status: response.status || 503,
                type: 'AI_API_ERROR',
                message: errorData.error?.message || 'Failed to generate roast from AI API',
            };
        }

        const data = await response.json();
        console.log(`${logPrefix} Gemini response received, parsing...`);

        // Validate Google Gemini API response structure
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error(`${logPrefix} Invalid response structure:`, JSON.stringify(data).substring(0, 200));
            throw {
                status: 500,
                type: 'AI_RESPONSE_ERROR',
                message: 'Invalid response from AI API',
            };
        }

        let roastText = data.candidates[0].content.parts[0].text.trim();
        console.log(`${logPrefix} Generated roast length: ${roastText.length} chars`);

        // Cap response length
        if (roastText.length > CONFIG.MAX_ROAST_LENGTH) {
            console.warn(`${logPrefix} Roast exceeded max length (${CONFIG.MAX_ROAST_LENGTH}), truncating`);
            roastText = roastText.substring(0, CONFIG.MAX_ROAST_LENGTH) + '...';
        }

        console.log(`${logPrefix} Successfully generated roast`);
        return roastText;
    } catch (error) {
        console.error(`${logPrefix} Error caught:`, error.message);

        // Re-throw structured errors
        if (error.status && error.type) {
            throw error;
        }

        // Timeout errors
        if (error.message.includes('timeout')) {
            throw {
                status: 504,
                type: 'REQUEST_TIMEOUT',
                message: 'AI API request timed out. Please try again.',
            };
        }

        console.error(`${logPrefix} Unstructured error:`, error.message);
        throw {
            status: 503,
            type: 'AI_API_ERROR',
            message: 'Failed to generate roast. Please try again later.',
            details: error?.message,
        };
    }
}

// ==================== MAIN ORCHESTRATION ====================

/**
 * Main function to generate roast
 * Orchestrates GitHub API and AI API calls securely on the backend
 */
export async function generateGitHubRoast(username, requestId = 'unknown') {
    // Ensure config is loaded before processing
    ensureConfig();

    const logPrefix = `[${requestId}] [generateGitHubRoast]`;
    console.log(`${logPrefix} Starting roast generation for: ${username}`);

    try {
        // Step 1: Fetch GitHub data (API key is secure - backend only)
        console.log(`${logPrefix} Step 1: Fetching GitHub data...`);
        const gitHubData = await fetchGitHubData(username, requestId);
        console.log(`${logPrefix} GitHub data fetched successfully`);

        // Step 2: Handle edge case - user with no public repos
        if (!gitHubData.repos || gitHubData.repos.length === 0) {
            console.warn(`${logPrefix} User has no public repositories`);
            return {
                username: gitHubData.profile.login,
                score: 0,
                roasts: [
                    '🔒 No public repos found. Starting secret projects is the most GitHub thing ever!',
                    '📦 It\'s called "stealth mode" development. Everyone knows that\'s just procrastination with style.',
                ],
            };
        }

        // Step 3: Generate roast using AI (API key is secure - backend only)
        console.log(`${logPrefix} Step 2: Generating AI roast...`);
        const roastText = await generateRoast(gitHubData, requestId);
        console.log(`${logPrefix} AI roast generated successfully`);

        // Step 4: Parse roast into bullet points
        console.log(`${logPrefix} Step 3: Parsing roast bullet points...`);
        const roasts = roastText
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => line.replace(/^[-•*]\s+/, '').trim())
            .filter((line) => line.length > 10) // Filter out very short lines
            .slice(0, 5); // Cap at 5 roasts

        console.log(`${logPrefix} Parsed ${roasts.length} roast bullet points`);

        // If no valid roasts were parsed, return the raw text
        if (roasts.length === 0) {
            console.warn(`${logPrefix} Could not parse roasts, returning raw text`);
            return {
                username: gitHubData.profile.login,
                score: 0,
                roasts: [roastText],
            };
        }

        // Step 5: Calculate engagement score (0-100)
        console.log(`${logPrefix} Step 4: Calculating engagement score...`);
        const totalStars = gitHubData.repos.reduce(
            (sum, repo) => sum + repo.stargazers_count,
            0
        );

        // Score formula: followers (weighted 2x) + stars + repos (weighted 0.5x)
        const score = Math.min(
            100,
            Math.round(
                (gitHubData.stats.followers * 2 + totalStars + gitHubData.stats.publicRepos * 0.5) / 2
            )
        );

        console.log(`${logPrefix} Engagement score: ${score}/100`);

        const result = {
            username: gitHubData.profile.login,
            score,
            roasts,
        };

        console.log(`${logPrefix} ✅ Roast generation completed successfully`);
        return result;
    } catch (error) {
        console.error(`${logPrefix} ❌ Error during roast generation:`, error.message);

        // Return structured error response
        const errorResponse = {
            username: username.trim(),
            score: 0,
            roasts: [],
            error: {
                type: error.type || 'UNKNOWN_ERROR',
                message: error.message || 'Failed to generate roast',
                ...(error.details && { details: error.details }),
            },
            status: error.status || 500,
        };

        console.error(`${logPrefix} Error response:`, errorResponse.error);
        return errorResponse;
    }
}

// ==================== UTILITIES EXPORT ====================

/**
 * Clear cache (useful for testing and cache invalidation)
 */
export function clearCache() {
    console.log('[Cache] Clearing all cached data');
    cache.clear();
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats() {
    return {
        size: cache.data.size,
        items: Array.from(cache.data.keys()),
        ttl: CONFIG.CACHE_TTL,
    };
}