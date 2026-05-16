// @ts-nocheck
import React from 'react';

export interface InputWithGrayBackgroundAndBottomBorderProps {
  className?: string;
}

export function InputWithGrayBackgroundAndBottomBorder({ className }: InputWithGrayBackgroundAndBottomBorderProps) {
  return (
    <div>
      <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
        Name
      </label>
      <div className="relative mt-2">
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Jane Smith"
          className="peer block w-full border-0 bg-gray-50 py-1.5 text-gray-900 focus:ring-0 sm:text-sm sm:leading-6"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 border-t border-gray-300 peer-focus:border-t-2 peer-focus:border-indigo-600"
        />
      </div>
    </div>
  );
}

export default InputWithGrayBackgroundAndBottomBorder;