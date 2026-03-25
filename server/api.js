import { fetchGitHubData, clearGitHubCache } from './services/githubService.js';
import { generateRoast } from './services/aiService.js';

// ==================== MAIN ORCHESTRATION ====================

/**
 * Main function to generate roast
 * Orchestrates GitHub API and AI API calls securely on the backend
 */
export async function generateGitHubRoast(username, requestId = 'unknown') {
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