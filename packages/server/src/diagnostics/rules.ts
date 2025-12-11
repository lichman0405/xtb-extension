/**
 * Diagnostic rules for xTB xcontrol validation
 * Implements the 6 core diagnostic rules from the specification
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import {
  ParsedDocument,
  InstructionNode,
  OptionNode,
  XtbSchema,
  OptionKind,
  InstructionKind,
  Range,
} from '@xtb-xcontrol/shared';
import { findInstructionSpec, findOptionSpec } from '@xtb-xcontrol/shared';

/**
 * Diagnostic configuration
 */
export interface DiagnosticConfig {
  unknownInstruction: DiagnosticSeverity | 'off';
  unknownOption: DiagnosticSeverity | 'off';
  suspiciousOperator: DiagnosticSeverity | 'off';
  duplicateOption: DiagnosticSeverity | 'off';
  orphanOption: DiagnosticSeverity | 'off';
  missingEnd: DiagnosticSeverity | 'off';
}

/**
 * Default diagnostic configuration
 */
export const defaultDiagnosticConfig: DiagnosticConfig = {
  unknownInstruction: DiagnosticSeverity.Error,
  unknownOption: DiagnosticSeverity.Warning,
  suspiciousOperator: DiagnosticSeverity.Warning,
  duplicateOption: DiagnosticSeverity.Warning,
  orphanOption: DiagnosticSeverity.Error,
  missingEnd: DiagnosticSeverity.Hint,
};

/**
 * Convert VS Code range to LSP range
 */
function toLspRange(range: Range): {
  start: { line: number; character: number };
  end: { line: number; character: number };
} {
  return {
    start: { line: range.start.line, character: range.start.character },
    end: { line: range.end.line, character: range.end.character },
  };
}

/**
 * Create a diagnostic
 */
function createDiagnostic(
  message: string,
  range: Range,
  severity: DiagnosticSeverity,
  code: string
): Diagnostic {
  return {
    severity,
    range: toLspRange(range),
    message,
    source: 'xtb-xcontrol',
    code,
  };
}

/**
 * Rule R1: Unknown Instruction
 * Checks if instruction name exists in schema
 */
export function checkUnknownInstruction(
  instruction: InstructionNode,
  schema: XtbSchema,
  config: DiagnosticConfig
): Diagnostic | null {
  if (config.unknownInstruction === 'off') return null;

  const spec = findInstructionSpec(schema, instruction.baseName);
  if (!spec) {
    return createDiagnostic(
      `Unknown instruction '${instruction.name}'. This instruction is not recognized in the xTB schema.`,
      instruction.range,
      config.unknownInstruction as DiagnosticSeverity,
      'xtb.unknownInstruction'
    );
  }
  return null;
}

/**
 * Rule R2: Unknown Option Key
 * Checks if option key is valid for the instruction
 */
export function checkUnknownOption(
  instruction: InstructionNode,
  option: OptionNode,
  schema: XtbSchema,
  config: DiagnosticConfig
): Diagnostic | null {
  if (config.unknownOption === 'off') return null;

  const instructionSpec = findInstructionSpec(schema, instruction.baseName);
  if (!instructionSpec) return null; // Already handled by R1

  const optionSpec = findOptionSpec(instructionSpec, option.key);
  if (!optionSpec) {
    return createDiagnostic(
      `Unknown option '${option.key}' for instruction '${instruction.name}'. This option is not recognized.`,
      option.range,
      config.unknownOption as DiagnosticSeverity,
      'xtb.unknownOption'
    );
  }
  return null;
}

/**
 * Rule R3: Suspicious Operator
 * Checks if the operator matches the preferred operator for the option
 */
export function checkSuspiciousOperator(
  instruction: InstructionNode,
  option: OptionNode,
  schema: XtbSchema,
  config: DiagnosticConfig
): Diagnostic | null {
  if (config.suspiciousOperator === 'off') return null;

  const instructionSpec = findInstructionSpec(schema, instruction.baseName);
  if (!instructionSpec) return null;

  const optionSpec = findOptionSpec(instructionSpec, option.key);
  if (!optionSpec || !optionSpec.preferredOperator) return null;

  if (option.operator !== optionSpec.preferredOperator) {
    const preferred = optionSpec.preferredOperator;
    const used = option.operator;
    return createDiagnostic(
      `Suspicious operator '${used}' for option '${option.key}'. The preferred operator is '${preferred}'.`,
      option.range,
      config.suspiciousOperator as DiagnosticSeverity,
      'xtb.suspiciousOperator'
    );
  }
  return null;
}

