// Make Tailwind plugin opt-in via env var `SKIP_TAILWIND=1`.
// This avoids hard crashes/hangs in environments where Tailwind's
// file scanning causes PostCSS timeouts. To skip Tailwind at runtime:
//   SKIP_TAILWIND=1 npm run dev

const plugins = {};

if (process.env.SKIP_TAILWIND !== '1') {
  plugins.tailwindcss = {};
}
plugins.autoprefixer = {};

export default { plugins };

