import { toPng } from "html-to-image";

const API_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:4001";

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
            } else {
              // Proxification failed, will use original URL
            }
          } catch (error) {
            // Keep original URL if proxification fails
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

    // Save original parent and position
    const originalParent = element.parentElement;
    const nextSibling = element.nextElementSibling;

    // Get exact dimensions of the card
    const rect = element.getBoundingClientRect();
    const cardWidth = Math.ceil(rect.width);
    const cardHeight = Math.ceil(rect.height);

    // Create a wrapper with exact card dimensions
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "0";
    wrapper.style.top = "0";
    wrapper.style.width = `${cardWidth}px`;
    wrapper.style.height = `${cardHeight}px`;
    wrapper.style.backgroundColor = "#0f172a";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.overflow = "hidden";
    wrapper.style.zIndex = "99999";

    // Save original styles
    const originalStyle = {
      position: element.style.position,
      left: element.style.left,
      top: element.style.top,
      transform: element.style.transform,
      zIndex: element.style.zIndex,
      width: element.style.width,
      height: element.style.height,
    };

    // Move element to wrapper for capture
    document.body.appendChild(wrapper);
    element.style.position = "static";
    element.style.margin = "0";
    element.style.zIndex = "99999";
    wrapper.appendChild(element);

    // Wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Proxify images
    await proxifyImages(element);

    // Wait for images to load
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      // Capture the wrapper with exact card dimensions
      const dataUrl = await toPng(wrapper, {
        pixelRatio: 2,
        quality: 1,
        cacheBust: true,
        width: cardWidth,
        height: cardHeight,
        backgroundColor: "#0f172a",
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      return { dataUrl, blob };
    } finally {
      // Remove wrapper from DOM
      if (wrapper.parentElement === document.body) {
        document.body.removeChild(wrapper);
      }

      // Restore element to original position
      if (originalParent) {
        if (nextSibling) {
          originalParent.insertBefore(element, nextSibling);
        } else {
          originalParent.appendChild(element);
        }
      } else {
        document.body.appendChild(element);
      }

      // Restore original styles
      element.style.position = originalStyle.position;
      element.style.left = originalStyle.left;
      element.style.top = originalStyle.top;
      element.style.transform = originalStyle.transform;
      element.style.zIndex = originalStyle.zIndex;
      element.style.width = originalStyle.width;
      element.style.height = originalStyle.height;
    }
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
