// @ts-nocheck
import React from 'react';

export interface CardEdgeToEdgeOnMobileProps {
  className?: string;
}

export function CardEdgeToEdgeOnMobile({ className }: CardEdgeToEdgeOnMobileProps) {
  return (
    <>
      {/* Be sure to use this with a layout container that is full-width on mobile */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">{/* Content goes here */}</div>
      </div>
    </>
  );
}

export default CardEdgeToEdgeOnMobile;