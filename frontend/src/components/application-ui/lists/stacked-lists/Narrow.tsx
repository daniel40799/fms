// @ts-nocheck
import React from 'react';

export interface PersonItem {
  name: string;
  email: string;
  imageUrl: string;
}

export interface NarrowProps {
  people?: PersonItem[];
  className?: string;
}

export function Narrow({
  people = [],
  className,
}: NarrowProps) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {people.map((person) => (
        <li key={person.email} className="flex gap-x-4 py-5">
          <img alt="" src={person.imageUrl} className="h-12 w-12 flex-none rounded-full bg-gray-50" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-6 text-gray-900">{person.name}</p>
            <p className="mt-1 truncate text-xs leading-5 text-gray-500">{person.email}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default Narrow;