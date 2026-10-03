# HealthWatch — unapplied components and mobile/backend handoff

Verified: 3 October 2026. Scope: the rebuilt web app in `test app/`.

## Read this first

This is a modular **React DOM + TypeScript + Vite visual prototype**. It is not an Expo/React Native project and cannot be opened directly in Expo Go. No backend API, authentication service, database, or live camera is connected. Backend and mobile work below is intentionally unapplied.

Use `test app/src/` as the current implementation. The root `Components/` folder is an earlier, unused component collection; the running app does not import it. Do not integrate that older collection by mistake.

## Verified component composition

```text
App — prototype login gate and injectable AppData
├── Login
└── DefaultHome — selected dependent, screen routing, shared frame
    ├── DependentHome — scrollable loader
    │   └── DependentCardsSet — maps dependents[] to cards
    ├── OverviewLoader — scrollable summary and history
    │   └── HistoryCardsSet — maps selected dependent's scans[] to cards
    ├── DependentInfoLoader — scrollable edit content
    │   └── DependentInfo — reference artwork, not an editable form yet
    ├── ScannerLoader → DependentCamera
    ├── IntakeLoader
    ├── AlertsLoader — scrollable loader
    │   └── AlertCardsSet — maps selected dependent's alerts[] to cards
    └── NavigationSet — persistent sibling of the active loader
```

Card collections are children of their loaders, and loaders are children of DefaultHome. The navigation sits outside the scrolling content. Home and Edit show their reference footer instead of the five-button dependent navigation. Opening a dependent selects Overview; Overview, Scan, Camera, Intake, and Alerts retain the same navigation. Home exits that mode.

The loader names currently mean **screen/content containers**, not network-fetching hooks. Loading, retry, error, cancellation, and pagination behavior have not been implemented.

## Module boundaries

| Location | Responsibility | Reuse for mobile |
| --- | --- | --- |
| `test app/src/domain.ts` | Plain TypeScript view-model types: Dependent, ScanEntry, Risk, AppData, DependentPage | Reusable starting point; reconcile with the actual API schema |
| `test app/src/sampleData.ts` | All normal preview fixtures | Optional development fixtures; never production data |
| `test app/src/App.tsx` | Accepts `data?: AppData`; defaults to fixtures; prototype login gate | Reuse flow concept; replace the DOM frame and authentication gate |
| `test app/src/tsx/DefaultHome.tsx` | Owns navigation/selection; filters scans and alerts by dependentId; passes data into loaders | Reuse routing requirements and filtering; port rendering/navigation to native |
| `test app/src/tsx/*CardsSet.tsx` | Data-driven, presentational lists; stable record keys; no network requests | Port markup/styles to native; retain data contracts and callbacks |
| `test app/src/tsx/*Loader.tsx` | Screen composition, scroll bounds, back callbacks | Port to native scroll/list containers |
| `test app/src/modules/` and `src/global.css` | Web styles, shared colors, dimensions, Inter font | Convert values into native style/theme objects; CSS Modules and cqw units are web-specific |
| `test app/src/utils.ts` | Vite asset URLs and percentage positioning for artwork overlays | Replace with native asset imports and responsive layout |
| `test app/public/assets/References/` | Original Desktop assets, copied unchanged | Design source; verify each converted SVG on device |
| `test app/public/assets/derived/` | Cropped screen shells and artwork | Web composition assets; not API or native screen implementations |

## Unapplied backend-connected features

The operations below describe required behavior, **not existing endpoints**. No API URLs, request methods, response schema, or authorization contract have been agreed or verified.

| Component / area | Present behavior | Unapplied work | Required data / operation |
| --- | --- | --- | --- |
| Login | Optional fields and a button that opens Home; credentials are not checked, stored, or submitted | Authentication, validation, failures, session restoration, logout/token handling | Backend-defined sign-in/session contract |
| Sign Up / password recovery | Sign-up artwork exists; no route or action is wired. Recovery is not in the active flow | Native forms and account/recovery integration if added to scope | Registration and recovery contracts |
| DependentHome / DependentCardsSet | Renders supplied dependents with working Open/Edit navigation | Fetch, refresh, add, empty/error/loading states for remote data | Authorized dependent list and creation operations |
| DependentInfoLoader / DependentInfo | Scrollable SVG form artwork; selected ID is reflected in the screen heading, but field values remain reference text | Real form fields, loading the selected profile, validation, save, delete, allergy/condition updates | Profile read/update/delete; condition/allergy options; server-calculated targets |
| OverviewLoader / HistoryCardsSet | Renders supplied scan records; counts derive from the loaded entries; Common Reason remains a placeholder | Real totals and recent-scan definition, common reason, paginated history, refresh, clear/remove operations | Per-dependent overview/aggregate data and paginated scan history |
| ScannerLoader | Reference screen and working Use Camera navigation | Barcode/dish inputs and lookup, pending/error/not-found states | Food/barcode lookup and scan evaluation contracts |
| DependentCamera | Reference placeholder plus navigation | Device permission flow, live camera/barcode capture, deduplication, lookup submission | Device camera integration plus lookup/evaluation contract |
| Results | SVG reference and legacy component exist, but no active Results route | Real result model, result screen, save/Eaten action, scan-again flow | Scan result and atomic meal/intake save contract |
| IntakeLoader | Reference SVG with fixed placeholder totals | Live calorie/sodium/sugar values, date/time-zone selection and refresh after saving a meal | Per-dependent daily consumption, targets, and percentages |
| AlertsLoader / AlertCardsSet | Data-driven alert list; Acknowledge is disabled; Active is placeholder text | Fetch, pagination, acknowledgement, status updates, loading/error handling | Alert records including status and acknowledgement operation |
| Overview Clear all / card minus buttons | Visible and disabled | Authorized history removal and subsequent summary refresh | Backend-supported clear/remove semantics |
| Home Add / Refresh and Edit Save / Delete | Present in artwork only | Interactive controls and backend mutations | Dependent CRUD and cache refresh |

