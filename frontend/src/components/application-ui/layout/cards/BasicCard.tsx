// @ts-nocheck
import React from 'react';

export interface BasicCardProps {
  className?: string;
}

export function BasicCard({ className }: BasicCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:p-6">{/* Content goes here */}</div>
    </div>
  );
}

export default BasicCard;