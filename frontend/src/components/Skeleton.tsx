// Skeleton: a calm grey placeholder block shown while data is loading.
// Pass Tailwind size classes, e.g. <Skeleton className="h-4 w-32" />,
// and circle for round placeholders (avatars, icons).
// It gently pulses only for people who have not asked for reduced motion
// (`motion-safe:`). Hidden from screen readers: the section using it should
// say "Loading ..." once in words instead.
type SkeletonProps = {
  className: string;
  circle?: boolean;
};

export default function Skeleton({ className, circle = false }: SkeletonProps) {
  // The corner style is chosen here (not passed in className) so two
  // rounded-* classes never fight each other.
  const shape = circle ? "rounded-full" : "rounded-lg";

  return (
    <div
      className={`bg-hover motion-safe:animate-pulse ${shape} ${className}`}
      aria-hidden="true"
    />
  );
}
