// @ts-nocheck
import React from 'react';

export interface WithLabelProps {
  className?: string;
}

export function WithLabel({ className }: WithLabelProps) {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-2 text-sm text-gray-500">Continue</span>
      </div>
    </div>
  );
}

export default WithLabel;