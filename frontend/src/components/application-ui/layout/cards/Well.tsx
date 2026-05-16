// @ts-nocheck
import React from 'react';

export interface WellProps {
  className?: string;
}

export function Well({ className }: WellProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-gray-50">
      <div className="px-4 py-5 sm:p-6">{/* Content goes here */}</div>
    </div>
  );
}

export default Well;