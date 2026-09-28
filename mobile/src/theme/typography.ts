import { colors } from "./colors";

/**
 * Sizes are HealthWatch.txt font sizes divided by 3.
 * The 8pt error sample in that file is raised to 12 so the message stays readable.
 * Inter is named in the file and is not installed, so the platform font is used.
 */
export const typography = {
  brand: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "500" as const,
    color: colors.forest,
  },
  section: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "500" as const,
    color: colors.forest,
  },
  welcome: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700" as const,
    color: colors.white,
    textAlign: "center" as const,
  },
  button: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "700" as const,
    color: colors.white,
    textAlign: "center" as const,
  },
  buttonDark: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "400" as const,
    color: colors.ink,
    textAlign: "center" as const,
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "400" as const,
    color: colors.body,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500" as const,
    color: colors.body,
  },
  body: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400" as const,
    color: colors.body,
  },
  muted: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500" as const,
    color: colors.muted,
  },
  error: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400" as const,
    color: colors.error,
  },
  risk: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "700" as const,
    color: colors.body,
  },
};
