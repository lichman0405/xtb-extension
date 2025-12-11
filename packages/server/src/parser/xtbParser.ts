/**
 * Parser for xTB xcontrol files
 * Converts lexed tokens into structured document with instruction nodes
 */

import {
  ParsedDocument,
  InstructionNode,
  OptionNode,
  ParseError,
  InstructionKind,
  XtbSchema,
} from '@xtb-xcontrol/shared';
import { findInstructionSpec } from '@xtb-xcontrol/shared';
import {
  lexXtbDocument,
  LexResult,
  LineTokenKind,
  InstructionLineToken,
  OptionLineToken,
  AnyLineToken,
} from './xtbLexer';

/**
 * Parser state for tracking context during parsing
 */
interface ParserState {
  tokens: AnyLineToken[];
  currentIndex: number;
  instructions: InstructionNode[];
  orphanOptions: OptionNode[];
  errors: ParseError[];
  currentInstruction: InstructionNode | null;
  schema: XtbSchema;
}

/**
 * Check if we're currently inside an instruction body
 */
function isInInstructionBody(state: ParserState): boolean {
  return state.currentInstruction !== null;
}

/**
 * Get the instruction kind from schema
 */
function getInstructionKind(schema: XtbSchema, baseName: string): InstructionKind {
  const spec = findInstructionSpec(schema, baseName);
  if (spec) {
    return spec.kind;
  }
  // Default to group if unknown
  return InstructionKind.Group;
}

/**
 * Close the current instruction
 */
function closeCurrentInstruction(state: ParserState, endLine: number, hasExplicitEnd: boolean) {
  if (state.currentInstruction) {
    state.currentInstruction.bodyEndLine = endLine;
    state.currentInstruction.hasExplicitEnd = hasExplicitEnd;
    state.instructions.push(state.currentInstruction);
    state.currentInstruction = null;
  }
}

/**
 * Process an instruction token
 */
function processInstructionToken(state: ParserState, token: InstructionLineToken) {
  const { baseName, fullName, lineNumber, range } = token;

  // Check if this is an $end token
  if (baseName === 'end') {
    if (state.currentInstruction) {
      // Close the current instruction with explicit $end
      closeCurrentInstruction(state, lineNumber - 1, true);
    } else {
      // $end without a matching instruction
      state.errors.push({
        message: '$end without matching group instruction',
        range,
        severity: 'warning',
      });
    }
    return;
  }

  // If we have a current instruction that's not closed, close it implicitly
  if (state.currentInstruction) {
    closeCurrentInstruction(state, lineNumber - 1, false);
  }

  // Get instruction kind from schema
  const kind = getInstructionKind(state.schema, baseName);

  // Create new instruction node
  const instruction: InstructionNode = {
    name: fullName,
    baseName,
    kind,
    range,
    options: [],
    bodyStartLine: lineNumber,
  };

  // If it's a logical instruction, it has no body - close it immediately
  if (kind === InstructionKind.Logical) {
    instruction.bodyEndLine = lineNumber;
    instruction.hasExplicitEnd = false;
    state.instructions.push(instruction);
    state.currentInstruction = null;
  } else {
    // Group instruction - keep it open
    state.currentInstruction = instruction;
  }
}

/**
 * Process an option token
 */
function processOptionToken(state: ParserState, token: OptionLineToken) {
  const { key, operator, value, range, keyRange } = token;

  const option: OptionNode = {
    key,
    operator,
    value,
    range,
  };

  if (isInInstructionBody(state)) {
    // Add to current instruction
    state.currentInstruction!.options.push(option);
  } else {
    // Orphan option (outside any instruction)
    state.orphanOptions.push(option);
    state.errors.push({
      message: `Option '${key}' appears outside of any instruction block`,
      range: keyRange,
      severity: 'error',
    });
  }
}

/**
 * Parse lexed tokens into a structured document
 */
function parseTokens(lexResult: LexResult, schema: XtbSchema): ParsedDocument {
  const state: ParserState = {
    tokens: lexResult.tokens,
    currentIndex: 0,
    instructions: [],
    orphanOptions: [],
    errors: [],
    currentInstruction: null,
    schema,
  };

  // Process each token
  for (let i = 0; i < state.tokens.length; i++) {
    const token = state.tokens[i];

    switch (token.kind) {
      case LineTokenKind.Instruction:
        processInstructionToken(state, token);
        break;

      case LineTokenKind.Option:
        processOptionToken(state, token);
        break;

      case LineTokenKind.Blank:
      case LineTokenKind.Comment:
        // Skip blank lines and comments
        break;

      case LineTokenKind.Unknown:
        // Unknown line - could add error if needed
        break;
    }
  }

  // If there's still an open instruction, close it at end of file
  if (state.currentInstruction) {
    closeCurrentInstruction(state, state.tokens.length - 1, false);
  }

  return {
    instructions: state.instructions,
    orphanOptions: state.orphanOptions,
    errors: state.errors,
  };
}

/**
 * Parse an xTB xcontrol document
 * Main entry point for parsing
 */
export function parseXtbDocument(text: string, schema: XtbSchema): ParsedDocument {
  // First, lex the document into tokens
  const lexResult = lexXtbDocument(text);

  // Then parse the tokens into a structured document
  const parsedDoc = parseTokens(lexResult, schema);

  return parsedDoc;
}

/**
 * Get all instructions of a specific kind
 */
export function getInstructionsByKind(
  doc: ParsedDocument,
  kind: InstructionKind
): InstructionNode[] {
  return doc.instructions.filter((inst) => inst.kind === kind);
}

/**
 * Find instruction by base name
 */
export function findInstruction(doc: ParsedDocument, baseName: string): InstructionNode | null {
  return doc.instructions.find((inst) => inst.baseName === baseName) || null;
}

/**
 * Get all options from an instruction with a specific key
 */
export function getOptionsWithKey(instruction: InstructionNode, key: string): OptionNode[] {
  return instruction.options.filter((opt) => opt.key === key);
}
