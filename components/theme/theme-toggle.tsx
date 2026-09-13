"use client";

import { useTheme } from "next-themes";
import { type MouseEvent, useSyncExternalStore } from "react";

interface Option {
  label: string;
  value: "light" | "dark" | "system";
}

const subscribeNever = () => () => {
  // The hydration snapshot never emits updates.
};
const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

const TWO_WAY: Option[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const THREE_WAY: Option[] = [...TWO_WAY, { label: "System", value: "system" }];

/**
 * The navbar control toggles light/dark; the three-way variant also exposes
 * "System". Until next-themes has read localStorage the resolved value is
 * unknown, so nothing is marked active — rendering a guess would flash the
 * wrong cell on hydration.
 */
const ThemeToggle = ({
  includeSystem = false,
}: {
  includeSystem?: boolean;
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Server render and first client render must agree; only after hydration is
  // the stored preference known.
  const mounted = useSyncExternalStore(
    subscribeNever,
    getClientSnapshot,
    getServerSnapshot
  );

  const options = includeSystem ? THREE_WAY : TWO_WAY;
  const active = includeSystem ? theme : resolvedTheme;
  const handleThemeChange = (event: MouseEvent<HTMLButtonElement>) => {
    const nextTheme = event.currentTarget.dataset.theme;
    if (nextTheme) {
      setTheme(nextTheme);
    }
  };

  return (
    <fieldset aria-label="Appearance" className="segmented">
      {options.map((option) => (
        <button
          aria-pressed={mounted && active === option.value}
          data-theme={option.value}
          key={option.value}
          onClick={handleThemeChange}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
};

export default ThemeToggle;
