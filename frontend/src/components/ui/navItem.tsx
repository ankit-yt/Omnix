import Link from "next/link";

// Minimal NavItem Component utilizing Next.js Link
export function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[13.5px] font-medium transition-all ${
        active 
          ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-white/10" 
          : "text-white/40 hover:bg-white/5 hover:text-white/80"
      }`}
    >
      <div className={`${active ? "text-white" : "text-white/40 group-hover:text-white/70"} transition-colors`}>
        {icon}
      </div>
      {label}
    </Link>
  );
}