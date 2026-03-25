import fetch from 'node-fetch';

// ==================== CONFIGURATION ====================

const getConfig = () => ({
    AI_API_KEY: process.env.AI_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    FETCH_TIMEOUT: 10000,
    MAX_ROAST_LENGTH: 2000,
    TEST_MODE: process.env.TEST_MODE === 'true', // Mock AI responses for testing
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
 * Generate mock roast for testing (bypasses actual API calls)
 * Creates unique roasts based on the developer's GitHub data
 */
function generateMockRoast(gitHubData) {
    const username = gitHubData.profile.login;
    const repos = gitHubData.stats.publicRepos;
    const followers = gitHubData.stats.followers;
    const totalStars = gitHubData.repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const bio = gitHubData.profile.bio || '';
    const company = gitHubData.profile.company || '';
    const location = gitHubData.profile.location || '';
    const topRepos = gitHubData.repos.slice(0, 5);

    const roastLines = [];

    // Username-based roasts
    if (username.length > 15) {
        roastLines.push(`- Your username is ${username.length} characters... clearly commitment issues`);
    } else if (username.length < 5) {
        roastLines.push(`- Username so short (${username}), even your commit messages are longer`);
    }

    // Repository count roasts
    if (repos === 0) {
        roastLines.push(`- 0 public repositories... are you sure this isn't your LinkedIn profile?`);
    } else if (repos === 1) {
        roastLines.push(`- 1 repository... and it's probably 'learning-javascript' from 2015`);
    } else if (repos > 50) {
        roastLines.push(`- ${repos} repositories... do you have a job or just copy-paste framework tutorials?`);
    } else {
        roastLines.push(`- ${repos} repositories, yet somehow ${totalStars} is still a sad number of stars`);
    }

    // Followers roast
    if (followers === 0) {
        roastLines.push(`- ${followers} followers... even your commits don't follow you`);
    } else if (followers < 5) {
        roastLines.push(`- Only ${followers} followers, and ${followers - 1} of them are probably bots`);
    } else if (followers > 1000) {
        roastLines.push(`- ${followers} followers but your code reviews still ask for explanation on line breaks`);
    } else {
        roastLines.push(`- ${followers} followers watching you push code... I'm sorry for them`);
    }

    // Stars roast
    if (totalStars === 0) {
        roastLines.push(`- Total stars: 0. Your code is literally less popular than a 404 error`);
    } else if (totalStars < 10) {
        roastLines.push(`- Only ${totalStars} stars combined... did you even try testing before pushing?`);
    } else if (totalStars > 10000) {
        roastLines.push(`- ${totalStars} stars but your README still says 'TODO: Write description'`);
    } else {
        roastLines.push(`- ${totalStars} stars... that's one per person who actually read your code`);
    }

    // Top repo roasts
    if (topRepos.length > 0) {
        const topRepo = topRepos[0];
        if (topRepo.description && topRepo.description.length < 5) {
            roastLines.push(`- Repository '${topRepo.name}' has a description shorter than a comment`);
        } else if (!topRepo.description) {
            roastLines.push(`- '${topRepo.name}' has no description... just like your commit messages have no meaning`);
        } else if (topRepo.stargazers_count === 0) {
            roastLines.push(`- '${topRepo.name}' with ${topRepo.stargazers_count} stars... even 'Hello World' projects perform better`);
        }
    }

    // Bio roasts
    if (!bio || bio === '') {
        roastLines.push(`- No bio yet... probably waiting for someone to write one for you in a pull request`);
    } else if (bio.includes('developer') && bio.includes('lover')) {
        roastLines.push(`- Your bio: "Developer and lover"... your code proves you're better at the first one`);
    } else if (bio.includes('learning')) {
        roastLines.push(`- Bio says you're "learning"... and it shows in every commit`);
    }

    // Company roasts
    if (!company || company === '') {
        roastLines.push(`- No company listed... self-employed debugging your own code? Bold strategy`);
    } else {
        roastLines.push(`- Works at '${company}'... they must have a very generous bug tolerance policy`);
    }

    // Location roast
    if (location && location !== '') {
        roastLines.push(`- Based in ${location}... time zones can't explain why your code breaks at 3 AM`);
    }

    // Generic witty roasts for variety
    const wittyRoasts = [
        `- Your git history looks like a ransom note written in console errors`,
        `- "Works on my machine" is your deployment strategy? That's bold`,
        `- I've seen cleaner code in Stack Overflow's bad examples section`,
        `- Your pull requests need pull requests`,
        `- Error handling: 'If it crashes, it's the user's computer' - circa ${new Date().getFullYear()}`,
        `- Node_modules > actual code ratio defies the laws of physics`,
        `- More TODO comments than actual working features`,
        `- Your variable names: undefined, untitled_final_v3_backup_REAL`,
        `- Function complexity: O(n²) where n = your confidence level`,
    ];

    // Add a couple witty roasts to fill out the list
    while (roastLines.length < 5 && wittyRoasts.length > 0) {
        const randomWitty = wittyRoasts.splice(Math.floor(Math.random() * wittyRoasts.length), 1)[0];
        roastLines.push(`- ${randomWitty}`);
    }

    // Return 3-5 roast lines
    const selectedRoasts = roastLines.slice(0, 5);
    return selectedRoasts.join('\n');
}

/**
 * Generate roast using Google Gemini API
 * API key is never exposed to frontend
 */
export async function generateRoast(gitHubData, requestId = 'unknown') {
    ensureConfig();

    const logPrefix = `[${requestId}] [generateRoast]`;
    console.log(`${logPrefix} Starting for user: ${gitHubData.profile.login}`);

    // Use mock responses in test mode
    if (CONFIG.TEST_MODE) {
        console.log(`${logPrefix} TEST_MODE enabled - returning mock roast`);
        const mockRoast = generateMockRoast(gitHubData);
        return mockRoast;
    }

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
