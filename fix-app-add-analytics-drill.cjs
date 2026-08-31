/**
 * fix-app-add-analytics-drill.cjs
 * Run from FRONTEND folder: node fix-app-add-analytics-drill.cjs
 *
 * Adds analyticsDrill state + navigateToAnalytics callback, wired into
 * DashboardPage and AnalyticsPage, so clicking a Dashboard card can deep-link
 * straight into an Analytics chart drill-down (not just the plain Assets table).
 *
 * Written to work whether or not the previous Assets-page patch used its
 * exact-match path or its regex fallback - uses flexible anchors throughout.
 */
const fs = require('fs');
const path = require('path');

const APP_PATH = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(APP_PATH, 'utf8');
const before = app;

// ── 1. Add analyticsDrill state next to assetsFilter (or currentPage as fallback) ──
if (!app.includes('analyticsDrill')) {
  if (app.includes("useState('ALL');")) {
    app = app.replace(
      "useState('ALL');",
      "useState('ALL');\n  const [analyticsDrill, setAnalyticsDrill] = useState(null); // { type, value } | null"
    );
  } else {
    app = app.replace(
      /const \[currentPage, setCurrentPage\] = useState\('dashboard'\);/,
      "const [currentPage, setCurrentPage] = useState('dashboard');\n  const [analyticsDrill, setAnalyticsDrill] = useState(null); // { type, value } | null"
    );
  }
  console.log('App.jsx: added analyticsDrill state');
} else {
  console.log('App.jsx: analyticsDrill state already present, skipping');
}

// ── 2. Find the DashboardPage render line and add navigateToAnalytics prop ──
const dashboardRegex = /<DashboardPage(\s+)\{\.\.\.sharedProps\}([^/]*)\/>/;
if (dashboardRegex.test(app) && !app.includes('navigateToAnalytics=')) {
  app = app.replace(dashboardRegex, (match, ws, rest) => {
    return `<DashboardPage${ws}{...sharedProps}${rest}navigateToAnalytics={(type, value) => { setAnalyticsDrill(type ? { type, value } : null); setCurrentPage('analytics'); }} />`;
  });
  console.log('App.jsx: added navigateToAnalytics callback to DashboardPage');
} else if (app.includes('navigateToAnalytics=')) {
  console.log('App.jsx: navigateToAnalytics already wired, skipping');
} else {
  console.log('App.jsx: WARNING - DashboardPage render line not found, manual check needed');
}

// ── 3. Find the AnalyticsPage render line and add initialDrill prop ─────────
const analyticsRegex = /<AnalyticsPage(\s+)\{\.\.\.sharedProps\}([^/]*)\/>/;
if (analyticsRegex.test(app) && !app.includes('initialDrill=')) {
  app = app.replace(analyticsRegex, (match, ws, rest) => {
    return `<AnalyticsPage${ws}{...sharedProps}${rest}initialDrill={analyticsDrill} />`;
  });
  console.log('App.jsx: added initialDrill prop to AnalyticsPage');
} else if (app.includes('initialDrill=')) {
  console.log('App.jsx: initialDrill already wired, skipping');
} else {
  console.log('App.jsx: WARNING - AnalyticsPage render line not found, manual check needed');
}

fs.writeFileSync(APP_PATH, app);

console.log('');
console.log('=== Verification ===');
const final = fs.readFileSync(APP_PATH, 'utf8');
console.log('Has analyticsDrill state:', final.includes('analyticsDrill'));
console.log('DashboardPage has navigateToAnalytics:', final.includes('navigateToAnalytics={'));
console.log('AnalyticsPage has initialDrill:', final.includes('initialDrill={analyticsDrill}'));
console.log('');
if (final === before) {
  console.log('NOTHING CHANGED - inspect src/App.jsx manually and paste back its DashboardPage/AnalyticsPage render lines.');
} else {
  console.log('Done. Now run:');
  console.log('  git add -A && git commit -m "feat: wire Dashboard cards into Analytics drill-down navigation" && git push origin main');
}
