"use client";

export function GlobalBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 bg-white"
      style={{
        background:
          "radial-gradient(circle at top, rgba(0,0,0,0.03), transparent 35%), linear-gradient(180deg, #ffffff 0%, #ffffff 100%)",
      }}
    />
  );
}
