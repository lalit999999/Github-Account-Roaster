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

    // Create a wrapper with dark background to match the roast card design
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "-9999px";
    wrapper.style.zIndex = "-9999";
    wrapper.style.backgroundColor = "#0f172a";
    wrapper.style.padding = "40px";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";

    // Clone the element
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove problematic Tailwind classes that use oklch colors
    const removeOklchClasses = (el: HTMLElement) => {
      const classList = Array.from(el.classList);
      classList.forEach((cls) => {
        // Remove classes that might contain oklch or other unsupported colors
        if (
          cls.includes("gradient") ||
          cls.includes("from-") ||
          cls.includes("to-") ||
          cls.includes("via-")
        ) {
          el.classList.remove(cls);
        }
      });

      // Recursively process children
      Array.from(el.children).forEach((child) => {
        removeOklchClasses(child as HTMLElement);
      });
    };

    removeOklchClasses(clone);

    // Add fallback background gradient using standard CSS
    const findMainCard = (el: HTMLElement): HTMLElement | null => {
      if (el.classList.contains("backdrop-blur-lg")) return el;
      for (let child of el.children) {
        const result = findMainCard(child as HTMLElement);
        if (result) return result;
      }
      return null;
    };

    const mainCard = findMainCard(clone);
    if (mainCard) {
      mainCard.style.background =
        "linear-gradient(135deg, rgba(88, 28, 135, 0.6) 0%, rgba(30, 58, 138, 0.6) 100%)";
    }

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Wait for DOM to render
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Proxify external images to bypass CORS restrictions
    await proxifyImages(clone);

    // Wait for images to load
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Convert to PNG using html-to-image
    const dataUrl = await toPng(wrapper, {
      pixelRatio: 2,
      quality: 1,
      cacheBust: true,
    });

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Clean up
    document.body.removeChild(wrapper);

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
