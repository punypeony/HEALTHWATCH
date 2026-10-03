import "../global.css";
import type { ReactNode } from "react";
type OverviewLoaderProps = { loading?: boolean; children?: ReactNode };
export default function OverviewLoader({ loading = false, children }: OverviewLoaderProps) {
  return <section aria-label="Overview" aria-busy={loading}>{loading ? <p role="status">Loading overview…</p> : children ?? <p>Your health overview will appear here.</p>}</section>;
}
