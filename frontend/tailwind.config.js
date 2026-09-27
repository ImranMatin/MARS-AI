/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        // Agent-specific colors
                        researcher: {
                                DEFAULT: '#0ea5e9',
                                light: '#38bdf8',
                                dark: '#0284c7'
                        },
                        'fact-checker': {
                                DEFAULT: '#f97316',
                                light: '#fb923c',
                                dark: '#ea580c'
                        },
                        writer: {
                                DEFAULT: '#10b981',
                                light: '#34d399',
                                dark: '#059669'
                        },
                        // Status colors
                        'status-active': '#22c55e',
                        'status-idle': '#71717a',
                        'status-error': '#ef4444',
                        'status-warning': '#eab308'
                },
                fontFamily: {
                        sans: ['IBM Plex Sans', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace']
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to: { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to: { height: '0' }
                        },
                        'pulse-glow': {
                                '0%, 100%': { opacity: '1' },
                                '50%': { opacity: '0.5' }
                        },
                        'blink': {
                                '0%, 100%': { opacity: '1' },
                                '50%': { opacity: '0' }
                        },
                        'trace': {
                                '0%': { backgroundPosition: '200% 0' },
                                '100%': { backgroundPosition: '-200% 0' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                        'blink': 'blink 1s step-end infinite',
                        'trace': 'trace 3s linear infinite'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
