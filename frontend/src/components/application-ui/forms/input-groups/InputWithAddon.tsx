// @ts-nocheck
import React from 'react';

export interface InputWithAddonProps {
  className?: string;
}

export function InputWithAddon({ className }: InputWithAddonProps) {
  return (
    <div>
      <label htmlFor="company-website" className="block text-sm font-medium leading-6 text-gray-900">
        Company Website
      </label>
      <div className="mt-2 flex rounded-md shadow-sm">
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm">
          http://
        </span>
        <input
          id="company-website"
          name="company-website"
          type="text"
          placeholder="www.example.com"
          className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      </div>
    </div>
  );
}

export default InputWithAddon;