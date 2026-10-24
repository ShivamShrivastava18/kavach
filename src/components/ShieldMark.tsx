export function ShieldMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.3 7.5 10 4.4-1.7 7.5-5.4 7.5-10v-6L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.75 12.2 11 14.4l4.5-4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
