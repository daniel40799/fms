// @ts-nocheck
import React from 'react';
import { ChatBubbleLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export interface DiscussionItem {
  id: number;
  title: string;
  href: string;
  author: string;
  name: string;
  date: string;
  dateTime: string;
  status: string;
  totalComments: string;
  commenters: string;
  imageUrl: string;
}

export interface WithInlineLinksAndAvatarGroupProps {
  discussions?: DiscussionItem[];
  className?: string;
}

export function WithInlineLinksAndAvatarGroup({
  discussions = [],
  className,
}: WithInlineLinksAndAvatarGroupProps) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {discussions.map((discussion) => (
        <li
          key={discussion.id}
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-5 sm:flex-nowrap"
        >
          <div>
            <p className="text-sm font-semibold leading-6 text-gray-900">
              <a href={discussion.href} className="hover:underline">
                {discussion.title}
              </a>
            </p>
            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
              <p>
                <a href={discussion.author.href} className="hover:underline">
                  {discussion.author.name}
                </a>
              </p>
              <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                <circle r={1} cx={1} cy={1} />
              </svg>
              <p>
                <time dateTime={discussion.dateTime}>{discussion.date}</time>
              </p>
            </div>
          </div>
          <dl className="flex w-full flex-none justify-between gap-x-8 sm:w-auto">
            <div className="flex -space-x-0.5">
              <dt className="sr-only">Commenters</dt>
              {discussion.commenters.map((commenter) => (
                <dd key={commenter.id}>
                  <img
                    alt={commenter.name}
                    src={commenter.imageUrl}
                    className="h-6 w-6 rounded-full bg-gray-50 ring-2 ring-white"
                  />
                </dd>
              ))}
            </div>
            <div className="flex w-16 gap-x-2.5">
              <dt>
                <span className="sr-only">Total comments</span>
                {discussion.status === 'resolved' ? (
                  <CheckCircleIcon aria-hidden="true" className="h-6 w-6 text-gray-400" />
                ) : (
                  <ChatBubbleLeftIcon aria-hidden="true" className="h-6 w-6 text-gray-400" />
                )}
              </dt>
              <dd className="text-sm leading-6 text-gray-900">{discussion.totalComments}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

export default WithInlineLinksAndAvatarGroup;