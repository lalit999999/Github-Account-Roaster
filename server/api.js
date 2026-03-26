import { fetchGitHubData, clearGitHubCache } from './services/githubService.js';
import { generateRoast } from './services/aiService.js';

// ==================== SCORE CLASSIFICATION ====================

/**
 * Classify developer tier based on score
 * @param {number} score - Engagement score (0-100+)
 * @returns {Object} Classification with tier and description
 */
function classifyDeveloper(score) {
    if (score >= 80) {
        return {
            tier: 'GitHub Legend',
            level: 5,
            emoji: '🌟',
            description: 'A true GitHub legend with legendary contributions'
        };
    } else if (score >= 60) {
        return {
            tier: 'Open Source Warrior',
            level: 4,
            emoji: '⚔️',
            description: 'An active open source contributor making waves'
        };
    } else if (score >= 40) {
        return {
            tier: 'Indie Builder',
            level: 3,
            emoji: '🔨',
            description: 'An independent builder creating cool stuff'
        };
    } else if (score >= 20) {
        return {
            tier: 'Weekend Hacker',
            level: 2,
            emoji: '💻',
            description: 'A weekend hacker experimenting and learning'
        };
    } else {
        return {
            tier: 'Beginner Dev',
            level: 1,
            emoji: '🌱',
            description: 'A beginner dev just starting their journey'
        };
    }
}

// ==================== MAIN ORCHESTRATION ====================

/**
 * Main function to generate roast
 * Orchestrates GitHub API and AI API calls securely on the backend
 */
export async function generateGitHubRoast(username, requestId = 'unknown') {
    const logPrefix = `[${requestId}] [generateGitHubRoast]`;

    try {
        const gitHubData = await fetchGitHubData(username, requestId);

        // Step 2: Handle edge case - user with no public repos
        if (!gitHubData.repos || gitHubData.repos.length === 0) {
            const classification = classifyDeveloper(0);
            return {
                username: gitHubData.profile.login,
                score: 0,
                classification,
                roasts: [
                    '🔒 No public repos found. Starting secret projects is the most GitHub thing ever!',
                    '📦 It\'s called "stealth mode" development. Everyone knows that\'s just procrastination with style.',
                ],
            };
        }

        // Generate roast using AI
        const roastText = await generateRoast(gitHubData, requestId);

        // Parse roast into bullet points
        const roasts = roastText
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => line.replace(/^[-•*]\s+/, '').trim())
            .filter((line) => line.length > 10) // Filter out very short lines
            .slice(0, 5); // Cap at 5 roasts

        if (roasts.length === 0) {
            const classification = classifyDeveloper(0);
            return {
                username: gitHubData.profile.login,
                score: 0,
                classification,
                roasts: [roastText],
            };
        }

        // Calculate engagement score
        const totalStars = gitHubData.repos.reduce(
            (sum, repo) => sum + repo.stargazers_count,
            0
        );

        // Score formula: followers * 3 + totalStars * 2 + publicRepos
        const rawScore = gitHubData.stats.followers * 3 + totalStars * 2 + gitHubData.stats.publicRepos;
        const score = Math.max(0, rawScore); // Ensure non-negative

        // Classify developer tier
        const classification = classifyDeveloper(score);

        return {
            username: gitHubData.profile.login,
            score,
            classification,
            roasts,
        };
    } catch (error) {
        console.error(`${logPrefix} Error during roast generation:`, error.message);

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