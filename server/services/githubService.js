import fetch from 'node-fetch';

// ==================== CONFIGURATION ====================

const getConfig = () => ({
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    FETCH_TIMEOUT: 10000,
    MAX_USERNAME_LENGTH: 39,
    CACHE_TTL: 5 * 60 * 1000,
});

let CONFIG = null;

function ensureConfig() {
    if (!CONFIG) {
        CONFIG = getConfig();
    }
    return CONFIG;
}

// ==================== CACHE ====================

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

function validateUsername(username) {
    const trimmed = username?.trim() || '';

    if (trimmed.length === 0) {
        return { valid: false, error: 'Username is required' };
    }

    if (trimmed.length > CONFIG.MAX_USERNAME_LENGTH) {
        return {
            valid: false,
            error: `Username too long (max ${CONFIG.MAX_USERNAME_LENGTH} characters)`,
        };
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
        return {
            valid: false,
            error: 'Username can only contain letters, numbers, hyphens, and underscores',
        };
    }

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
    ensureConfig();

    const logPrefix = `[${requestId}] [fetchGitHubData]`;

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

        // Fetch repositories
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

        if (error.status && error.type) {
            throw error;
        }

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

/**
 * Clear GitHub cache
 */
export function clearGitHubCache() {
    console.log('[GitHubService] Clearing cache');
    cache.clear();
}