Actual camera capture is a **mobile capability**, not something backend connectivity alone enables. Likewise, replacing SVG input artwork with editable controls is frontend work.

## Current data shape and integration gaps

`AppData` contains three arrays: `dependents`, `scans`, and `alerts`. `DefaultHome` filters both record arrays using `dependentId`; backend authorization must still enforce user/dependent access independently.

Current models are UI fixtures, not validated network DTOs:

- IDs for dependents are numeric; confirm whether the API uses numbers or strings before integration.
- `ScanEntry.date` is already a display string. A real API should expose a defined timestamp/time-zone contract, adapted into the display model.
- Scan and alert fixtures currently share `ScanEntry`. Introduce separate DTOs for acknowledgement/status and scan nutrition/results as needed.
- Dependent fields currently contain age and display nutrient values. Profile forms need additional source fields, units, allergy/condition IDs, and validation rules.
- Overview counts describe only the records currently supplied. For pagination, use backend aggregate totals; do not present the length of one page as the all-time total.
- Recent Scans currently uses the same supplied records as the totals. Agree on a date window or record limit before implementing real recent-scan behavior.
- No HTTP client, environment-configured API base URL, repository/service implementation, async hook, or runtime response validation exists yet.

Keep API access in a service/repository layer and screen-level hooks. Pass resulting data into loaders and cards; avoid embedding fetch calls in individual cards. Replace the fixture source at the application boundary rather than editing each visual component.

## Expo Go migration

