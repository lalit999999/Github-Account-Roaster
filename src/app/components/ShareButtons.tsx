import { motion } from "motion/react";
import { Linkedin, Share2, Copy, Download } from "lucide-react";
import { useState } from "react";
import { downloadRoastCard } from "../utils/captureCard";

interface ShareButtonsProps {
  username: string;
}

export function ShareButtons({ username }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadRoastCard(username);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  const shareToLinkedIn = () => {
    const text = `Just got roasted by GitHub Roast Tool! 🔥`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const shareToX = () => {
    const text = `Just got roasted by GitHub Roast Tool! 🔥 Check out my coding crimes: ${username}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank");
  };

  const buttons = [
    {
      label: "Share on LinkedIn",
      icon: Linkedin,
      onClick: shareToLinkedIn,
      className: "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/50",
    },
    {
      label: "Share on X",
      icon: Share2,
      onClick: shareToX,
      className: "bg-gray-800 hover:bg-gray-900 hover:shadow-gray-500/50",
    },
    {
      label: copied ? "Copied!" : "Copy Link",
      icon: Copy,
      onClick: handleCopyLink,
      className: "bg-gray-700 hover:bg-gray-800 hover:shadow-gray-400/50",
    },
    {
      label: downloading ? "Generating..." : "Download Image",
      icon: Download,
      onClick: handleDownload,
      className:
        "bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-purple-500/50",
      disabled: downloading,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      <div className="flex flex-wrap justify-center gap-3">
        {buttons.map((button, index) => (
          <motion.button
            key={button.label}
            onClick={button.onClick}
            disabled={button.disabled}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + index * 0.1 }}
            whileHover={!button.disabled ? { scale: 1.05, y: -2 } : {}}
            whileTap={!button.disabled ? { scale: 0.95 } : {}}
            className={`flex items-center gap-2 px-5 py-3 rounded-full text-white font-medium shadow-lg transition-all duration-300 ${button.className} ${button.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <button.icon size={18} />
            <span className="hidden sm:inline">{button.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
