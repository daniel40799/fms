// @ts-nocheck
import React from 'react';

export interface WellOnGrayProps {
  className?: string;
}

export function WellOnGray({ className }: WellOnGrayProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-gray-200">
      <div className="px-4 py-5 sm:p-6">{/* Content goes here */}</div>
    </div>
  );
}

export default WellOnGray;