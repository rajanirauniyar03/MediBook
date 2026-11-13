// scratch/rebrand-to-veyora.js
// Comprehensive Rebranding Script: MediBook -> Veyora

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve('d:/Rajani/MediBook');

// Helper to recursively find files
function getFiles(dir, extensions = ['.html', '.js', '.css', '.json', '.md', '.example']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'scratch') return;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, extensions));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext) || file === '.env' || file === '.env.example') {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = getFiles(rootDir);
console.log(`Found ${files.length} candidate files to check for rebranding.`);

let modifiedCount = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. HTML Logo Branding:
  // Medi<span class="brand-highlight">Book</span> -> Vey<span class="brand-highlight">ora</span>
  content = content.replace(/Medi<span class="brand-highlight">Book<\/span>/g, 'Vey<span class="brand-highlight">ora</span>');
  content = content.replace(/Medi<span class="brand-highlight">Book<\/span>\s*<span>Health<\/span>/g, 'Vey<span class="brand-highlight">ora</span> <span>Health</span>');
  content = content.replace(/Medi<span style="color:\s*var\(--primary-600\);">Book<\/span>/g, 'Vey<span style="color: var(--primary-600);">ora</span>');
  content = content.replace(/Medi<span class="text-primary">Book<\/span>/g, 'Vey<span class="text-primary">ora</span>');

  // 2. Specific Email domains
  content = content.replace(/@medibook\.com/g, '@veyora.com');
  content = content.replace(/@medibook\.health/g, '@veyora.health');
  content = content.replace(/medibook-health/g, 'veyora-health');
  content = content.replace(/medibook\.health/g, 'veyora.health');

  // 3. System Names & Prompts
  content = content.replace(/MediBook Healthcare/g, 'Veyora Healthcare');
  content = content.replace(/MediBook AI Assistant/g, 'Veyora AI Assistant');
  content = content.replace(/MediBook AI Healthcare Assistant/g, 'Veyora AI Healthcare Assistant');
  content = content.replace(/MediBook Assistant/g, 'Veyora Assistant');
  content = content.replace(/MediBook Central Outpatient Pharmacy/g, 'Veyora Central Outpatient Pharmacy');
  content = content.replace(/MediBook Hospital Alliance/g, 'Veyora Hospital Alliance');
  content = content.replace(/MediBook Medical Alliance/g, 'Veyora Medical Alliance');
  content = content.replace(/MediBook Platform/g, 'Veyora Platform');
  content = content.replace(/MediBook Healthcare Platform/g, 'Veyora Healthcare Platform');
  content = content.replace(/MediBook/g, 'Veyora');
  content = content.replace(/medibook/g, 'veyora');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const rel = path.relative(rootDir, filePath);
    console.log(`Updated: ${rel}`);
    modifiedCount++;
  }
});

console.log(`\nRebranding complete! Successfully updated ${modifiedCount} files to Veyora.`);
