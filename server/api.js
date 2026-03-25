import fetch from 'node-fetch';

/**
 * Fetch GitHub user data securely
 * Only called from backend - API key never exposed to frontend
 */
export async function fetchGitHubData(username) {
    console.log(`[fetchGitHubData] Starting for username: ${username}`);

    if (!username || username.trim().length === 0) {
        console.error(`[fetchGitHubData] Empty username provided`);
        throw {
            status: 400,
            type: 'EMPTY_USERNAME',
            message: 'Username is required',
        };
    }

    // Validate username format
    if (!/^[a-zA-Z0-9-_]+$/.test(username)) {
        console.error(`[fetchGitHubData] Invalid username format: ${username}`);
        throw {
            status: 400,
            type: 'INVALID_USERNAME',
            message: 'Invalid GitHub username format',
        };
    }

    const githubToken = process.env.GITHUB_TOKEN;
    console.log(`[fetchGitHubData] GitHub token configured: ${!!githubToken}`);

    const headers = {
        Accept: 'application/vnd.github.v3+json',
    };

    if (githubToken) {
        headers['Authorization'] = `Bearer ${githubToken}`;
    }

    try {
        // Get user profile
        console.log(`[fetchGitHubData] Fetching user profile for: ${username}`);
        const userResponse = await fetch(
            `https://api.github.com/users/${username}`,
            { headers }
        );
        console.log(`[fetchGitHubData] User profile response status: ${userResponse.status}`);

        // Handle specific HTTP status codes
        if (userResponse.status === 404) {
            console.error(`[fetchGitHubData] User not found: ${username}`);
            throw {
                status: 404,
                type: 'USER_NOT_FOUND',
                message: `GitHub user "${username}" not found`,
            };
        }

        if (userResponse.status === 403) {
            console.warn(`[fetchGitHubData] 403 Forbidden for user: ${username}`);
            // Check if it's rate limit
            const rateLimitRemaining = userResponse.headers.get('x-ratelimit-remaining');
            console.log(`[fetchGitHubData] Rate limit remaining: ${rateLimitRemaining}`);
            if (rateLimitRemaining === '0') {
                console.error(`[fetchGitHubData] Rate limit exceeded`);
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
            console.error(`[fetchGitHubData] GitHub API error: ${userResponse.statusText}`);
            throw {
                status: userResponse.status,
                type: 'NETWORK_ERROR',
                message: `GitHub API error: ${userResponse.statusText}`,
            };
        }

        const userData = await userResponse.json();
        console.log(userData);

        console.log(`[fetchGitHubData] Successfully fetched user data for: ${userData.login}`);

        // Get user repos
        console.log(`[fetchGitHubData] Fetching repositories for: ${username}`);
        const reposResponse = await fetch(
            `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
            { headers }
        );
        console.log(`[fetchGitHubData] Repos response status: ${reposResponse.status}`);

        if (!reposResponse.ok) {
            console.error(`[fetchGitHubData] Failed to fetch repos: ${reposResponse.statusText}`);
            throw {
                status: reposResponse.status,
                type: 'NETWORK_ERROR',
                message: 'Failed to fetch user repositories',
            };
        }

        const repos = await reposResponse.json();
        console.log(`[fetchGitHubData] Successfully fetched ${repos.length} repositories`);

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
        console.error(`[fetchGitHubData] Error caught:`, error);
        // Re-throw structured errors
        if (error.status && error.type) {
            throw error;
        }
        // Network errors
        console.error(`[fetchGitHubData] Network error:`, error.message);
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
    console.log(`[generateRoast] Starting for user: ${gitHubData.profile.login}`);
    const aiApiKey = process.env.AI_API_KEY;

    if (!aiApiKey) {
        console.error(`[generateRoast] AI API key not configured`);
        throw {
            status: 500,
            type: 'AI_API_ERROR',
            message: 'AI API key is not configured on the server',
        };
    }
    console.log(`[generateRoast] AI API key is configured`);

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
        console.log(`[generateRoast] Calling Gemini API...`);
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${aiApiKey}`,
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
        console.log(`[generateRoast] Gemini API response status: ${response.status}`);

        if (!response.ok) {
            console.error(`[generateRoast] Gemini API error status: ${response.status}`);
            const errorData = await response.json();
            console.error(`[generateRoast] Error details:`, errorData);
            throw {
                status: response.status,
                type: 'AI_API_ERROR',
                message: errorData.error?.message || 'Failed to generate roast',
            };
        }

        const data = await response.json();
        console.log(`[generateRoast] Gemini response received, parsing candidates...`);

        // Google Gemini API response format
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const roastText = data.candidates[0].content.parts[0].text;
            console.log(`[generateRoast] Successfully generated roast, length: ${roastText.length}`);
            return roastText;
        }

        console.error(`[generateRoast] Invalid response structure from Gemini API`);
        console.error(`[generateRoast] Response data:`, JSON.stringify(data).substring(0, 200));
        throw {
            status: 500,
            type: 'AI_API_ERROR',
            message: 'Invalid response from AI API',
        };
    } catch (error) {
        console.error(`[generateRoast] Error caught:`, error);
        // Re-throw structured errors
        if (error.status && error.type) {
            throw error;
        }
        console.error(`[generateRoast] Unstructured error:`, error.message);
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
    console.log(`[generateGitHubRoast] Starting roast generation for username: ${username}`);
    try {
        // Fetch GitHub data - API key is secure (backend only)
        console.log(`[generateGitHubRoast] Step 1: Fetching GitHub data...`);
        const gitHubData = await fetchGitHubData(username);
        console.log(`[generateGitHubRoast] GitHub data fetched successfully`);

        // Generate roast using AI - API key is secure (backend only)
        console.log(`[generateGitHubRoast] Step 2: Generating AI roast...`);
        const roastText = await generateRoast(gitHubData);
        console.log(`[generateGitHubRoast] AI roast generated successfully`);

        // Parse roast into bullet points
        console.log(`[generateGitHubRoast] Step 3: Parsing roast bullet points...`);
        const roasts = roastText
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => line.replace(/^[-•*]\s+/, '').trim())
            .filter((line) => line.length > 0);
        console.log(`[generateGitHubRoast] Parsed ${roasts.length} roast bullet points`);

        // Calculate engagement score (0-100)
        console.log(`[generateGitHubRoast] Step 4: Calculating engagement score...`);
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
        console.log(`[generateGitHubRoast] Engagement score calculated: ${score}`);

        const result = {
            username: gitHubData.profile.login,
            score,
            roasts,
        };
        console.log(`[generateGitHubRoast] Roast generation completed successfully`);
        return result;
    } catch (error) {
        console.error(`[generateGitHubRoast] Error caught during roast generation:`, error);
        // Return structured error response
        const errorResponse = {
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
        console.error(`[generateGitHubRoast] Returning error response:`, errorResponse.error);
        return errorResponse;
    }
}
