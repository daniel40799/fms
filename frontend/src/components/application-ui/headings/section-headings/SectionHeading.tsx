// @ts-nocheck
import React from 'react';

export interface SectionHeadingProps {
  className?: string;
}

export function SectionHeading({ className }: SectionHeadingProps) {
  return (
    <div className="border-b border-gray-200 pb-5">
      <h3 className="text-base font-semibold leading-6 text-gray-900">Job Postings</h3>
    </div>
  );
}

export default SectionHeading;