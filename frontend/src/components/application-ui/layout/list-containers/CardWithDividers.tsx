// @ts-nocheck
import React from 'react';

export interface ListItem {
  id: number;
}

export interface CardWithDividersProps {
  items?: ListItem[];
  className?: string;
}

export function CardWithDividers({
  items = [],
  className,
}: CardWithDividersProps) {
  return (
    <div className="overflow-hidden rounded-md bg-white shadow">
      <ul role="list" className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.id} className="px-6 py-4">
            {/* Your content */}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CardWithDividers;