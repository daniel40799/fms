// @ts-nocheck
import React from 'react';

export interface WithTitleOnLeftProps {
  className?: string;
}

export function WithTitleOnLeft({ className }: WithTitleOnLeftProps) {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-start">
        <span className="bg-white pr-3 text-base font-semibold leading-6 text-gray-900">Projects</span>
      </div>
    </div>
  );
}

export default WithTitleOnLeft;