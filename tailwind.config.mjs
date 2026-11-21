/**
 * Kinematics design tokens.
 * Loaded by Tailwind v4 through `@config` in src/styles/global.css.
 * Colour rules (see DECISIONS.md):
 *  - teal (#12B5A6) is decorative / large graphics only. Teal TEXT uses `teal-ink` (#12806F).
 *  - orange is reserved for CTAs and alerts, always with navy text on top.
 * @type {import('tailwindcss').Config}
 */
export default {
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0E1B2C', 800: '#16263B', 700: '#22344C', 600: '#33465F' },
        teal: { DEFAULT: '#12B5A6', ink: '#12806F', deep: '#107868', soft: '#DDF4F1', 50: '#EEF9F8' },
        orange: { DEFAULT: '#FF6A3D', soft: '#FFE6DD', ink: '#0E1B2C' },
        cloud: '#F4F6F8',
        slate: { DEFAULT: '#5A6675', line: '#D9DEE4' },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', '"Space Grotesk Fallback"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Inter Fallback"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { brand: '-1px' },
      borderRadius: { card: '1.25rem' },
      maxWidth: { prose: '68ch', site: '76rem' },
      boxShadow: { card: '0 1px 2px rgba(14,27,44,.06), 0 8px 24px -12px rgba(14,27,44,.18)' },
    },
  },
};
