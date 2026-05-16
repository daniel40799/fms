// @ts-nocheck
import React from 'react';

export interface CategoryItem {
  name: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  description: string;
}

export interface ThreeColumnCategoryPreviewWithDescriptionProps {
  categories?: CategoryItem[];
  className?: string;
}

export function ThreeColumnCategoryPreviewWithDescription({
  categories = [],
  className,
}: ThreeColumnCategoryPreviewWithDescriptionProps) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Shop by Collection</h2>
        <p className="mt-4 text-base text-gray-500">
          Each season, we collaborate with world-class designers to create a collection inspired by the natural world.
        </p>

        <div className="mt-10 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:space-y-0">
          {categories.map((category) => (
            <a key={category.name} href={category.href} className="group block">
              <div
                aria-hidden="true"
                className="aspect-h-2 aspect-w-3 overflow-hidden rounded-lg lg:aspect-h-6 lg:aspect-w-5 group-hover:opacity-75"
              >
                <img
                  alt={category.imageAlt}
                  src={category.imageSrc}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900">{category.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{category.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ThreeColumnCategoryPreviewWithDescription;