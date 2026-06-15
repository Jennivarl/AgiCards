import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgiCards",
  description: "Permission cards for AI agents. Give your agent controlled on-chain powers, within limits the blockchain enforces."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
