"use client";

import React, { useState } from "react";

const MuteToggle = () => {
  // Initially, we start with audio locked (muted) until the user taps Unmute.
  const [isMuted, setIsMuted] = useState(true);

  // When the user taps the button, fire an empty utterance to unlock the audio on iOS.
  const handleToggle = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance("");
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      setIsMuted(false);
      console.log("Audio unlocked (unmuted).");
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      {isMuted && (
        <button
          onClick={handleToggle}
          className="flex items-center bg-black bg-opacity-70 text-white px-3 py-2 rounded-full cursor-pointer hover:bg-opacity-80 focus:outline-none"
        >
          {/* Simple inline SVG mute icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            {/* Speaker shape */}
            <path d="M3 10v4h4l5 5V5L7 10H3z" />
            {/* Diagonal line indicating mute */}
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.74 2.5-2.26 2.5-4.02z" />
            <line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-medium">Unmute</span>
        </button>
      )}
    </div>
  );
};

export default MuteToggle;