/**
 * Rule R4: Duplicate Single-Assignment Option
 * Checks if a single-value option appears multiple times
 */
export function checkDuplicateOption(
  instruction: InstructionNode,
  schema: XtbSchema,
  config: DiagnosticConfig
): Diagnostic[] {
  if (config.duplicateOption === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  const instructionSpec = findInstructionSpec(schema, instruction.baseName);
  if (!instructionSpec) return diagnostics;

  // Track occurrences of each option key
  const optionOccurrences = new Map<string, OptionNode[]>();

  for (const option of instruction.options) {
    if (!optionOccurrences.has(option.key)) {
      optionOccurrences.set(option.key, []);
    }
    optionOccurrences.get(option.key)!.push(option);
  }

  // Check for duplicates in single-value options
  for (const [key, occurrences] of optionOccurrences.entries()) {
    if (occurrences.length > 1) {
      const optionSpec = findOptionSpec(instructionSpec, key);
      if (optionSpec && optionSpec.kind === OptionKind.Single) {
        // Report on all occurrences except the first
        for (let i = 1; i < occurrences.length; i++) {
          const option = occurrences[i];
          diagnostics.push(
            createDiagnostic(
              `Duplicate option '${key}'. This option should only appear once in '${instruction.name}'.`,
              option.range,
              config.duplicateOption as DiagnosticSeverity,
              'xtb.duplicateOption'
            )
          );
        }
      }
    }
  }

  return diagnostics;
}

/**
 * Rule R5: Orphan Option
 * Checks for options that appear outside any instruction block
 */
export function checkOrphanOptions(doc: ParsedDocument, config: DiagnosticConfig): Diagnostic[] {
  if (config.orphanOption === 'off') return [];

  const diagnostics: Diagnostic[] = [];

  for (const option of doc.orphanOptions) {
    diagnostics.push(
      createDiagnostic(
        `Orphan option '${option.key}'. Options must appear inside an instruction block.`,
        option.range,
        config.orphanOption as DiagnosticSeverity,
        'xtb.orphanOption'
      )
    );
  }

  return diagnostics;
}

/**
 * Rule R6: Missing $end Terminator
 * Checks if group instructions are properly terminated with $end
 */
export function checkMissingEnd(
  instruction: InstructionNode,
  config: DiagnosticConfig
): Diagnostic | null {
  if (config.missingEnd === 'off') return null;

  if (instruction.kind === InstructionKind.Group && !instruction.hasExplicitEnd) {
    return createDiagnostic(
      `Group instruction '${instruction.name}' is not terminated with '$end'. Consider adding '$end' for clarity.`,
      instruction.range,
      config.missingEnd as DiagnosticSeverity,
      'xtb.missingEnd'
    );
  }
  return null;
}

/**
 * Run all diagnostic checks on a parsed document
 */
export function validateDocument(
  doc: ParsedDocument,
  schema: XtbSchema,
  config: DiagnosticConfig
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // R5: Check orphan options
  diagnostics.push(...checkOrphanOptions(doc, config));

  // Check each instruction
  for (const instruction of doc.instructions) {
    // R1: Check unknown instruction
    const r1 = checkUnknownInstruction(instruction, schema, config);
    if (r1) diagnostics.push(r1);

    // R6: Check missing $end
    const r6 = checkMissingEnd(instruction, config);
    if (r6) diagnostics.push(r6);

    // R4: Check duplicate options
    diagnostics.push(...checkDuplicateOption(instruction, schema, config));

    // Check each option in the instruction
    for (const option of instruction.options) {
      // R2: Check unknown option
      const r2 = checkUnknownOption(instruction, option, schema, config);
      if (r2) diagnostics.push(r2);

      // R3: Check suspicious operator
      const r3 = checkSuspiciousOperator(instruction, option, schema, config);
      if (r3) diagnostics.push(r3);
    }
  }

  return diagnostics;
}
