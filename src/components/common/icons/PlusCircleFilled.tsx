import React from 'react';

export default ({ opacity = 0.2, fillColor }: { opacity?: number; fillColor?: string }) => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" version="1.1">
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <circle fill={fillColor || 'currentColor'} fillOpacity={opacity} cx="8" cy="8" r="8" />
      <path d="M8.5,4.5 L8.5,7.5 L11.5,7.5 L11.5,8.5 L8.5,8.5 L8.5,11.5 L7.5,11.5 L7.5,8.5 L4.5,8.5 L4.5,7.5 L7.5,7.5 L7.5,4.5 L8.5,4.5 Z" fill="currentColor" />
    </g>
  </svg>
);
