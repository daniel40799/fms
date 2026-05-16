// @ts-nocheck
import React from 'react';

export interface CommentItem {
  id: number;
  name: string;
  imageUrl: string;
  content: string;
  date: string;
  dateTime: string;
}

export interface NarrowWithTruncatedContentProps {
  comments?: CommentItem[];
  className?: string;
}

export function NarrowWithTruncatedContent({
  comments = [],
  className,
}: NarrowWithTruncatedContentProps) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-x-4 py-5">
          <img alt="" src={comment.imageUrl} className="h-12 w-12 flex-none rounded-full bg-gray-50" />
          <div className="flex-auto">
            <div className="flex items-baseline justify-between gap-x-4">
              <p className="text-sm font-semibold leading-6 text-gray-900">{comment.name}</p>
              <p className="flex-none text-xs text-gray-600">
                <time dateTime={comment.dateTime}>{comment.date}</time>
              </p>
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">{comment.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default NarrowWithTruncatedContent;