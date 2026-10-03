# HealthWatch native components

The `UI/Components` TSX and CSS exports are the visual source. They describe web
elements and Figma component-set canvases, so they are translated into native
controls rather than imported into Expo. The original exports are preserved.
The dashed purple component-set frames and simultaneous state variants are
editor presentation, not app UI. Placeholders are replaced by existing API data.

| Export under UI/Components | Native implementation |
| --- | --- |
| Wallpaper | `Screen.tsx` / `Background` and bundled gradient artwork |
| Header | `AppHeader.tsx` |
| Authentication | `AuthLayout.tsx`, `AuthSwitch.tsx`, `Field.tsx`, `Button.tsx` |
| Dependent | `DependentCard.tsx`, `NutritionTile.tsx` |
| Navigation | `NavigationBar.tsx`, `ActionBar.tsx`, `navigation/HealthTabBar.tsx` |
| Intensity | `RiskBadge.tsx` |
| Status | `AlertStatus.tsx` |
| AlertCards / AlertLoaderSet | `AlertCard.tsx`, `screens/AlertsScreen.tsx` |
| HistoryCards | `HistoryCard.tsx` |
| OverViewLoader | `OverviewCard.tsx`, `screens/SummaryScreen.tsx` |
| IntakeLoader | `IntakeCard.tsx`, `NutritionTile.tsx` |
| ScannerLoader | `ScannerEntry.tsx`, existing camera in `screens/ScannerScreen.tsx` |
| Results | `ResultCard.tsx`, existing result details and eaten controls |
| DependentInfoLoader | `Field.tsx`, `Card.tsx`, existing dependent form and condition checkboxes |

The 1080 px reference layout is adapted to phone density-independent units.
Dependent nutrition tiles stay in one row; condition chips and long text can
wrap. Add/Refresh sit outside the scrolling list. Buttons retain at least 44 dp
touch areas. Text uses the platform font; the exports reference Google-hosted
Inter, but do not include a local font file. No runtime font download is added.

Component icons are exported from `UI` SVGs into `mobile/assets/design` by
`mobile/scripts/export-design-assets.cjs`. Navigation icons and the logo are
absent from the new folder, so they use the previously supplied
`HealthWatch UI/References` artwork. All icons use explicit local asset sources.
The exporter uses an existing sharp installation as a development tool; sharp
is not an app dependency.

Risk labels keep the backend values `safe`, `warning`, `danger`; the badge uses
the exported labels Low Risk, Moderate Risk, High Risk. History remains reachable
from Overview. Authentication, ownership, scans, intake confirmation, and alert
acknowledgement still use the existing API and state handlers.

Device layout and interaction verification is left to the user as requested.

The bottom overlay samples the blue-to-green wallpaper at its screen height,
then increases opacity toward the navigation controls. This conceals scrolling
content without adding a differently colored green band.

Dependent cards use a tappable profile silhouette. The approved Expo image picker
opens the gallery; only decodable JPEG files up to 5 MB are saved in local app
document storage. Photos persist on this phone, are not sent to the backend,
and disappear if app data is cleared. Canceling or rejecting a selection keeps
the previous photo.
