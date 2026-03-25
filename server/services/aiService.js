import fetch from 'node-fetch';

// ==================== CONFIGURATION ====================

const getConfig = () => ({
    AI_API_KEY: process.env.AI_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    FETCH_TIMEOUT: 10000,
    MAX_ROAST_LENGTH: 2000,
});

let CONFIG = null;

function ensureConfig() {
    if (!CONFIG) {
        CONFIG = getConfig();
    }
    return CONFIG;
}

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

// ==================== AI API ====================

/**
 * Generate roast using Google Gemini API
 * API key is never exposed to frontend
 */
export async function generateRoast(gitHubData, requestId = 'unknown') {
    ensureConfig();

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
        console.log(`${logPrefix} Full Gemini API response:`, JSON.stringify(data).substring(0, 500));

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
        console.log(`${logPrefix} Roast preview: ${roastText.substring(0, 150)}`);

        if (roastText.length > CONFIG.MAX_ROAST_LENGTH) {
            console.warn(`${logPrefix} Roast exceeded max length (${CONFIG.MAX_ROAST_LENGTH}), truncating`);
            roastText = roastText.substring(0, CONFIG.MAX_ROAST_LENGTH) + '...';
        }

        console.log(`${logPrefix} Successfully generated roast`);
        return roastText;
    } catch (error) {
        console.error(`${logPrefix} Error caught:`, error.message);

        if (error.status && error.type) {
            throw error;
        }

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
