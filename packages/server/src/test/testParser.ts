/**
 * Simple test script to verify lexer and parser work correctly
 * Run with: node dist/test/testParser.js
 */

import { parseXtbDocument } from '../parser/xtbParser';
import { defaultXtbSchema } from '@xtb-xcontrol/shared';

const testDocument = `# Test xcontrol file
$chrg 0
$spin 0

$fix
   atoms: 1-5
   elements: C,H
$end

$constrain
   distance: 1,2,2.5
$end

orphan_option: should be flagged

$wall
   potential=logfermi
   temp=300
$end
`;

console.log('Testing xTB xcontrol parser...\n');
console.log('Input document:');
console.log('─'.repeat(50));
console.log(testDocument);
console.log('─'.repeat(50));

const result = parseXtbDocument(testDocument, defaultXtbSchema);

console.log('\nParsing results:');
console.log('═'.repeat(50));

console.log(`\n📋 Found ${result.instructions.length} instructions:`);
result.instructions.forEach((inst, i) => {
  console.log(`  ${i + 1}. ${inst.name} (${inst.kind})`);
  console.log(
    `     Line ${inst.bodyStartLine}-${inst.bodyEndLine}, hasEnd: ${inst.hasExplicitEnd}`
  );
  if (inst.options.length > 0) {
    console.log(`     Options (${inst.options.length}):`);
    inst.options.forEach((opt) => {
      console.log(`       - ${opt.key} ${opt.operator} ${opt.value}`);
    });
  }
});

if (result.orphanOptions.length > 0) {
  console.log(`\n⚠️  Found ${result.orphanOptions.length} orphan options:`);
  result.orphanOptions.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt.key} ${opt.operator} ${opt.value}`);
  });
}

if (result.errors.length > 0) {
  console.log(`\n❌ Found ${result.errors.length} errors:`);
  result.errors.forEach((err, i) => {
    console.log(`  ${i + 1}. [${err.severity}] ${err.message}`);
    console.log(`     Line ${err.range.start.line + 1}`);
  });
}

console.log('\n✅ Parser test completed!');
