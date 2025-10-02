// Voltaxe Platform - Dark Theme with Gold Accents

export const theme = {
  // Primary Colors (HSL format for dark theme)
  colors: {
    background: 'hsl(0, 0%, 8%)',      // Deep black
    foreground: 'hsl(45, 100%, 85%)',   // Light gold text
    primaryGold: 'hsl(45, 100%, 60%)',  // Bright gold
    accentGold: 'hsl(45, 100%, 65%)',   // Glowing gold
    
    // Surface Colors
    card: 'hsl(0, 0%, 12%)',           // Dark charcoal
    input: 'hsl(0, 0%, 15%)',          // Dark input
    border: 'hsl(0, 0%, 20%)',         // Dark border
    muted: 'hsl(0, 0%, 25%)',          // Muted elements
    
    // Status Colors
    danger: 'hsl(0, 84%, 60%)',        // Elegant red
    success: 'hsl(142, 76%, 36%)',     // Rich green
    warning: 'hsl(38, 92%, 50%)',      // Amber/orange
    
    // Risk Level Colors (Adapted for dark theme)
    risk: {
      low: {
        bg: 'hsl(142, 76%, 15%)',      // Dark green background
        text: 'hsl(142, 76%, 70%)',    // Light green text
        border: 'hsl(142, 76%, 36%)',  // Green border
        icon: 'hsl(142, 76%, 50%)',    // Green icon
      },
      medium: {
        bg: 'hsl(38, 92%, 15%)',       // Dark amber background
        text: 'hsl(38, 92%, 70%)',     // Light amber text
        border: 'hsl(38, 92%, 50%)',   // Amber border
        icon: 'hsl(38, 92%, 60%)',     // Amber icon
      },
      high: {
        bg: 'hsl(25, 95%, 15%)',       // Dark orange background
        text: 'hsl(25, 95%, 70%)',     // Light orange text
        border: 'hsl(25, 95%, 53%)',   // Orange border
        icon: 'hsl(25, 95%, 60%)',     // Orange icon
      },
      critical: {
        bg: 'hsl(0, 84%, 15%)',        // Dark red background
        text: 'hsl(0, 84%, 75%)',      // Light red text
        border: 'hsl(0, 84%, 60%)',    // Red border
        icon: 'hsl(0, 84%, 65%)',      // Red icon
      },
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows (Adapted for dark theme with gold glow)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px hsla(45, 100%, 60%, 0.3)',
    glowStrong: '0 0 30px hsla(45, 100%, 60%, 0.5)',
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Z-Index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

// Helper Functions
export const getRiskColor = (risk: string | null): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} => {
  switch (risk?.toUpperCase()) {
    case 'LOW':
      return theme.colors.risk.low;
    case 'MEDIUM':
      return theme.colors.risk.medium;
    case 'HIGH':
      return theme.colors.risk.high;
    case 'CRITICAL':
      return theme.colors.risk.critical;
    default:
      return {
        bg: 'hsl(0, 0%, 20%)',
        text: 'hsl(45, 100%, 70%)',
        border: 'hsl(0, 0%, 30%)',
        icon: 'hsl(45, 100%, 60%)',
      };
  }
};

export const getScoreColor = (score: number): string => {
  if (score >= 90) return theme.colors.success;
  if (score >= 75) return theme.colors.primaryGold;
  if (score >= 50) return theme.colors.warning;
  return theme.colors.danger;
};

export const getScoreGradient = (score: number): string => {
  if (score >= 90) return 'linear-gradient(135deg, hsl(142, 76%, 36%), hsl(142, 76%, 45%))';
  if (score >= 75) return 'linear-gradient(135deg, hsl(45, 100%, 60%), hsl(45, 100%, 65%))';
  if (score >= 50) return 'linear-gradient(135deg, hsl(38, 92%, 50%), hsl(38, 92%, 60%))';
  return 'linear-gradient(135deg, hsl(0, 84%, 60%), hsl(0, 84%, 70%))';
};

export default theme;
