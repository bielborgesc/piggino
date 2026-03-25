const DEFAULT_CATEGORY_COLOR = '#6b7280';

interface CategoryBadgeProps {
  name?: string | null;
  color?: string;
  faded?: boolean;
}

export function CategoryBadge({ name, color, faded }: CategoryBadgeProps) {
  if (!name) return <span>-</span>;

  return (
    <span className={`inline-flex items-center gap-1.5 ${faded ? 'opacity-50' : ''}`}>
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color ?? DEFAULT_CATEGORY_COLOR }}
      />
      {name}
    </span>
  );
}
