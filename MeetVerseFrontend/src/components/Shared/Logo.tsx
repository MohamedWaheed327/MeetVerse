import React from "react";
import VideoIcon from "../../assets/Logo/icon2.png";

interface LogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export default function Logo({ className = "", imageClassName = "h-12", textClassName = "text-2xl", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img src={VideoIcon} className={`${imageClassName} w-auto object-contain -mr-2`} alt="MeetVerse Logo" />
      {showText && (
        <span className={`bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent font-extrabold tracking-tight mt-1 ${textClassName}`}>
          MeetVerse
        </span>
      )}
    </div>
  );
}
