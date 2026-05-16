// @ts-nocheck
import React from 'react';

export interface ListItem {
  id: number;
}

export interface CardWithDividersFullWidthOnMobileProps {
  items?: ListItem[];
  className?: string;
}

export function CardWithDividersFullWidthOnMobile({
  items = [],
  className,
}: CardWithDividersFullWidthOnMobileProps) {
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.id} className="px-4 py-4 sm:px-6">
            {/* Your content */}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CardWithDividersFullWidthOnMobile;