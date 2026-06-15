const logoImg = "/AGI-LOGO.jpg";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={logoImg}
      alt="AgiCards"
      style={{ width: size, height: size, borderRadius: 8, objectFit: "cover", mixBlendMode: "multiply" }}
    />
  );
}
