// @ts-nocheck
import React from 'react';

export interface ListItem {
  id: number;
}

export interface SeparateCardsFullWidthOnMobileProps {
  items?: ListItem[];
  className?: string;
}

export function SeparateCardsFullWidthOnMobile({
  items = [],
  className,
}: SeparateCardsFullWidthOnMobileProps) {
  return (
    <ul role="list" className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="overflow-hidden bg-white px-4 py-4 shadow sm:rounded-md sm:px-6">
          {/* Your content */}
        </li>
      ))}
    </ul>
  );
}

export default SeparateCardsFullWidthOnMobile;