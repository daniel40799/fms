// @ts-nocheck
import React from 'react';

export interface CardHeadingsComponentProps {
  className?: string;
}

export function CardHeadingsComponent({ className }: CardHeadingsComponentProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
      <h3 className="text-base font-semibold leading-6 text-gray-900">Job Postings</h3>
    </div>
  );
}

export default CardHeadingsComponent;