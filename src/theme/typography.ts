/**
 * Typography system for InCloser app
 * Matches Figma design specifications
 */

import { TextStyle } from "react-native";

type TypographyStyle = {
  fontSize: number;
  fontWeight: TextStyle["fontWeight"];
  letterSpacing?: number;
  lineHeight?: number;
};

export const typography = {
  // Display/Heading styles
  display: {
    large: {
      fontFamily: "Poppins_700Bold",
      fontSize: 48,
      fontWeight: "700" as const,
      letterSpacing: -0.5,
      lineHeight: 56,
    },
    medium: {
      fontFamily: "Poppins_700Bold",
      fontSize: 36,
      fontWeight: "700" as const,
      letterSpacing: -0.3,
      lineHeight: 44,
    },
    small: {
      fontFamily: "Poppins_700Bold",
      fontSize: 28,
      fontWeight: "700" as const,
      letterSpacing: -0.2,
      lineHeight: 36,
    },
  },
  
  // Body text styles
  body: {
    large: {
      fontFamily: "Poppins_400Regular",
      fontSize: 18,
      fontWeight: "400" as const,
      letterSpacing: 0,
      lineHeight: 26,
    },
    medium: {
      fontFamily: "Poppins_400Regular",
      fontSize: 16,
      fontWeight: "400" as const,
      letterSpacing: 0,
      lineHeight: 24,
    },
    small: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      fontWeight: "400" as const,
      letterSpacing: 0,
      lineHeight: 20,
    },
  },
  
  // Button text styles
  button: {
    large: {
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
      fontWeight: "700" as const,
      letterSpacing: 0.5,
      lineHeight: 24,
    },
    medium: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      fontWeight: "700" as const,
      letterSpacing: 0.3,
      lineHeight: 22,
    },
    small: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
      lineHeight: 20,
    },
  },
  
  // Tagline/Subtitle styles
  tagline: {
    fontFamily: "Poppins_400Regular",
    fontSize: 22,
    fontWeight: "400" as const,
    letterSpacing: 0.5,
    lineHeight: 28,
  },
  
  // Description text styles
  description: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
} as const;

export type Typography = typeof typography;
