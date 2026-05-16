'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}: ModalProps) {
  void className;
  return (
    <Dialog open={open} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-[160ms] data-[leave]:duration-[120ms] data-[enter]:ease-out data-[leave]:ease-in motion-reduce:transition-none"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-2 data-[closed]:opacity-0 data-[enter]:duration-[160ms] data-[leave]:duration-[120ms] data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full ${sizeClasses[size]} data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-[0.98] motion-reduce:transition-none ${className}`}
          >
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-start justify-between">
                {title && (
                  <DialogTitle
                    as="h3"
                    className="text-base font-semibold leading-6 text-gray-900"
                  >
                    {title}
                  </DialogTitle>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-gray-400 transition-all duration-150 ease-out hover:bg-gray-100 hover:text-gray-700 active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                </button>
              </div>
              {description && (
                <p className="mt-2 text-sm text-gray-500">{description}</p>
              )}
              {children && <div className="mt-4">{children}</div>}
            </div>
            {footer && (
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                {footer}
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

export default Modal;
