#!/usr/bin/env node

/**
 * Bundle Size Checker
 * 
 * Enforces bundle size budgets to prevent performance regressions.
 * Fails CI if any bundle exceeds the defined budget.
 */

const fs = require('fs');
const path = require('path');

// Bundle size budgets (in KB)
const BUDGETS = {
  'index.js': 500, // Main bundle
  'index.css': 100, // Main CSS
  total: 600, // Total bundle size
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2);
}

function formatPercentage(current, budget) {
  const percentage = ((current / budget) * 100).toFixed(1);
  return percentage;
}

function getStatus(current, budget) {
  const percentage = (current / budget) * 100;
  if (percentage > 100) return { symbol: '❌', color: colors.red, status: 'FAIL' };
  if (percentage > 90) return { symbol: '⚠️', color: colors.yellow, status: 'WARN' };
  return { symbol: '✅', color: colors.green, status: 'PASS' };
}

function analyzeBundleSize() {
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error(`${colors.red}❌ Error: dist/ directory not found. Run 'pnpm run build' first.${colors.reset}`);
    process.exit(1);
  }

  const results = [];
  let totalSize = 0;
  let hasFailed = false;

  // Analyze JavaScript bundles
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    
    files.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const sizeKB = stats.size / 1024;
      totalSize += sizeKB;

      // Check if file matches a budget pattern
      let budgetKey = null;
      if (file.match(/index.*\.js$/)) budgetKey = 'index.js';
      else if (file.match(/index.*\.css$/)) budgetKey = 'index.css';

      if (budgetKey && BUDGETS[budgetKey]) {
        const budget = BUDGETS[budgetKey];
        const status = getStatus(sizeKB, budget);
        
        results.push({
          file,
          size: sizeKB,
          budget,
          status: status.status,
          symbol: status.symbol,
          color: status.color,
        });

        if (status.status === 'FAIL') {
          hasFailed = true;
        }
      }
    });
  }

  // Check total bundle size
  const totalBudget = BUDGETS.total;
  const totalStatus = getStatus(totalSize, totalBudget);
  
  results.push({
    file: 'TOTAL',
    size: totalSize,
    budget: totalBudget,
    status: totalStatus.status,
    symbol: totalStatus.symbol,
    color: totalStatus.color,
  });

  if (totalStatus.status === 'FAIL') {
    hasFailed = true;
  }

  return { results, hasFailed };
}

function printReport(results, hasFailed) {
  console.log(`\n${colors.bold}${colors.blue}📦 Bundle Size Report${colors.reset}\n`);
  console.log('─'.repeat(80));
  console.log(
    `${colors.bold}File${' '.repeat(35)} Size      Budget    Status${colors.reset}`
  );
  console.log('─'.repeat(80));

  results.forEach(result => {
    const fileName = result.file.padEnd(35);
    const size = `${formatBytes(result.size)} KB`.padEnd(10);
    const budget = `${result.budget} KB`.padEnd(10);
    const percentage = formatPercentage(result.size, result.budget);
    const status = `${result.symbol} ${result.status} (${percentage}%)`;

    console.log(
      `${fileName}${size}${budget}${result.color}${status}${colors.reset}`
    );
  });

  console.log('─'.repeat(80));

  if (hasFailed) {
    console.log(
      `\n${colors.red}${colors.bold}❌ Bundle size check FAILED${colors.reset}`
    );
    console.log(
      `${colors.red}One or more bundles exceed the size budget.${colors.reset}\n`
    );
    console.log(`${colors.yellow}Recommendations:${colors.reset}`);
    console.log('  1. Use dynamic imports for large dependencies');
    console.log('  2. Enable tree-shaking for unused code');
    console.log('  3. Use code splitting with React.lazy()');
    console.log('  4. Analyze bundle with: pnpm run build -- --analyze');
    console.log('  5. Consider lazy-loading heavy components\n');
  } else {
    console.log(
      `\n${colors.green}${colors.bold}✅ Bundle size check PASSED${colors.reset}\n`
    );
  }

  // Write report to file for CI
  const reportText = results
    .map(r => `${r.file}: ${formatBytes(r.size)} KB / ${r.budget} KB (${r.status})`)
    .join('\n');
  
  fs.writeFileSync('bundle-report.txt', reportText);
}

function main() {
  console.log(`${colors.blue}Analyzing bundle size...${colors.reset}`);
  
  const { results, hasFailed } = analyzeBundleSize();
  printReport(results, hasFailed);

  if (hasFailed) {
    process.exit(1);
  }
}

main();