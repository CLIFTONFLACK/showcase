export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Vance Medical Foods"
      className={`h-14 w-auto md:h-[72px] ${className}`}
    />
  );
}
