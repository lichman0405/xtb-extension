/**
 * Test script for diagnostic rules
 * Run with: node dist/test/testDiagnostics.js
 */

import { parseXtbDocument } from '../parser/xtbParser';
import { validateDocument, defaultDiagnosticConfig } from '../diagnostics/rules';
import { defaultXtbSchema } from '@xtb-xcontrol/shared';

const testCases = [
  {
    name: 'R1: Unknown Instruction',
    code: `$unknown_instruction
   some_option: value
$end`,
    expectedDiagnostics: ['unknownInstruction'],
  },
  {
    name: 'R2: Unknown Option',
    code: `$fix
   unknown_option: value
$end`,
    expectedDiagnostics: ['unknownOption'],
  },
  {
    name: 'R3: Suspicious Operator',
    code: `$wall
   potential: logfermi
   sphere = auto,30
$end`,
    expectedDiagnostics: ['suspiciousOperator'],
  },
  {
    name: 'R4: Duplicate Single Option',
    code: `$wall
   potential=logfermi
   potential=polynomial
$end`,
    expectedDiagnostics: ['duplicateOption'],
  },
  {
    name: 'R5: Orphan Option',
    code: `$chrg 0

orphan_option: value

$fix
   atoms: 1-5
$end`,
    expectedDiagnostics: ['orphanOption'],
  },
  {
    name: 'R6: Missing $end',
    code: `$fix
   atoms: 1-5
   
$constrain
   distance: 1,2,2.5
$end`,
    expectedDiagnostics: ['missingEnd'],
  },
  {
    name: 'Valid Document',
    code: `# Valid xcontrol file
$chrg 0
$spin 0

$fix
   atoms: 1-5
   elements: C,H
$end

$constrain
   distance: 1,2,2.5
$end`,
    expectedDiagnostics: [],
  },
  {
    name: 'Multiple Issues',
    code: `orphan_before: value

$unknown
   orphan_inside: value

$fix
   atoms: 1-5
   unknown_opt: test

$wall
   potential: wrong_operator
   temp=300
   temp=350`,
    expectedDiagnostics: [
      'orphanOption',
      'unknownInstruction',
      'unknownOption',
      'unknownOption',
      'suspiciousOperator',
      'missingEnd',
      'duplicateOption',
    ],
  },
];

console.log('Testing xTB xcontrol Diagnostic Rules');
console.log('═'.repeat(70));
console.log();

let totalTests = 0;
let passedTests = 0;

for (const testCase of testCases) {
  totalTests++;
  console.log(`Test: ${testCase.name}`);
  console.log('─'.repeat(70));
  console.log('Code:');
  console.log(testCase.code);
  console.log();

  try {
    const parsedDoc = parseXtbDocument(testCase.code, defaultXtbSchema);
    const diagnostics = validateDocument(parsedDoc, defaultXtbSchema, defaultDiagnosticConfig);

    console.log(`Found ${diagnostics.length} diagnostic(s):`);
    if (diagnostics.length > 0) {
      diagnostics.forEach((diag, i) => {
        const severityName = ['Error', 'Warning', 'Info', 'Hint'][diag.severity! - 1];
        console.log(`  ${i + 1}. [${severityName}] ${diag.message}`);
        console.log(`     Code: ${diag.code}, Line: ${diag.range.start.line + 1}`);
      });
    }

    // Check if diagnostics match expectations
    const foundCodes = diagnostics.map((d) => {
      const code = d.code as string;
      return code.replace('xtb.', '');
    });

    const expectedSet = new Set(testCase.expectedDiagnostics);
    const foundSet = new Set(foundCodes);

    let passed = true;
    for (const expected of expectedSet) {
      if (!foundSet.has(expected)) {
        console.log(`  ❌ Missing expected diagnostic: ${expected}`);
        passed = false;
      }
    }

    for (const found of foundSet) {
      if (!expectedSet.has(found)) {
        console.log(`  ⚠️  Unexpected diagnostic: ${found}`);
      }
    }

    if (passed && expectedSet.size === foundSet.size) {
      console.log('  ✅ Test PASSED');
      passedTests++;
    } else {
      console.log('  ❌ Test FAILED');
    }
  } catch (error) {
    console.log(`  ❌ Test FAILED with error: ${error}`);
  }

  console.log();
}

console.log('═'.repeat(70));
console.log(`Results: ${passedTests}/${totalTests} tests passed`);
if (passedTests === totalTests) {
  console.log('✅ All diagnostic rules working correctly!');
} else {
  console.log('❌ Some tests failed');
}
