// @ts-nocheck
import React from 'react';

export interface InputWithLabelAndHelpTextProps {
  className?: string;
}

export function InputWithLabelAndHelpText({ className }: InputWithLabelAndHelpTextProps) {
  return (
    <div>
      <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
        Email
      </label>
      <div className="mt-2">
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          aria-describedby="email-description"
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      </div>
      <p id="email-description" className="mt-2 text-sm text-gray-500">
        We'll only use this for spam.
      </p>
    </div>
  );
}

export default InputWithLabelAndHelpText;