/**
 * fix-app-remaining-qty.js
 * Run from FRONTEND folder: node fix-app-remaining-qty.js
 *
 * Fixes getLoanRemainingQty in App.jsx so it correctly computes remaining
 * quantity based on the sum of actual returns processed (supports partial
 * returns), instead of the old binary "full amount or zero" logic.
 */
const fs = require('fs');
const path = require('path');

const APP_PATH = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(APP_PATH, 'utf8');

const oldFn =
  "const getLoanRemainingQty = (loanId) => {\n" +
  "    const loan = loans.find(l => l.id === loanId);\n" +
  "    if (!loan) return 0;\n" +
  "    if (loan.status === 'Returned') return 0;\n" +
  "    return Number(loan.quantity || 0);\n" +
  "  };";

const newFn =
  "const getLoanRemainingQty = (loanId) => {\n" +
  "    const loan = loans.find(l => l.id === loanId);\n" +
  "    if (!loan) return 0;\n" +
  "    if (loan.status === 'Returned') return 0;\n" +
  "    // Sum actual quantity returned so far (supports partial returns)\n" +
  "    const totalReturned = returns\n" +
  "      .filter(r => r.loan_id === loanId)\n" +
  "      .reduce((sum, r) => sum + Number(r.quantity || 0), 0);\n" +
  "    return Math.max(0, Number(loan.quantity || 0) - totalReturned);\n" +
  "  };";

if (app.includes(oldFn)) {
  app = app.replace(oldFn, newFn);
  fs.writeFileSync(APP_PATH, app);
  console.log('App.jsx: getLoanRemainingQty now supports partial returns');
} else {
  console.log('App.jsx: exact text not matched - showing current implementation for manual check:');
  const idx = app.indexOf('getLoanRemainingQty');
  console.log(app.slice(idx - 10, idx + 300));
}

console.log('');
console.log('=== Verification ===');
const final = fs.readFileSync(APP_PATH, 'utf8');
console.log('getLoanRemainingQty sums returns.quantity:', final.includes('totalReturned'));
console.log('');
console.log('Done. Now run:');
console.log('  git add -A && git commit -m "fix: getLoanRemainingQty supports partial returns" && git push origin main');
