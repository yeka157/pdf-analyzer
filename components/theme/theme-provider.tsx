"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Three-way theme (light / dark / system), defaulting to system and persisted
 * to localStorage by next-themes. `disableTransitionOnChange` keeps the 140ms
 * colour transitions on controls from firing across the whole page on a switch.
 */
const ThemeProvider = ({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    disableTransitionOnChange
    enableSystem
    {...props}
  >
    {children}
  </NextThemesProvider>
);

export default ThemeProvider;
