import React from 'react';

interface AppleLogoProps {
  size?: number;
  className?: string;
}

export function AppleLogo({ size = 16, className }: AppleLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 384 512"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-27.1-46.9-42.4-83.6-46.2-34.8-3.7-72.8 20.5-86.8 20.5-14.8 0-48.5-19.2-74-19.2C63.1 140.2 0 185 0 273.5c0 27.4 5 55.7 15.1 84.9 13.4 38.3 61.5 132.2 111.6 130.6 25.7-.7 43.8-18.4 74.7-18.4 29.7 0 46.4 18.4 74.7 18.4 50.5-.7 93.7-86.6 106.4-125C335.1 343.9 318.9 305.4 318.7 268.7zM261.3 58.6C285 30.2 282.6 4.7 281.8 0c-23.2 1.4-50.1 16-66.3 34.1-17.5 19.6-27.7 43.8-25.5 71.5 25.1 1.9 48.3-11.5 71.3-47z" />
    </svg>
  );
}
