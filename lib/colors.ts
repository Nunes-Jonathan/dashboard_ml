"use client";

import { useSyncExternalStore } from "react";

/**
 * Validated palette (see the dataviz skill's references/palette.md).
 * Categorical order is fixed and never cycled or reassigned by rank.
 */
export const CATEGORICAL = {
  light: [
    "#2a78d6", // 1 blue
    "#eb6834", // 2 orange
    "#1baf7a", // 3 aqua
    "#eda100", // 4 yellow
    "#e87ba4", // 5 magenta
    "#008300", // 6 green
    "#4a3aa7", // 7 violet
    "#e34948", // 8 red
  ],
  dark: [
    "#3987e5",
    "#d95926",
    "#199e70",
    "#c98500",
    "#d55181",
    "#008300",
    "#9085e9",
    "#e66767",
  ],
};

export const STATUS = {
  good: { light: "#0ca30c", dark: "#0ca30c" },
  warning: { light: "#fab219", dark: "#fab219" },
  serious: { light: "#ec835a", dark: "#ec835a" },
  critical: { light: "#d03b3b", dark: "#d03b3b" },
};

/**
 * Ordinal ramp (discrete ordered buckets, e.g. days-offline aging). Per the
 * palette's ordinal rule the near-surface step must still clear 2:1 contrast:
 * light starts no lighter than step 250, dark goes no darker than step 600.
 */
export const SEQUENTIAL_BLUE = {
  light: ["#86b6ef", "#5598e7", "#3987e5", "#2a78d6", "#1c5cab", "#0d366b"],
  dark: ["#86b6ef", "#5598e7", "#2a78d6", "#256abf", "#1c5cab", "#184f95"],
};

export const CHROME = {
  light: {
    surface: "#fcfcfb",
    page: "#f9f9f7",
    ink: "#0b0b0b",
    inkSecondary: "#52514e",
    inkMuted: "#898781",
    gridline: "#e1e0d9",
    axis: "#c3c2b7",
  },
  dark: {
    surface: "#1a1a19",
    page: "#0d0d0d",
    ink: "#ffffff",
    inkSecondary: "#c3c2b7",
    inkMuted: "#898781",
    gridline: "#2c2c2a",
    axis: "#383835",
  },
};

export type ThemeMode = "light" | "dark";

function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => {
    media.removeEventListener("change", callback);
    observer.disconnect();
  };
}

function getServerSnapshot(): ThemeMode {
  return "light";
}

/** Tracks the resolved theme (OS preference + the manual data-theme override). */
export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, readTheme, getServerSnapshot);
}

export function useChartColors() {
  const mode = useThemeMode();
  return {
    mode,
    categorical: CATEGORICAL[mode],
    status: {
      good: STATUS.good[mode],
      warning: STATUS.warning[mode],
      serious: STATUS.serious[mode],
      critical: STATUS.critical[mode],
    },
    sequential: SEQUENTIAL_BLUE[mode],
    chrome: CHROME[mode],
  };
}
