import Link from "next/link";

const tools = [
  {
    href: "/ibadah/tasbih",
    emoji: "📿",
    label: "Tasbih",
    description: "Dhikr counter with milestone beeps",
  },
  {
    href: "/ibadah/qadha",
    emoji: "🙏",
    label: "Qadha Tracker",
    description: "Track your missed prayers",
  },
  {
    href: "/ibadah/khums",
    emoji: "💰",
    label: "Khums Calculator",
    description: "Calculate your annual Khums",
  },
];

export default function IbadahPage() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <h1 className="font-lora text-2xl font-semibold text-[var(--text)]">Ibadah</h1>
        <p className="text-sm text-[var(--subtext)] mt-1">Tools for your spiritual practice</p>
      </div>
      <div className="flex flex-col gap-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 active:scale-[0.98] transition-all hover:border-[#C9A84C]/30"
          >
            <span className="text-4xl">{tool.emoji}</span>
            <div>
              <p className="font-semibold text-[var(--text)]">{tool.label}</p>
              <p className="text-sm text-[var(--subtext)]">{tool.description}</p>
            </div>
            <svg className="ml-auto text-[var(--subtext)]" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
