// @ts-nocheck
import React from 'react';

export interface ListItem {
  id: number;
}

export interface FlatCardWithDividersProps {
  items?: ListItem[];
  className?: string;
}

export function FlatCardWithDividers({
  items = [],
  className,
}: FlatCardWithDividersProps) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-300 bg-white">
      <ul role="list" className="divide-y divide-gray-300">
        {items.map((item) => (
          <li key={item.id} className="px-6 py-4">
            {/* Your content */}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FlatCardWithDividers;