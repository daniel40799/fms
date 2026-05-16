// @ts-nocheck
import React from 'react';
import { StarIcon } from '@heroicons/react/20/solid'

export interface ReviewItem {
  id: number;
  rating: number;
  content: string;
  date: string;
  datetime: string;
  author: string;
  avatarSrc: string;
}

export interface ReviewsWithAvatarsProps {
  reviews?: ReviewItem[];
  className?: string;
}

export function ReviewsWithAvatars({
  reviews = [],
  className,
}: ReviewsWithAvatarsProps) {
  function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <div className="bg-white">
      <div>
        <h2 className="sr-only">Customer Reviews</h2>

        <div className="-my-10">
          {reviews.map((review, reviewIdx) => (
            <div key={review.id} className="flex space-x-4 text-sm text-gray-500">
              <div className="flex-none py-10">
                <img alt="" src={review.avatarSrc} className="h-10 w-10 rounded-full bg-gray-100" />
              </div>
              <div className={classNames(reviewIdx === 0 ? '' : 'border-t border-gray-200', 'flex-1 py-10')}>
                <h3 className="font-medium text-gray-900">{review.author}</h3>
                <p>
                  <time dateTime={review.datetime}>{review.date}</time>
                </p>

                <div className="mt-4 flex items-center">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <StarIcon
                      key={rating}
                      aria-hidden="true"
                      className={classNames(
                        review.rating > rating ? 'text-yellow-400' : 'text-gray-300',
                        'h-5 w-5 flex-shrink-0',
                      )}
                    />
                  ))}
                </div>
                <p className="sr-only">{review.rating} out of 5 stars</p>

                <div
                  dangerouslySetInnerHTML={{ __html: review.content }}
                  className="prose prose-sm mt-4 max-w-none text-gray-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReviewsWithAvatars;