type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarShape = 'circular' | 'rounded';

export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-14 w-14 text-lg',
  '2xl': 'h-16 w-16 text-xl',
};

const shapeClasses: Record<AvatarShape, string> = {
  circular: 'rounded-full',
  rounded: 'rounded-lg',
};

export function Avatar({
  src,
  alt = '',
  initials,
  size = 'md',
  shape = 'circular',
  className = '',
}: AvatarProps) {
  const baseClasses = `inline-flex items-center justify-center flex-shrink-0 bg-gray-100 ${sizeClasses[size]} ${shapeClasses[shape]} ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} ${shapeClasses[shape]} object-cover ${className}`}
      />
    );
  }

  if (initials) {
    return (
      <span className={`${baseClasses} font-medium text-gray-600`}>
        {initials.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  // Placeholder silhouette
  return (
    <span className={baseClasses}>
      <svg
        className="h-3/5 w-3/5 text-gray-400"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </span>
  );
}

export interface AvatarGroupProps {
  avatars: AvatarProps[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({ avatars, max = 4, size = 'md', className = '' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className={`flex -space-x-2 overflow-hidden ${className}`}>
      {visible.map((avatar, i) => (
        <Avatar
          key={i}
          {...avatar}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {overflow > 0 && (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-gray-200 ring-2 ring-white font-medium text-gray-600 ${sizeClasses[size]} text-xs`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

export default Avatar;
