// @ts-nocheck

export interface ListItem {
  id: number;
}

export interface SimpleWithDividersProps {
  items?: ListItem[];
  className?: string;
}

export function SimpleWithDividers({
  items = [],
  className,
}: SimpleWithDividersProps) {
  void className;
  void items;
  return (
    <ul role="list" className="divide-y divide-gray-200">
      {items.map((item) => (
        <li key={item.id} className="py-4">
          {/* Your content */}
        </li>
      ))}
    </ul>
  );
}

export default SimpleWithDividers;