// @ts-nocheck
import React from 'react';

export interface NotificationmethodItem {
  id: number;
  title: string;
}

export interface SimpleInlineListProps {
  notificationMethods?: NotificationmethodItem[];
  className?: string;
}

export function SimpleInlineList({
  notificationMethods = [],
  className,
}: SimpleInlineListProps) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold leading-6 text-gray-900">Notifications</legend>
      <p className="mt-1 text-sm leading-6 text-gray-600">How do you prefer to receive notifications?</p>
      <div className="mt-6 space-y-6 sm:flex sm:items-center sm:space-x-10 sm:space-y-0">
        {notificationMethods.map((notificationMethod) => (
          <div key={notificationMethod.id} className="flex items-center">
            <input
              defaultChecked={notificationMethod.id === 'email'}
              id={notificationMethod.id}
              name="notification-method"
              type="radio"
              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label htmlFor={notificationMethod.id} className="ml-3 block text-sm font-medium leading-6 text-gray-900">
              {notificationMethod.title}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export default SimpleInlineList;