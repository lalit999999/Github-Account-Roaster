import { toPng } from "html-to-image";

export async function captureRoastCard(
  elementId: string = "roast-card",
): Promise<{ dataUrl: string; blob: Blob } | null> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id "${elementId}" not found`);
      return null;
    }

    // Create a temporary container for the screenshot
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.backgroundColor = "#0f172a"; // Dark background
    container.style.padding = "20px";
    container.style.borderRadius = "24px";

    // Clone the element
    const clone = element.cloneNode(true) as HTMLElement;
    container.appendChild(clone);
    document.body.appendChild(container);

    // Convert to PNG
    const dataUrl = await toPng(container, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0f172a",
    });

    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Clean up
    document.body.removeChild(container);

    return { dataUrl, blob };
  } catch (error) {
    console.error("Error capturing roast card:", error);
    return null;
  }
}

export async function downloadRoastCard(username: string): Promise<void> {
  const result = await captureRoastCard();
  if (!result) return;

  const { dataUrl } = result;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `github-roast-${username}-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function shareRoastCardImage(
  platform: "twitter" | "linkedin" | "instagram",
  username: string,
): Promise<void> {
  const result = await captureRoastCard();
  if (!result) return;

  const { blob } = result;

  // Check if Web Share API is available
  if (
    navigator.share &&
    navigator.canShare({ files: [new File([blob], `roast-${username}.png`)] })
  ) {
    try {
      await navigator.share({
        files: [
          new File([blob], `roast-${username}.png`, { type: "image/png" }),
        ],
        title: "My GitHub Roast",
        text: `I got roasted by GitHub Roast Tool! 🔥 ${username}`,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  } else {
    // Fallback: download the image
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `github-roast-${username}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
