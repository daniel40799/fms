// @ts-nocheck

export interface ConstrainedWithPaddedContentProps {
  className?: string;
}

export function ConstrainedWithPaddedContent({ className }: ConstrainedWithPaddedContentProps) {
  void className;
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Container — place your content here */}
    </div>
  );
}

export default ConstrainedWithPaddedContent;