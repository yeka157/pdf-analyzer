"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

type Option = { value: "light" | "dark" | "system"; label: string };

const subscribeNever = () => () => {};

const TWO_WAY: Option[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const THREE_WAY: Option[] = [...TWO_WAY, { value: "system", label: "System" }];

/**
 * The navbar control toggles light/dark; the three-way variant also exposes
 * "System". Until next-themes has read localStorage the resolved value is
 * unknown, so nothing is marked active — rendering a guess would flash the
 * wrong cell on hydration.
 */
const ThemeToggle = ({ includeSystem = false }: { includeSystem?: boolean }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Server render and first client render must agree; only after hydration is
  // the stored preference known.
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );

  const options = includeSystem ? THREE_WAY : TWO_WAY;
  const active = includeSystem ? theme : resolvedTheme;

  return (
    <div className="segmented" role="group" aria-label="Appearance">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={mounted && active === option.value}
          onClick={() => setTheme(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
