import { Link, useLocation } from 'wouter';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const items: NavItem[] = [
  { href: '/',       label: 'Count',  icon: '+' },
  { href: '/list',   label: 'List',   icon: '☰' },
  { href: '/export', label: 'Export', icon: '↓' },
];

export function BottomNav() {
  const [location] = useLocation();
  return (
    <div className="pb-safe bg-ink-900 border-t border-ink-800">
      <nav className="flex justify-around">
        {items.map((it) => {
          const active = location === it.href;
          return (
            <Link key={it.href} href={it.href}>
              <a
                className={`flex flex-col items-center justify-center flex-1 py-2 touch-manip ${
                  active ? 'text-accent-orange' : 'text-ink-300'
                }`}
              >
                <span className="text-2xl leading-none">{it.icon}</span>
                <span className="text-[10px] mt-1 uppercase tracking-wide">{it.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
