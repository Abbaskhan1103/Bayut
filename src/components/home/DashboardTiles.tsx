import Link from "next/link";

interface Tile {
  href: string;
  emoji: string;
  label: string;
}

const tiles: Tile[] = [
  { href: "/centers", emoji: "🕌", label: "Islamic Centers" },
  { href: "/home/calendar", emoji: "📅", label: "Hijri Calendar" },
  { href: "/ibadah/tasbih", emoji: "📿", label: "Tasbih" },
  { href: "/ibadah/qadha", emoji: "🙏", label: "Qadha" },
  { href: "/ibadah/khums", emoji: "💰", label: "Khums" },
  { href: "/home/qibla", emoji: "🧭", label: "Qibla" },
];

export function DashboardTiles() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 min-h-[80px] active:scale-95 transition-all duration-150 hover:border-[#C9A84C]/30 hover:bg-[#C9A84C]/5"
        >
          <span className="text-3xl">{tile.emoji}</span>
          <span className="text-sm font-semibold text-[var(--text)] text-center">{tile.label}</span>
        </Link>
      ))}
    </div>
  );
}
