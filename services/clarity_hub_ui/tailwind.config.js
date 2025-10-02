/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        'primary-gold': 'hsl(var(--primary-gold))',
        'accent-gold': 'hsl(var(--accent-gold))',
        card: 'hsl(var(--card))',
        input: 'hsl(var(--input))',
        border: 'hsl(var(--border))',
        danger: 'hsl(var(--danger))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, hsl(45 100% 60%) 0%, hsl(45 100% 50%) 100%)',
        'gold-gradient': 'linear-gradient(135deg, hsl(45 100% 65%) 0%, hsl(45 100% 55%) 100%)',
      },
      boxShadow: {
        'primary': '0 10px 30px -10px hsl(45 100% 35% / 0.25)',
        'surface': '0 4px 16px -4px hsl(0 0% 0% / 0.3)',
      },
    },
  },
  plugins: [],
};
