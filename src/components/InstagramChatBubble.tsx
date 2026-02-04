"use client";

import Link from "next/link";
import React from "react";

interface InstagramChatBubbleProps {
  instagramUsername: string;
}

const InstagramChatBubble: React.FC<InstagramChatBubbleProps> = ({
  instagramUsername,
}) => {
  if (!instagramUsername) {
    console.warn(
      "InstagramChatBubble: instagramUsername is not provided. The bubble will not be displayed."
    );
    return null;
  }

  const instagramChatUrl = `https://ig.me/m/${instagramUsername}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Hand-drawn Text Label */}
      <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-tl-xl rounded-tr-xl rounded-bl-xl shadow-sm border border-[#990000]/10 animate-in slide-in-from-bottom-2 fade-in duration-500 mr-2 relative">
        <span className="text-[#990000] text-sm font-semibold italic flex items-center gap-1" style={{ fontFamily: 'cursive' }}>
          Let's talk
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-12">
            <path d="M19 14c1.49-1.28 3.6-2.36 4.57-4.25.34-.66.63-1.6.43-2.55-.47-2.28-2.9-3.2-4.9-3.2-1.99 0-3.38 1.23-3.8 1.6l-1.3 1.1a1 1 0 0 0-1.6 0l-1.3-1.1c-.42-.37-1.81-1.6-3.8-1.6-2 0-4.43.92-4.9 3.2-.2 .95.09 1.89.43 2.55.97 1.89 3.08 2.97 4.57 4.25.5.43 1.9 1.7 5.1 4.5 3.2-2.8 4.6-4.07 5.1-4.5Z" />
            {/* Using a standard heart path but slightly rotated for style */}
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#990000" stroke="none" />
          </svg>
        </span>
        {/* Small tail for speech bubble */}
        <div className="absolute -bottom-1 right-4 w-3 h-3 bg-white/90 border-r border-b border-[#990000]/10 transform rotate-45"></div>
      </div>

      <Link
        href={instagramChatUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 bg-[#FFB800] rounded-full shadow-lg text-[#990000] hover:scale-110 hover:bg-[#990000] hover:text-[#FFB800] transition-all duration-300"
        aria-label="Chat on Instagram"
      >
        {/* Chat Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </Link>
    </div>
  );
};

export default InstagramChatBubble;
