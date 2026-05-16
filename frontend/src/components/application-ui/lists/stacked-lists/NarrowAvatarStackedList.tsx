// @ts-nocheck
import React from 'react';

export interface ActivityitemItem {
  user: string;
  name: string;
  imageUrl: string;
  projectName: string;
  commit: string;
  branch: string;
  date: string;
  dateTime: string;
}

export interface NarrowAvatarStackedListProps {
  activityItems?: ActivityitemItem[];
  className?: string;
}

export function NarrowAvatarStackedList({
  activityItems = [],
  className,
}: NarrowAvatarStackedListProps) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {activityItems.map((item) => (
        <li key={item.commit} className="py-4">
          <div className="flex items-center gap-x-3">
            <img alt="" src={item.user.imageUrl} className="h-6 w-6 flex-none rounded-full bg-gray-800" />
            <h3 className="flex-auto truncate text-sm font-semibold leading-6 text-gray-900">{item.user.name}</h3>
            <time dateTime={item.dateTime} className="flex-none text-xs text-gray-500">
              {item.date}
            </time>
          </div>
          <p className="mt-3 truncate text-sm text-gray-500">
            Pushed to <span className="text-gray-700">{item.projectName}</span> (
            <span className="font-mono text-gray-700">{item.commit}</span> on{' '}
            <span className="text-gray-700">{item.branch}</span>)
          </p>
        </li>
      ))}
    </ul>
  );
}

export default NarrowAvatarStackedList;