const fs = require('fs');
const path = require('path');

const pagesDir = path.resolve('D:/my-projects/Mobile Phone Sales Shop system/frontend/src/pages');
const IMPORT_LINE = "import AdminLayout from '../components/AdminLayout';";

const targets = [
  'AdminInventory',
  'AdminOrders',
  'AdminPricing',
  'AdminProducts',
  'AdminRepairs',
  'AdminReports',
  'AdminStaff',
  'AdminStock',
  'AdminUsers'
];

targets.forEach(name => {
  const fp = path.join(pagesDir, name + '.jsx');
  if (!fs.existsSync(fp)) {
    console.log('SKIP (not found): ' + name);
    return;
  }
  let src = fs.readFileSync(fp, 'utf8');

  if (src.includes('AdminLayout')) {
    console.log('ALREADY DONE: ' + name);
    return;
  }

  // 1. Insert AdminLayout import after last import statement
  const lines = src.split('\n');
  let lastImport = -1;
  lines.forEach((line, i) => {
    if (line.trim().startsWith('import ')) lastImport = i;
  });
  if (lastImport >= 0) {
    lines.splice(lastImport + 1, 0, IMPORT_LINE);
    src = lines.join('\n');
  }

  // 2. Wrap root container div
  src = src.replace(
    /<div className="container animate-fade-in"([^>]*)>/,
    '<AdminLayout>\n    <div className="animate-fade-in"$1>'
  );

  // 3. Close AdminLayout before final );
  //    Find last  </div>\n  );\n}  and insert </AdminLayout>
  src = src.replace(/(\n  \);\n\}(\s*)$)/, '\n    </AdminLayout>\n  );\n}\n');

  fs.writeFileSync(fp, src, 'utf8');
  console.log('PATCHED: ' + name);
});

console.log('\nAll done.');
