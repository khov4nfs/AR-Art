export function AmbientDivider({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      data-reveal
      className={`everie-divider${compact ? " everie-divider-compact" : ""} ${className}`.trim()}
    />
  );
}
