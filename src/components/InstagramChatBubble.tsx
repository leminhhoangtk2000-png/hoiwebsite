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
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href={instagramChatUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full shadow-lg text-white hover:scale-110 transition-transform duration-300"
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
