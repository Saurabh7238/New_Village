const DOT_COUNT = 8;

export default function DottedSpinner({ size = "md", label = "Loading" }) {
  const isSmall = size === "sm";
  const sizeClass = isSmall ? "h-5 w-5" : "h-10 w-10";
  const dotSizeClass = isSmall ? "h-1 w-1" : "h-1.5 w-1.5";
  const radius = isSmall ? 7 : 15;

  return (
    <span
      className={`relative inline-block ${sizeClass} shrink-0 animate-spin text-teal-700 dark:text-teal-400`}
      role="status"
      aria-label={label}
    >
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`absolute left-1/2 top-1/2 ${dotSizeClass} rounded-full bg-current`}
          style={{
            transform: `translate(-50%, -50%) rotate(${index * 45}deg) translateY(-${radius}px)`,
            opacity: 1 - index * 0.09,
          }}
        />
      ))}
    </span>
  );
}
