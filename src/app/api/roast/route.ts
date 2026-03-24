// Fetch GitHub user data
async function fetchGitHubData(username: string, githubToken?: string) {
  if (!username || username.trim().length === 0) {
    throw {
      status: 400,
      type: "EMPTY_USERNAME",
      message: "Username is required",
    };
  }

  // Validate username format (GitHub usernames can contain alphanumeric and hyphens)
  if (!/^[a-zA-Z0-9-_]+$/.test(username)) {
    throw {
      status: 400,
      type: "INVALID_USERNAME",
      message: "Invalid GitHub username format",
    };
  }

  const token = githubToken;

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    // Get user profile
    const userResponse = await fetch(
      `https://api.github.com/users/${username}`,
      { headers },
    );

    // Handle specific HTTP status codes
    if (userResponse.status === 404) {
      throw {
        status: 404,
        type: "USER_NOT_FOUND",
        message: `GitHub user "${username}" not found`,
      };
    }

    if (userResponse.status === 403) {
      throw {
        status: 429,
        type: "RATE_LIMIT_EXCEEDED",
        message: "GitHub API rate limit exceeded. Please try again later.",
      };
    }

    if (!userResponse.ok) {
      throw {
        status: userResponse.status,
        type: "NETWORK_ERROR",
        message: `GitHub API error: ${userResponse.statusText}`,
      };
    }

    const userData = await userResponse.json();

    // Get user repos
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      { headers },
    );

    if (!reposResponse.ok) {
      throw {
        status: reposResponse.status,
        type: "NETWORK_ERROR",
        message: "Failed to fetch user repositories",
      };
    }

    const repos = await reposResponse.json();

    return {
      profile: userData,
      repos: repos,
      stats: {
        publicRepos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        bio: userData.bio,
        company: userData.company,
        location: userData.location,
      },
    };
  } catch (error: any) {
    // Re-throw our custom errors
    if (error.status && error.type) {
      throw error;
    }
    // Network errors
    throw {
      status: 503,
      type: "NETWORK_ERROR",
      message: "Failed to fetch GitHub data. Please check your internet connection.",
      details: error?.message,
    };
  }
}

// Send data to AI for roasting
async function generateRoast(gitHubData: any, aiApiKey: string) {
  if (!aiApiKey) {
    throw {
      status: 500,
      type: "AI_API_ERROR",
      message: "AI API key is not configured",
    };
  }

  const prompt = `Roast this GitHub developer with 3-5 funny bullet points. Be playful and humorous, not mean-spirited.

Profile data:
{
  username: "${gitHubData.profile.login}",
  repoCount: ${gitHubData.stats.publicRepos},
  totalStars: ${gitHubData.repos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0)},
  followers: ${gitHubData.stats.followers}
}

Top Repositories:
${gitHubData.repos
  .slice(0, 5)
  .map(
    (repo: any) =>
      `- ${repo.name} (${repo.stargazers_count} stars): ${repo.description || "No description"}`,
  )
  .join("\n")}

Bio: ${gitHubData.profile.bio || "No bio"}
Company: ${gitHubData.profile.company || "No company"}
Location: ${gitHubData.profile.location || "No location"}

Generate 3-5 funny, clever roast bullet points about this developer's GitHub profile and coding style.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a funny, clever comedian who roasts GitHub developers with witty bullet points. Keep it playful and entertaining.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        type: "AI_API_ERROR",
        message: errorData.error?.message || "Failed to generate roast",
      };
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    // Re-throw our custom errors
    if (error.status && error.type) {
      throw error;
    }
    throw {
      status: 500,
      type: "AI_API_ERROR",
      message: "Failed to generate roast",
      details: error?.message,
    };
  }
}

// Main function to generate roast for a GitHub user
export async function generateGitHubRoast(
  username: string,
  aiApiKey: string,
  githubToken?: string,
): Promise<{
  username: string;
  score: number;
  roasts: string[];
  error?: { type: string; message: string; details?: string };
  status?: number;
}> {
  try {
    // Fetch GitHub data
    const gitHubData = await fetchGitHubData(username, githubToken);

    // Generate roast using AI
    const roastText = await generateRoast(gitHubData, aiApiKey);

    // Parse roast into bullet points
    const roasts = roastText
      .split("\n")
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => line.replace(/^[-•*]\s+/, "").trim())
      .filter((line: string) => line.length > 0);

    // Calculate engagement score (0-100)
    const totalStars = gitHubData.repos.reduce(
      (sum: number, repo: any) => sum + repo.stargazers_count,
      0,
    );
    const score = Math.min(
      100,
      Math.round(
        (gitHubData.stats.followers * 2 +
          totalStars +
          gitHubData.stats.publicRepos * 0.5) /
          2,
      ),
    );

    return {
      username: gitHubData.profile.login,
      score: score,
      roasts: roasts,
    };
  } catch (error: any) {
    // Return structured error response
    return {
      username: username,
      score: 0,
      roasts: [],
      error: {
        type: error.type || "UNKNOWN_ERROR",
        message: error.message || "Failed to generate roast",
        details: error.details,
      },
      status: error.status || 500,
    };
  }
}
