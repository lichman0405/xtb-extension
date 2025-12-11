/**
 * Lexer for xTB xcontrol files
 * Tokenizes document line-by-line and classifies each line
 */

import { Position, Range, OptionOperator } from '@xtb-xcontrol/shared';

/**
 * Types of line tokens
 */
export enum LineTokenKind {
  /** Blank line or whitespace only */
  Blank = 'blank',
  /** Comment line (starts with #) */
  Comment = 'comment',
  /** Instruction line (starts with $) */
  Instruction = 'instruction',
  /** Option line (key: value or key = value) */
  Option = 'option',
  /** Unknown/invalid line */
  Unknown = 'unknown',
}

/**
 * Base interface for all line tokens
 */
export interface LineToken {
  kind: LineTokenKind;
  lineNumber: number; // 0-based
  range: Range;
  rawText: string;
}

/**
 * Blank line token
 */
export interface BlankLineToken extends LineToken {
  kind: LineTokenKind.Blank;
}

/**
 * Comment line token
 */
export interface CommentLineToken extends LineToken {
  kind: LineTokenKind.Comment;
  commentText: string; // Text after #
}

/**
 * Instruction line token
 */
export interface InstructionLineToken extends LineToken {
  kind: LineTokenKind.Instruction;
  fullName: string; // Full instruction including $
  baseName: string; // Instruction name without $
}

/**
 * Option line token
 */
export interface OptionLineToken extends LineToken {
  kind: LineTokenKind.Option;
  key: string;
  operator: OptionOperator;
  value: string;
  keyRange: Range;
  operatorRange: Range;
  valueRange: Range;
}

/**
 * Unknown line token
 */
export interface UnknownLineToken extends LineToken {
  kind: LineTokenKind.Unknown;
}

/**
 * Union type for all line tokens
 */
export type AnyLineToken =
  | BlankLineToken
  | CommentLineToken
  | InstructionLineToken
  | OptionLineToken
  | UnknownLineToken;

/**
 * Result of lexing a document
 */
export interface LexResult {
  tokens: AnyLineToken[];
  text: string;
}

/**
 * Regex patterns for lexing
 */
const PATTERNS = {
  // Blank line (whitespace only)
  blank: /^\s*$/,

  // Comment line (starts with # after optional whitespace)
  comment: /^\s*#(.*)$/,

  // Instruction line (starts with $ after optional whitespace)
  instruction: /^\s*\$([a-zA-Z][a-zA-Z0-9_-]*)\b/,

  // Option with colon operator: key: value
  optionColon: /^\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*(.*)$/,

  // Option with equals operator: key = value
  optionEquals: /^\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(.*)$/,
};

/**
 * Create a Position object
 */
function createPosition(line: number, character: number): Position {
  return { line, character };
}

/**
 * Create a Range object
 */
function createRange(
  startLine: number,
  startChar: number,
  endLine: number,
  endChar: number
): Range {
  return {
    start: createPosition(startLine, startChar),
    end: createPosition(endLine, endChar),
  };
}

/**
 * Strip inline comments from a value string
 */
function stripInlineComment(value: string): string {
  const commentIndex = value.indexOf('#');
  if (commentIndex !== -1) {
    return value.substring(0, commentIndex).trim();
  }
  return value.trim();
}

/**
 * Lex a single line
 */
function lexLine(text: string, lineNumber: number): AnyLineToken {
  const lineLength = text.length;
  const range = createRange(lineNumber, 0, lineNumber, lineLength);

  // Check for blank line
  if (PATTERNS.blank.test(text)) {
    return {
      kind: LineTokenKind.Blank,
      lineNumber,
      range,
      rawText: text,
    };
  }

  // Check for comment line
  const commentMatch = text.match(PATTERNS.comment);
  if (commentMatch) {
    return {
      kind: LineTokenKind.Comment,
      lineNumber,
      range,
      rawText: text,
      commentText: commentMatch[1],
    };
  }

  // Check for instruction line
  const instructionMatch = text.match(PATTERNS.instruction);
  if (instructionMatch) {
    const fullName = '$' + instructionMatch[1];
    return {
      kind: LineTokenKind.Instruction,
      lineNumber,
      range,
      rawText: text,
      fullName,
      baseName: instructionMatch[1],
    };
  }

  // Check for option with colon operator
  const colonMatch = text.match(PATTERNS.optionColon);
  if (colonMatch) {
    const key = colonMatch[1];
    const rawValue = colonMatch[2];
    const value = stripInlineComment(rawValue);

    const keyStart = text.indexOf(key);
    const colonPos = text.indexOf(':', keyStart);
    const valueStart = colonPos + 1;

    // Skip leading whitespace in value
    let valueActualStart = valueStart;
    while (valueActualStart < text.length && /\s/.test(text[valueActualStart])) {
      valueActualStart++;
    }

    return {
      kind: LineTokenKind.Option,
      lineNumber,
      range,
      rawText: text,
      key,
      operator: OptionOperator.Colon,
      value,
      keyRange: createRange(lineNumber, keyStart, lineNumber, keyStart + key.length),
      operatorRange: createRange(lineNumber, colonPos, lineNumber, colonPos + 1),
      valueRange: createRange(lineNumber, valueActualStart, lineNumber, lineLength),
    };
  }

  // Check for option with equals operator
  const equalsMatch = text.match(PATTERNS.optionEquals);
  if (equalsMatch) {
    const key = equalsMatch[1];
    const rawValue = equalsMatch[2];
    const value = stripInlineComment(rawValue);

    const keyStart = text.indexOf(key);
    const equalsPos = text.indexOf('=', keyStart);
    const valueStart = equalsPos + 1;

    // Skip leading whitespace in value
    let valueActualStart = valueStart;
    while (valueActualStart < text.length && /\s/.test(text[valueActualStart])) {
      valueActualStart++;
    }

    return {
      kind: LineTokenKind.Option,
      lineNumber,
      range,
      rawText: text,
      key,
      operator: OptionOperator.Equals,
      value,
      keyRange: createRange(lineNumber, keyStart, lineNumber, keyStart + key.length),
      operatorRange: createRange(lineNumber, equalsPos, lineNumber, equalsPos + 1),
      valueRange: createRange(lineNumber, valueActualStart, lineNumber, lineLength),
    };
  }

  // Unknown line type
  return {
    kind: LineTokenKind.Unknown,
    lineNumber,
    range,
    rawText: text,
  };
}

/**
 * Lex an entire xcontrol document
 */
export function lexXtbDocument(text: string): LexResult {
  const lines = text.split(/\r?\n/);
  const tokens: AnyLineToken[] = [];

  for (let i = 0; i < lines.length; i++) {
    const token = lexLine(lines[i], i);
    tokens.push(token);
  }

  return {
    tokens,
    text,
  };
}
