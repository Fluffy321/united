/** @type {import('tailwindcss').Config} */
module.exports = {
  safelist: [
    // gradient combos (dynamic)
    'from-sky-500','from-emerald-500','from-cyan-500','from-indigo-500',
    'from-amber-400','from-pink-500','from-purple-500','from-lime-500',
    'from-red-400','from-blue-500','from-orange-500','from-teal-500',
    'to-blue-600','to-green-600','to-teal-500','to-violet-600',
    'to-orange-500','to-rose-500','to-fuchsia-500','to-green-500',
    'to-indigo-500','to-amber-500',
    'bg-gradient-to-br',
    'border-l-blue-500','border-l-blue-600','border-l-orange-500','border-l-green-600',
    'border-l-slate-400','border-l-purple-500','border-l-cyan-500','border-l-amber-500',
    'border-l-pink-500','border-l-violet-500',
  ],
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',
        /* JUnited semantic tokens */
        navy:   { DEFAULT: '#0F1C2E', 80: 'rgba(15,28,46,0.80)' },
        /* Shabbat Gold — highlights, special moments */
        gold:   { DEFAULT: '#D4AF37', light: '#FAF4D9', mid: '#E8D07A', dark: '#A08520' },
        'shabbat-gold': '#D4AF37',
        /* Olive Green — Chesed / Mitzvah success states */
        olive:  { DEFAULT: '#556B2F', light: '#EEF3E5', medium: '#7A9A48', dark: '#3D4F22' },
        /* Off-white/Cream page background */
        cream:  '#FDFCF8',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        shimmer: {
          '0%':   { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
        tabFade: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        reactionPop: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.45)' },
          '70%':  { transform: 'scale(0.88)' },
          '100%': { transform: 'scale(1)' },
        },
        /* Bottom-nav pill springs in when a tab becomes active */
        navPillIn: {
          from: { opacity: '0', transform: 'scale(0.72)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        /* Icon bounces up slightly when its tab becomes active */
        navIconPop: {
          from: { transform: 'scale(0.78) translateY(3px)' },
          to:   { transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        shimmer:          'shimmer 1.6s infinite linear',
        'tab-fade':       'tabFade 150ms ease-out both',
        'reaction-pop':   'reactionPop 300ms cubic-bezier(0.34,1.56,0.64,1) both',
        'nav-pill-in':    'navPillIn 300ms cubic-bezier(0.34,1.56,0.64,1) both',
        'nav-icon-pop':   'navIconPop 300ms cubic-bezier(0.34,1.56,0.64,1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
