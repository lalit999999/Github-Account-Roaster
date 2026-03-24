import fetch from 'node-fetch';

/**
 * Fetch GitHub user data securely
 * Only called from backend - API key never exposed to frontend
 */
export async function fetchGitHubData(username) {
    if (!username || username.trim().length === 0) {
        throw {
            status: 400,
            type: 'EMPTY_USERNAME',
            message: 'Username is required',
        };
    }

    // Validate username format
    if (!/^[a-zA-Z0-9-_]+$/.test(username)) {
        throw {
            status: 400,
            type: 'INVALID_USERNAME',
            message: 'Invalid GitHub username format',
        };
    }

    const githubToken = process.env.GITHUB_TOKEN;

    const headers = {
        Accept: 'application/vnd.github.v3+json',
    };

    if (githubToken) {
        headers['Authorization'] = `Bearer ${githubToken}`;
    }

    try {
        // Get user profile
        const userResponse = await fetch(
            `https://api.github.com/users/${username}`,
            { headers }
        );

        // Handle specific HTTP status codes
        if (userResponse.status === 404) {
            throw {
                status: 404,
                type: 'USER_NOT_FOUND',
                message: `GitHub user "${username}" not found`,
            };
        }

        if (userResponse.status === 403) {
            // Check if it's rate limit
            const rateLimitRemaining = userResponse.headers.get('x-ratelimit-remaining');
            if (rateLimitRemaining === '0') {
                throw {
                    status: 429,
                    type: 'RATE_LIMIT_EXCEEDED',
                    message: 'GitHub API rate limit exceeded. Please try again later.',
                };
            }
            // Other 403 errors
            throw {
                status: 403,
                type: 'NETWORK_ERROR',
                message: 'GitHub API access denied',
            };
        }

        if (!userResponse.ok) {
            throw {
                status: userResponse.status,
                type: 'NETWORK_ERROR',
                message: `GitHub API error: ${userResponse.statusText}`,
            };
        }

        const userData = await userResponse.json();

        // Get user repos
        const reposResponse = await fetch(
            `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
            { headers }
        );

        if (!reposResponse.ok) {
            throw {
                status: reposResponse.status,
                type: 'NETWORK_ERROR',
                message: 'Failed to fetch user repositories',
            };
        }

        const repos = await reposResponse.json();

        return {
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
    } catch (error) {
        // Re-throw structured errors
        if (error.status && error.type) {
            throw error;
        }
        // Network errors
        throw {
            status: 503,
            type: 'NETWORK_ERROR',
            message: 'Failed to fetch GitHub data. Please check your internet connection.',
            details: error?.message,
        };
    }
}

/**
 * Generate roast using Google Gemini API securely
 * API key is never exposed to frontend
 */
export async function generateRoast(gitHubData) {
    const aiApiKey = process.env.AI_API_KEY;

    if (!aiApiKey) {
        throw {
            status: 500,
            type: 'AI_API_ERROR',
            message: 'AI API key is not configured on the server',
        };
    }

    const prompt = `Roast this GitHub developer with 3-5 funny bullet points. Be playful and humorous, not mean-spirited.

Profile data:
{
  username: "${gitHubData.profile.login}",
  repoCount: ${gitHubData.stats.publicRepos},
  totalStars: ${gitHubData.repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)},
  followers: ${gitHubData.stats.followers}
}

Top Repositories:
${gitHubData.repos
            .slice(0, 5)
            .map(
                (repo) =>
                    `- ${repo.name} (${repo.stargazers_count} stars): ${repo.description || 'No description'}`
            )
            .join('\n')}

Bio: ${gitHubData.profile.bio || 'No bio'}
Company: ${gitHubData.profile.company || 'No company'}
Location: ${gitHubData.profile.location || 'No location'}

Generate 3-5 funny, clever roast bullet points about this developer's GitHub profile and coding style.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${aiApiKey}`,
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
                                    text: `You are a funny, clever comedian who roasts GitHub developers with witty bullet points. Keep it playful and entertaining.\n\n${prompt}`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 300,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw {
                status: response.status,
                type: 'AI_API_ERROR',
                message: errorData.error?.message || 'Failed to generate roast',
            };
        }

        const data = await response.json();

        // Google Gemini API response format
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }

        throw {
            status: 500,
            type: 'AI_API_ERROR',
            message: 'Invalid response from AI API',
        };
    } catch (error) {
        // Re-throw structured errors
        if (error.status && error.type) {
            throw error;
        }
        throw {
            status: 500,
            type: 'AI_API_ERROR',
            message: 'Failed to generate roast',
            details: error?.message,
        };
    }
}

/**
 * Main function to generate roast
 * Orchestrates GitHub API and AI API calls securely on the backend
 */
export async function generateGitHubRoast(username) {
    try {
        // Fetch GitHub data - API key is secure (backend only)
        const gitHubData = await fetchGitHubData(username);

        // Generate roast using AI - API key is secure (backend only)
        const roastText = await generateRoast(gitHubData);

        // Parse roast into bullet points
        const roasts = roastText
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => line.replace(/^[-•*]\s+/, '').trim())
            .filter((line) => line.length > 0);

        // Calculate engagement score (0-100)
        const totalStars = gitHubData.repos.reduce(
            (sum, repo) => sum + repo.stargazers_count,
            0
        );
        const score = Math.min(
            100,
            Math.round(
                (gitHubData.stats.followers * 2 +
                    totalStars +
                    gitHubData.stats.publicRepos * 0.5) /
                2
            )
        );

        return {
            username: gitHubData.profile.login,
            score,
            roasts,
        };
    } catch (error) {
        // Return structured error response
        return {
            username,
            score: 0,
            roasts: [],
            error: {
                type: error.type || 'UNKNOWN_ERROR',
                message: error.message || 'Failed to generate roast',
                details: error.details,
            },
            status: error.status || 500,
        };
    }
}
