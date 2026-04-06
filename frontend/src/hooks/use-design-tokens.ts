
import { tokens } from "@/styles/design-tokens";

export const useDesignTokens = () => {
  return {
    colors: {
      ...tokens.colors,
      primary: "#1F4E79",
      primaryHover: "#1a4369",
      primaryLight: "#356EA9",
      primaryLighter: "#F5F7FA",
      secondary: "#F29F05",
      secondaryHover: "#E28F00",
      secondaryLight: "#FEF7CD",
      success: "#10B981",
      successLight: "#ECFDF5",
      warning: "#FBBF24",
      warningLight: "#FFFBEB",
      danger: "#EF4444",
      dangerLight: "#FEF2F2",
      info: "#3B82F6",
      infoLight: "#EFF6FF",
      muted: "#64748B",
      mutedLight: "#F1F5F9",
      border: "rgba(31, 78, 121, 0.1)",
      borderHover: "rgba(31, 78, 121, 0.2)",
      cardBg: "#FFFFFF",
      backgroundColor: "#F9FAFB",
      textPrimary: "#1F2937",
      textSecondary: "#4B5563",
      textMuted: "#9CA3AF"
    },
    typography: tokens.typography,
    spacing: tokens.spacing,
    borders: tokens.borders,
    shadows: {
      ...tokens.shadows,
      cardShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05)",
      cardShadowHover: "0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)"
    },
    transitions: tokens.transitions,
    breakpoints: tokens.breakpoints,
    zIndex: tokens.zIndex,
    
    // Helper functions for common units
    grid: {
      fullWidth: "col-span-12",
      twoThirds: "col-span-12 md:col-span-8",
      half: "col-span-12 md:col-span-6",
      oneThird: "col-span-12 md:col-span-4",
      oneQuarter: "col-span-12 sm:col-span-6 md:col-span-3"
    },
    
    // Card variations
    cardStyles: {
      default: "border border-[#1F4E79]/10 bg-white shadow-sm hover:shadow-md transition-all duration-300",
      compact: "border border-[#1F4E79]/10 bg-white shadow-sm p-4",
      elevated: "border border-[#1F4E79]/10 bg-white shadow-md hover:shadow-lg transition-all duration-300",
      interactive: "border border-[#1F4E79]/10 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]"
    },
    
    // Button variations
    buttonStyles: {
      primary: "bg-[#1F4E79] hover:bg-[#1a4369] text-white transition-all hover:scale-[0.98] active:scale-[0.97]",
      secondary: "bg-[#F29F05] hover:bg-[#E28F00] text-white transition-all hover:scale-[0.98] active:scale-[0.97]",
      outline: "border-[#1F4E79] text-[#1F4E79] hover:bg-[#F5F7FA] transition-all hover:scale-[0.98] active:scale-[0.97]",
      ghost: "text-[#1F4E79] hover:bg-[#F5F7FA] transition-all",
      destructive: "bg-red-600 hover:bg-red-700 text-white transition-all hover:scale-[0.98] active:scale-[0.97]"
    },
    
    // Helper functions
    getColor: (colorName: keyof typeof tokens.colors) => tokens.colors[colorName],
    getSpacing: (spacingName: keyof typeof tokens.spacing) => tokens.spacing[spacingName],
    getFontSize: (sizeName: keyof typeof tokens.typography.fontSizes) => tokens.typography.fontSizes[sizeName],
    getBorderRadius: (radiusName: keyof typeof tokens.borders.radius) => tokens.borders.radius[radiusName],
  };
};

export default useDesignTokens;
