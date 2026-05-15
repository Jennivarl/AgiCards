import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bot,
  CreditCard,
  Database,
  Home,
  LucideIcon,
  Settings,
  Wallet
} from "lucide-react";

type AppFrameProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

const navItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/app/agents", label: "Agents", icon: Bot },
  { href: "/app/wallet", label: "Wallet", icon: Wallet },
  { href: "/app/orders", label: "Orders", icon: CreditCard },
  { href: "/app/proof", label: "0G Proof", icon: Database },
  { href: "/app/settings", label: "Settings", icon: Settings }
];

export function SignatureLogo() {
  return (
    <span className="agBrand agBrandCompact">
      <span className="agLogoMark">
        <img src="/agicards-abstract-logo.png" alt="" />
      </span>
      <span className="agBrandName">AgiCards</span>
    </span>
  );
}

export function AppFrame({ eyebrow, title, subtitle, children }: AppFrameProps) {
  return (
    <main className="agConsoleShell">
      <aside className="agConsoleSidebar">
        <Link href="/" aria-label="AgiCards home">
          <SignatureLogo />
        </Link>
        <nav aria-label="Application navigation">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              <item.icon size={17} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <section className="agConsoleMain">
        <header className="agConsoleHeader">
          <div>
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function StatusPill({ children }: { children: ReactNode }) {
  return <span className="agStatusPill">{children}</span>;
}
