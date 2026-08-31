/**
 * fix-app-add-assets-page.cjs
 * Run from FRONTEND folder: node fix-app-add-assets-page.cjs
 *
 * Wires the new AssetTracking page into App.jsx:
 *   1. Imports AssetTrackingPage
 *   2. Adds assetsFilter state
 *   3. Passes navigateToAssets callback to Dashboard
 *   4. Adds the 'assets' page route
 *
 * Uses only anchors that are stable regardless of the getLoanRemainingQty
 * fix already applied on this machine - does not touch that function.
 */
const fs = require('fs');
const path = require('path');

const APP_PATH = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(APP_PATH, 'utf8');

// ── 1. Import ────────────────────────────────────────────────────────────
if (!app.includes("AssetTrackingPage")) {
  app = app.replace(
    "import RecoveryPage from './pages/Recovery.jsx';",
    "import RecoveryPage from './pages/Recovery.jsx';\nimport AssetTrackingPage from './pages/AssetTracking.jsx';"
  );
  console.log('App.jsx: added AssetTrackingPage import');
} else {
  console.log('App.jsx: AssetTrackingPage import already present, skipping');
}

// ── 2. Add assetsFilter state next to currentPage ───────────────────────
if (!app.includes('assetsFilter')) {
  app = app.replace(
    "const [currentPage, setCurrentPage] = useState('dashboard');",
    "const [currentPage, setCurrentPage] = useState('dashboard');\n  const [assetsFilter, setAssetsFilter] = useState('ALL');"
  );
  console.log('App.jsx: added assetsFilter state');
} else {
  console.log('App.jsx: assetsFilter state already present, skipping');
}

// ── 3 & 4. Add navigation wiring + route (patch the render block) ──────
const oldRenderLine =
  "{currentPage === 'dashboard'            && <DashboardPage         {...sharedProps} />}";

const newRenderBlock =
  "{currentPage === 'dashboard'            && <DashboardPage         {...sharedProps} navigateToAssets={(filter) => { setAssetsFilter(filter); setCurrentPage('assets'); }} />}\n" +
  "        {currentPage === 'assets'               && <AssetTrackingPage    {...sharedProps} initialFilter={assetsFilter} />}";

if (app.includes(oldRenderLine)) {
  app = app.replace(oldRenderLine, newRenderBlock);
  console.log('App.jsx: wired navigateToAssets + added assets route');
} else {
  console.log('App.jsx: exact render line not matched - trying loose replace...');
  app = app.replace(
    /\{currentPage === 'dashboard'[\s\S]*?<DashboardPage[\s\S]*?\/>\}/,
    newRenderBlock
  );
  console.log('App.jsx: dashboard render line replaced via regex fallback');
}

fs.writeFileSync(APP_PATH, app);

console.log('');
console.log('=== Verification ===');
const final = fs.readFileSync(APP_PATH, 'utf8');
console.log('Has AssetTrackingPage import:', final.includes('AssetTrackingPage'));
console.log('Has assetsFilter state:', final.includes('assetsFilter'));
console.log('Has navigateToAssets wiring:', final.includes('navigateToAssets'));
console.log("Has assets route:", final.includes("currentPage === 'assets'"));
console.log('');
console.log('Done. Now run:');
console.log('  git add -A && git commit -m "feat: add standalone Asset Tracking page with filters/search" && git push origin main');
