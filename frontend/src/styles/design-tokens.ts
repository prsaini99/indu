
// Design tokens for the tutor website
// Based on 8-point grid system and consistent typography

export const tokens = {
  // Color Palette
  colors: {
    primary: '#1F4E79', // deep blue
    secondary: '#F29F05', // warm amber
    neutralWhite: '#FFFFFF',
    neutralLight: '#F5F7FA',
    neutralDark: '#333333',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#E74C3C',
    info: '#3498DB',
  },
  
  // Typography
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,      // 20px for 16px font
      normal: 1.5,      // 24px for 16px font
      relaxed: 1.75,    // 28px for 16px font
      loose: 2,         // 32px for 16px font
    },
  },
  
  // Spacing (8px grid system)
  spacing: {
    0: '0',
    1: '0.25rem',      // 4px
    2: '0.5rem',       // 8px
    3: '0.75rem',      // 12px
    4: '1rem',         // 16px
    5: '1.25rem',      // 20px
    6: '1.5rem',       // 24px
    8: '2rem',         // 32px
    10: '2.5rem',      // 40px
    12: '3rem',        // 48px
    16: '4rem',        // 64px
    20: '5rem',        // 80px
    24: '6rem',        // 96px
  },
  
  // Borders & Rounding
  borders: {
    radius: {
      xs: '0.125rem',  // 2px
      sm: '0.25rem',   // 4px
      md: '0.375rem',  // 6px
      lg: '0.5rem',    // 8px
      xl: '0.75rem',   // 12px
      '2xl': '1rem',   // 16px
      full: '9999px',  // Circular
    },
    width: {
      thin: '1px',
      normal: '2px',
      thick: '4px',
    },
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 8px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  
  // Breakpoints
  breakpoints: {
    xs: '480px',      // Extra small devices
    sm: '640px',      // Small devices
    md: '768px',      // Medium devices
    lg: '1024px',     // Large devices
    xl: '1280px',     // Extra large devices
    '2xl': '1536px',  // 2X Extra large devices
  },
  
  // Z-index
  zIndex: {
    hide: -1,
    base: 0,
    raised: 1,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    popover: 1400,
    toast: 1500,
    tooltip: 1600,
  },
};

// Utility functions for accessing tokens
export const getColor = (colorName: keyof typeof tokens.colors) => tokens.colors[colorName];
export const getSpacing = (spacingName: keyof typeof tokens.spacing) => tokens.spacing[spacingName];
export const getFontSize = (sizeName: keyof typeof tokens.typography.fontSizes) => tokens.typography.fontSizes[sizeName];
export const getBorderRadius = (radiusName: keyof typeof tokens.borders.radius) => tokens.borders.radius[radiusName];

export default tokens;
