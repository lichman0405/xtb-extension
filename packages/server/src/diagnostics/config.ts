/**
 * Configuration management for diagnostic settings
 */

import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { DiagnosticConfig, defaultDiagnosticConfig } from './rules';

/**
 * User-facing configuration format (strings)
 */
export interface UserDiagnosticConfig {
  'xtbXcontrol.diagnostics.unknownInstruction'?: string;
  'xtbXcontrol.diagnostics.unknownOption'?: string;
  'xtbXcontrol.diagnostics.suspiciousOperator'?: string;
  'xtbXcontrol.diagnostics.duplicateOption'?: string;
  'xtbXcontrol.diagnostics.orphanOption'?: string;
  'xtbXcontrol.diagnostics.missingEnd'?: string;
}

/**
 * Parse severity string to DiagnosticSeverity or 'off'
 */
function parseSeverity(value: string | undefined): DiagnosticSeverity | 'off' {
  if (!value) return DiagnosticSeverity.Warning;

  switch (value.toLowerCase()) {
    case 'error':
      return DiagnosticSeverity.Error;
    case 'warning':
      return DiagnosticSeverity.Warning;
    case 'info':
    case 'information':
      return DiagnosticSeverity.Information;
    case 'hint':
      return DiagnosticSeverity.Hint;
    case 'off':
      return 'off';
    default:
      return DiagnosticSeverity.Warning;
  }
}

/**
 * Convert user configuration to internal format
 */
export function parseUserConfig(userConfig: UserDiagnosticConfig): DiagnosticConfig {
  return {
    unknownInstruction: parseSeverity(userConfig['xtbXcontrol.diagnostics.unknownInstruction']),
    unknownOption: parseSeverity(userConfig['xtbXcontrol.diagnostics.unknownOption']),
    suspiciousOperator: parseSeverity(userConfig['xtbXcontrol.diagnostics.suspiciousOperator']),
    duplicateOption: parseSeverity(userConfig['xtbXcontrol.diagnostics.duplicateOption']),
    orphanOption: parseSeverity(userConfig['xtbXcontrol.diagnostics.orphanOption']),
    missingEnd: parseSeverity(userConfig['xtbXcontrol.diagnostics.missingEnd']),
  };
}

/**
 * Merge user config with defaults
 */
export function getEffectiveConfig(userConfig?: UserDiagnosticConfig): DiagnosticConfig {
  if (!userConfig) {
    return { ...defaultDiagnosticConfig };
  }
  return parseUserConfig(userConfig);
}
