import { toPng } from "html-to-image";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4001";

async function proxifyImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll("img");
  const imagePromises: Promise<void>[] = [];

  images.forEach((img) => {
    const src = img.getAttribute("src");
    // Only proxy external images (not data URLs, not relative paths)
    if (
      src &&
      !src.startsWith("data:") &&
      (src.startsWith("http") || src.startsWith("https"))
    ) {
      imagePromises.push(
        (async () => {
          try {
            const response = await fetch(
              `${API_URL}/api/proxy-image?url=${encodeURIComponent(src)}`,
            );
            if (response.ok) {
              const data = await response.json();
              img.setAttribute("src", data.dataUrl);
              console.log(`Proxified image: ${src}`);
            } else {
              console.warn(
                `Failed to proxify image: ${src} (status: ${response.status})`,
              );
            }
          } catch (error) {
            console.warn(`Error proxifying image ${src}:`, error);
            // Keep original URL if proxification fails, toPng will handle it
          }
        })(),
      );
    }
  });

  // Wait for all images to be proxified
  await Promise.all(imagePromises);
}

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

    // Proxify external images to bypass CORS restrictions
    console.log("Proxifying external images...");
    await proxifyImages(clone);

    // Convert to PNG
    console.log("Converting to PNG...");
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
