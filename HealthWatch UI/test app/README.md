# HealthWatch SVG prototype

Run `npm install` once, then `npm run dev` from this folder. Use `npm run build` and `npm run lint` to check the app.

The old component gallery has been replaced. This app is self-contained and does not import the legacy Components folder.

## Flow

- Login opens Dependent Home. Credentials are optional and are not checked or stored.
- Each Open button opens that dependent's Overview, with the supplied status totals, Recent Scans row, and History cards.
- The persistent dependent navigation provides Home, Overview, Scan, Intake, and Alerts.
- Use Camera opens the Dependent Camera visual. Navigation remains visible.
- Home returns to the dependent list and removes the dependent navigation.
- Edit opens Dependent Info. Its back button returns to the list.

## Artwork and scope

`public/assets/References` is copied from the supplied Desktop/assets/HealthWatch/References folder. The original SVG screen artwork is rendered directly with accessible interaction overlays. `public/assets/derived` contains cropped/reassembled artwork for the shared navigation, overview, and alert cards. Overview uses the supplied React component, CSS module, and global design tokens. Its icons use the reference SVGs and its layout scales from the original 1080-unit design.

This is a visual flow prototype, not a DOM recreation of every SVG label. Save, add, delete, refresh, sign-up, acknowledgement, camera capture, food lookup, and backend authentication remain for future development. Their original artwork is retained but they have no action. Overview Clear all and remove controls are disabled. Browser refresh returns to Login.


## Modular handoff and scrolling

See ../UNAPPLIED_COMPONENTS.md for the current loader/card hierarchy, backend work, and Expo Go migration requirements. Home, Overview, Edit, and Alerts have bounded content scroll areas. Lists receive arrays via AppData; fixture records live in src/sampleData.ts. DefaultHome owns screen selection and keeps navigation outside the scroll containers.

