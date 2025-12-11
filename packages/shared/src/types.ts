/**
 * Core type definitions for xTB xcontrol parsing and schema
 */

/**
 * Position in a text document
 */
export interface Position {
  line: number; // 0-based
  character: number; // 0-based
}

/**
 * Range in a text document
 */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Type of instruction
 */
export enum InstructionKind {
  /** Logical instruction (single line, no body) */
  Logical = 'logical',
  /** Group instruction (has body, needs $end) */
  Group = 'group',
  /** End marker ($end) */
  End = 'end',
}

/**
 * Type of option
 */
export enum OptionKind {
  /** Single-value option (should appear at most once) */
  Single = 'single',
  /** List option (can appear multiple times) */
  List = 'list',
}

/**
 * Operator used in option assignment
 */
export enum OptionOperator {
  /** Equals sign (=) */
  Equals = '=',
  /** Colon (:) */
  Colon = ':',
}

/**
 * Parsed option node
 */
export interface OptionNode {
  key: string;
  operator: OptionOperator;
  value: string;
  range: Range;
}

/**
 * Parsed instruction node
 */
export interface InstructionNode {
  name: string; // Full name including $
  baseName: string; // Name without $
  kind: InstructionKind;
  range: Range;
  options: OptionNode[];
  bodyStartLine?: number; // Line where instruction body starts
  bodyEndLine?: number; // Line where instruction body ends (or file ends)
  hasExplicitEnd?: boolean; // Whether $end was found
}

/**
 * Parsed xcontrol document
 */
export interface ParsedDocument {
  instructions: InstructionNode[];
  orphanOptions: OptionNode[]; // Options outside any instruction
  errors: ParseError[];
}

/**
 * Parse error
 */
export interface ParseError {
  message: string;
  range: Range;
  severity: 'error' | 'warning' | 'info' | 'hint';
}
