/**
 * Color palette for InCloser app
 * Extracted from design system for consistency
 */

export const colors = {
  // Brand colors
  primary: "#FF4FA3",
  primaryDark: "#E03D8F",
  
  // Text colors
  text: {
    primary: "#1A1A1A",
    secondary: "#666666",
    tertiary: "#999999",
    white: "#FFFFFF",
  },
  
  // Background colors
  background: {
    white: "#FFFFFF",
    light: "#F8F8F8",
    card: "#FFFFFF",
  },
  
  // Input colors
  input: {
    border: "#E0E0E0",
    borderFocused: "#FF4FA3",
    background: "#FFFFFF",
    placeholder: "#999999",
  },
  
  // Link colors
  link: {
    primary: "#FF4FA3",
    underline: "#FF4FA3",
  },
  
  // Gradient colors (Welcome screen)
  gradient: {
    welcome: {
      start: "#FFE5F1", // Soft pink
      end: "#E8F4FF",   // Soft blue
    },
  },
  
  // Button colors
  button: {
    primary: "#FF4FA3",
    primaryShadow: "#FF4FA3",
  },
} as const;

export type Colors = typeof colors;
