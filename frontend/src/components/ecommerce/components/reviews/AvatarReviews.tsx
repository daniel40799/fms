// @ts-nocheck
import React from 'react';
import { StarIcon } from '@heroicons/react/20/solid'

export interface ReviewItem {
  id: number;
  title: string;
  rating: number;
  content: string;
  author: string;
  avatarSrc: string;
}

export interface AvatarReviewsProps {
  reviews?: ReviewItem[];
  className?: string;
}

export function AvatarReviews({
  reviews = [],
  className,
}: AvatarReviewsProps) {
  function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <div className="bg-white">
      <div>
        <h2 id="reviews-heading" className="sr-only">
          Reviews
        </h2>

        <div className="space-y-10">
          {reviews.map((review) => (
            <div key={review.id} className="flex flex-col sm:flex-row">
              <div className="order-2 mt-6 sm:ml-16 sm:mt-0">
                <h3 className="text-sm font-medium text-gray-900">{review.title}</h3>
                <p className="sr-only">{review.rating} out of 5 stars</p>

                <div
                  dangerouslySetInnerHTML={{ __html: review.content }}
                  className="mt-3 space-y-6 text-sm text-gray-600"
                />
              </div>

              <div className="order-1 flex items-center sm:flex-col sm:items-start">
                <img alt={`${review.author}.`} src={review.avatarSrc} className="h-12 w-12 rounded-full" />

                <div className="ml-4 sm:ml-0 sm:mt-4">
                  <p className="text-sm font-medium text-gray-900">{review.author}</p>
                  <div className="mt-2 flex items-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <StarIcon
                        key={rating}
                        aria-hidden="true"
                        className={classNames(
                          review.rating > rating ? 'text-gray-900' : 'text-gray-200',
                          'h-5 w-5 flex-shrink-0',
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AvatarReviews;