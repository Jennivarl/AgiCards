import { useTheme } from "../ThemeProvider";

const logoImg = "/AGI-LOGO.jpg";

export function Logo({ size = 32 }: { size?: number }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  // The logo is dark ink on white; `multiply` blends its white away on light
  // surfaces. On dark surfaces that hides it, so we sit it on a small light
  // chip (and keep multiply) — the monogram stays crisp and visible.
  return (
    <span
      style={{
        display: "inline-flex",
        borderRadius: 8,
        background: dark ? "#F4EEE3" : "transparent",
        padding: dark ? 2 : 0,
      }}
    >
      <img
        src={logoImg}
        alt="AgiCards"
        style={{ width: size, height: size, borderRadius: 6, objectFit: "cover", mixBlendMode: "multiply" }}
      />
    </span>
  );
}
