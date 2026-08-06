import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#14120F", // near-black, warm-tinted — the "darkroom"
          card: "#211D17",
          border: "#3A3226",
        },
        paper: {
          DEFAULT: "#F2EDE4", // warm white text
          muted: "#A69C8A",
        },
        safelight: {
          DEFAULT: "#E8871E", // darkroom safelight amber — the accent
          dim: "#B96A17",
        },
        develop: "#6EA85C", // muted success green (like a fixed print)
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 1px 1px, rgba(242,237,228,0.035) 1px, transparent 0)",
      },
      backgroundSize: {
        "grain": "18px 18px",
      },
    },
  },
  plugins: [],
};
export default config;
