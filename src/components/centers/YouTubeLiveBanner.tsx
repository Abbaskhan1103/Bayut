"use client";

interface Props {
  videoId: string;
  title: string | null;
}

export function YouTubeLiveBanner({ videoId, title }: Props) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 transition-all active:scale-[0.98]"
    >
      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-none" />
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Live Now</p>
        {title && (
          <p className="text-sm text-[var(--text)] truncate">{title}</p>
        )}
      </div>
      <svg className="w-4 h-4 text-red-400 flex-none" viewBox="0 0 20 20" fill="none">
        <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
