// @ts-nocheck
import React from 'react';

export interface ListItem {
  id: number;
}

export interface SeparateCardListProps {
  items?: ListItem[];
  className?: string;
}

export function SeparateCardList({
  items = [],
  className,
}: SeparateCardListProps) {
  return (
    <ul role="list" className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="overflow-hidden rounded-md bg-white px-6 py-4 shadow">
          {/* Your content */}
        </li>
      ))}
    </ul>
  );
}

export default SeparateCardList;