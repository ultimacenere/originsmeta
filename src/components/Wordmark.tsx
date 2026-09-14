export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-[1.15rem] font-extrabold leading-none tracking-tight ${className}`}>
      <span className="text-chalk">Origins</span>
      <span className="text-mint">Meta</span>
      <span className="ml-1 inline-block h-2 w-2 -translate-y-1.5 rounded-full bg-crimson align-middle" aria-hidden="true" />
    </span>
  );
}
