import type { Config } from 'tailwindcss'

const createColorScale = (name: string) => ({
  DEFAULT: `hsl(var(--${name}) / <alpha-value>)`,
  foreground: `hsl(var(--${name}-foreground) / <alpha-value>)`,
  border: `var(--${name}-border)`,
})

const createHslColor = (name: string) => `hsl(var(--${name}) / <alpha-value>)`

export default {
  darkMode: ['class'],
  content: ['./client/index.html', './client/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: '.5625rem' /* 9px */,
        md: '.375rem' /* 6px */,
        sm: '.1875rem' /* 3px */,
      },
      colors: {
        // Flat / base colors (regular buttons)
        background: createHslColor('background'),
        foreground: createHslColor('foreground'),
        border: createHslColor('border'),
        input: createHslColor('input'),
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
          border: 'hsl(var(--card-border) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
          border: 'hsl(var(--popover-border) / <alpha-value>)',
        },
        primary: createColorScale('primary'),
        secondary: createColorScale('secondary'),
        muted: createColorScale('muted'),
        accent: createColorScale('accent'),
        destructive: createColorScale('destructive'),
        ring: createHslColor('ring'),
        chart: {
          '1': 'hsl(var(--chart-1) / <alpha-value>)',
          '2': 'hsl(var(--chart-2) / <alpha-value>)',
          '3': 'hsl(var(--chart-3) / <alpha-value>)',
          '4': 'hsl(var(--chart-4) / <alpha-value>)',
          '5': 'hsl(var(--chart-5) / <alpha-value>)',
        },
        sidebar: {
          ring: 'hsl(var(--sidebar-ring) / <alpha-value>)',
          DEFAULT: 'hsl(var(--sidebar) / <alpha-value>)',
          foreground: 'hsl(var(--sidebar-foreground) / <alpha-value>)',
          border: 'hsl(var(--sidebar-border) / <alpha-value>)',
        },
        'sidebar-primary': {
          DEFAULT: 'hsl(var(--sidebar-primary) / <alpha-value>)',
          foreground: 'hsl(var(--sidebar-primary-foreground) / <alpha-value>)',
          border: 'var(--sidebar-primary-border)',
        },
        'sidebar-accent': {
          DEFAULT: 'hsl(var(--sidebar-accent) / <alpha-value>)',
          foreground: 'hsl(var(--sidebar-accent-foreground) / <alpha-value>)',
          border: 'var(--sidebar-accent-border)',
        },
        status: {
          online: 'rgb(34 197 94)',
          away: 'rgb(245 158 11)',
          busy: 'rgb(239 68 68)',
          offline: 'rgb(156 163 175)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config