The team must create a separate Expo app, select a compatible SDK/Expo Go combination, and port the screen rendering before it can run in Expo Go. This repository has Vite scripts, not Metro/Expo scripts. `npm run dev` launches only the web preview. See [Expo project creation](https://docs.expo.dev/get-started/create-a-project/) and [Expo Go compatibility](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/).

| Web implementation | Native counterpart / work required |
| --- | --- |
| div, section, main, p, headings | View and Text components |
| button and transparent HTML hotspots | Pressable with accessible labels and suitable touch targets |
| input/form | TextInput, native form state, validation, keyboard handling |
| CSS overflow containers | ScrollView for the finite edit form; FlatList for growing dependent/history/alert lists |
| Overview summary above history | FlatList ListHeaderComponent for the summary, with history as list rows |
| DOM navigation overlay | Native screen navigation and a persistent tab bar outside list content |
| CSS Modules, CSS variables, cqw/svh | StyleSheet/theme values, responsive dimensions, safe-area insets |
| Google Fonts CSS import | Native font loading or a system-font fallback |
| img with public SVG URL | Native SVG components/assets, tested on Android and iOS |
| Static camera illustration | expo-camera permission and CameraView integration |

React Native documents FlatList as the appropriate choice for long lists because ScrollView creates every child at once. The web prototype's lists are not virtualized. See [ScrollView](https://reactnative.dev/docs/scrollview) and [FlatList](https://reactnative.dev/docs/flatlist).

`react-native-svg` and `expo-camera` are included in Expo Go according to their current Expo documentation. Install SDK-compatible versions using `npx expo install` in the future Expo project. This does not establish that every exported SVG filter/clip/embedded image will render identically; verify the supplied assets on device. See [SVG support](https://docs.expo.dev/versions/latest/sdk/svg/) and [Camera](https://docs.expo.dev/versions/latest/sdk/camera/).

Expo Go has a fixed set of native capabilities. If the implementation later requires unsupported native modules, use a development build. No Expo Go launch, native build, or device test has been performed here. See [development builds FAQ](https://docs.expo.dev/develop/development-builds/faq/).

## Verification and handoff contents

- TypeScript/Vite production build and lint pass.
- Browser fixture: 12 dependent cards and 30 scan/alert records render inside their respective loaders.
- Scrolled to dependent 12, scan 30, and alert 30; the dependent navigation bounds were unchanged before/after scrolling.
- Edit content extends beyond its viewport and scrolls to the lower conditions section.
- Empty list rendering exists in all three card collections.
- Auth, server persistence, real profile editing, aggregate calculations, camera access, Expo Go, and native accessibility have not been verified because they are not implemented.

Send the team `test app/src/`, `test app/public/assets/`, the package and configuration files, `test app/README.md`, and this document. Exclude `node_modules/`, `dist/`, `.npm-cache/`, and `.verification/`. No files have been sent externally by this task.
## Repository tree

Generated with `tree /F /A` from the HealthWatch root. Dependency, cache, build, verification, and Git-internal contents are omitted from this handoff view; no project files were removed. Windows `tree` may omit hidden directories.

The active web app is under `test app/`. The root `Components/` directory is the legacy collection described above.

```text
C:.
|   .gitignore
|   package-lock.json
|   UNAPPLIED_COMPONENTS.md
|   
+---.npm-cache [contents omitted]
+---Components
|   |   global.css
|   |   
|   +---modules
|   |       AuthenticationSet.module.css
|   |       Dependent.module.css
|   |       IconSet.module.css
|   |       SharedComponents.module.css
|   |       
|   +---Test App
|   \---tsx
|           AlertCardsSet.tsx
|           AlertLoader.tsx
|           AuthenticationSet.tsx
|           Depdendent.tsx
|           DepdendentInfoLoader.tsx
|           Frame.tsx
|           Header.tsx
|           HistoryCardsSet.tsx
|           IconSet.tsx
|           IntakeLoader.tsx
|           IntensitySet.tsx
|           LogoSet.tsx
|           NavigationSet.tsx
|           OverviewLoader.tsx
|           Results.tsx
|           ScannerLoader.tsx
|           StatusSet.tsx
|           WallpaperSet.tsx
|           
+---References
|       Alert circle.svg
|       Alert circle2.svg
|       Alert triangle.svg
|       arrow_back.svg
|       Check circle.svg
|       Dependent Alerts - HealthWatch.svg
|       Dependent Camera - HealthWatch.svg
|       Dependent Edit- HealthWatch.svg
|       Dependent Home - HealthWatch.svg
|       Dependent Intake - HealthWatch.svg
|       Dependent Scan - HealthWatch.svg
|       History.svg
|       Home.svg
|       inbox.svg
|       Login - HealthWatch.svg
|       Minus.svg
|       Results- HealthWatch.svg
|       Scan.svg
|       Sign Up - HealthWatch.svg
|       Start Screen - HealthWatch.svg
|       Vector.svg
|       Wallpaper.png
|       
\---test app
    |   .gitignore
    |   .oxlintrc.json
    |   index.html
    |   package-lock.json
    |   package.json
    |   README.md
    |   tsconfig.app.json
    |   tsconfig.json
    |   tsconfig.node.json
    |   vite.config.ts
    |   
    +---.verification [contents omitted]
    +---dist [contents omitted]
    +---node_modules [contents omitted]
    +---public
    |   \---assets
    |       +---derived
    |       |       AlertCard-0.svg
    |       |       AlertCard-1.svg
    |       |       AlertCard-2.svg
    |       |       AlertsShell.svg
    |       |       Dependent Alerts - HealthWatch.svg
    |       |       Dependent Camera - HealthWatch.svg
    |       |       Dependent Intake - HealthWatch.svg
    |       |       Dependent Scan - HealthWatch.svg
    |       |       DependentInfoContent.svg
    |       |       EditShell.svg
    |       |       HomeShell.svg
    |       |       Navigation.svg
    |       |       Overview.svg
    |       |       
    |       \---References
    |               Alert circle.svg
    |               Alert circle2.svg
    |               Alert triangle.svg
    |               arrow_back.svg
    |               Check circle.svg
    |               Dependent Alerts - HealthWatch.svg
    |               Dependent Camera - HealthWatch.svg
    |               Dependent Edit- HealthWatch.svg
    |               Dependent Home - HealthWatch.svg
    |               Dependent Intake - HealthWatch.svg
    |               Dependent Scan - HealthWatch.svg
    |               History.svg
    |               Home.svg
    |               inbox.svg
    |               Login - HealthWatch.svg
    |               Minus.svg
    |               Results- HealthWatch.svg
    |               Scan.svg
    |               Sign Up - HealthWatch.svg
    |               Start Screen - HealthWatch.svg
    |               Vector.svg
    |               Wallpaper.png
    |               
    \---src
        |   App.tsx
        |   domain.ts
        |   global.css
        |   main.tsx
        |   sampleData.ts
        |   utils.ts
        |   
        +---modules
        |       Loaders.module.css
        |       OverviewLoader.module.css
        |       Screen.module.css
        |       
        \---tsx
                AlertCardsSet.tsx
                AlertsLoader.tsx
                DefaultHome.tsx
                DependentCamera.tsx
                DependentCardsSet.tsx
                DependentHome.tsx
                DependentInfo.tsx
                DependentInfoLoader.tsx
                HistoryCardsSet.tsx
                IntakeLoader.tsx
                Login.tsx
                NavigationSet.tsx
                OverviewLoader.tsx
                ScannerLoader.tsx
                ScreenArt.tsx
```
