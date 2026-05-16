// @ts-nocheck
import React from 'react';

export interface DirectoryItem {
  id: number;
  name: string;
  email: string;
  imageUrl: string;
}

export interface NarrowWithStickyHeadingsProps {
  directory?: DirectoryItem;
  className?: string;
}

export function NarrowWithStickyHeadings({
  directory,
  className,
}: NarrowWithStickyHeadingsProps) {
  return (
    <nav aria-label="Directory" className="h-full overflow-y-auto">
      {Object.keys(directory).map((letter) => (
        <div key={letter} className="relative">
          <div className="sticky top-0 z-10 border-y border-b-gray-200 border-t-gray-100 bg-gray-50 px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900">
            <h3>{letter}</h3>
          </div>
          <ul role="list" className="divide-y divide-gray-100">
            {directory[letter].map((person) => (
              <li key={person.email} className="flex gap-x-4 px-3 py-5">
                <img alt="" src={person.imageUrl} className="h-12 w-12 flex-none rounded-full bg-gray-50" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-6 text-gray-900">{person.name}</p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-500">{person.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default NarrowWithStickyHeadings;