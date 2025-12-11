/**
 * xTB instruction and option schema definitions
 */

import { InstructionKind, OptionKind, OptionOperator } from './types';

/**
 * Specification for an option within an instruction
 */
export interface XtbOptionSpec {
  /** Option key name */
  key: string;
  /** Whether option can appear multiple times */
  kind: OptionKind;
  /** Preferred operator (= or :) */
  preferredOperator?: OptionOperator;
  /** Brief description */
  description?: string;
}

/**
 * Specification for an instruction
 */
export interface XtbInstructionSpec {
  /** Instruction name without $ */
  name: string;
  /** Type of instruction */
  kind: InstructionKind;
  /** List of valid options */
  options: XtbOptionSpec[];
  /** Brief description */
  description?: string;
}

/**
 * Complete xTB schema
 */
export interface XtbSchema {
  instructions: XtbInstructionSpec[];
}

/**
 * Default xTB schema with common instructions
 * This will be expanded in Phase 3
 */
export const defaultXtbSchema: XtbSchema = {
  instructions: [
    {
      name: 'fix',
      kind: InstructionKind.Group,
      description: 'Fix atoms or groups during optimization',
      options: [
        {
          key: 'atoms',
          kind: OptionKind.List,
          preferredOperator: OptionOperator.Colon,
          description: 'List of atoms to fix',
        },
        {
          key: 'elements',
          kind: OptionKind.List,
          preferredOperator: OptionOperator.Colon,
          description: 'Element types to fix',
        },
      ],
    },
    {
      name: 'constrain',
      kind: InstructionKind.Group,
      description: 'Apply geometric constraints',
      options: [
        {
          key: 'atoms',
          kind: OptionKind.List,
          preferredOperator: OptionOperator.Colon,
          description: 'Atoms involved in constraint',
        },
        {
          key: 'distance',
          kind: OptionKind.List,
          preferredOperator: OptionOperator.Colon,
          description: 'Distance constraint',
        },
        {
          key: 'angle',
          kind: OptionKind.List,
          preferredOperator: OptionOperator.Colon,
          description: 'Angle constraint',
        },
        {
          key: 'dihedral',
          kind: OptionKind.List,
          preferredOperator: OptionOperator.Colon,
          description: 'Dihedral angle constraint',
        },
      ],
    },
    {
      name: 'wall',
      kind: InstructionKind.Group,
      description: 'Define confining potential',
      options: [
        {
          key: 'potential',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Potential type',
        },
        {
          key: 'sphere',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Colon,
          description: 'Spherical wall parameters',
        },
        {
          key: 'ellipsoid',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Colon,
          description: 'Ellipsoidal wall parameters',
        },
        {
          key: 'alpha',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Alpha parameter',
        },
        {
          key: 'beta',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Beta parameter',
        },
        {
          key: 'temp',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Temperature',
        },
      ],
    },
    {
      name: 'write',
      kind: InstructionKind.Group,
      description: 'Control output file generation',
      options: [
        {
          key: 'charges',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Write atomic charges',
        },
        {
          key: 'wiberg',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Write Wiberg bond orders',
        },
        {
          key: 'distances',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Write distances',
        },
        {
          key: 'gbsa',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Write GBSA information',
        },
        {
          key: 'gfn2',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Write GFN2 information',
        },
      ],
    },
    {
      name: 'opt',
      kind: InstructionKind.Group,
      description: 'Optimization settings',
      options: [
        {
          key: 'maxcycle',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Maximum optimization cycles',
        },
        {
          key: 'microcycle',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Maximum micro cycles',
        },
        {
          key: 'engine',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Optimization engine (rf, lbfgs)',
        },
        {
          key: 'optlevel',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Colon,
          description: 'Optimization level',
        },
        {
          key: 'logfile',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Log file name',
        },
      ],
    },
    {
      name: 'scan',
      kind: InstructionKind.Group,
      description: 'Coordinate scanning',
      options: [
        {
          key: 'distance',
          kind: OptionKind.List,
          preferredOperator: OptionOperator.Colon,
          description: 'Distance to scan',
        },
        {
          key: 'angle',
          kind: OptionKind.List,
          preferredOperator: OptionOperator.Colon,
          description: 'Angle to scan',
        },
        {
          key: 'dihedral',
          kind: OptionKind.List,
          preferredOperator: OptionOperator.Colon,
          description: 'Dihedral to scan',
        },
        {
          key: 'start',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Start value',
        },
        {
          key: 'end',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'End value',
        },
        {
          key: 'steps',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Number of steps',
        },
      ],
    },
    {
      name: 'hess',
      kind: InstructionKind.Group,
      description: 'Hessian calculation settings',
      options: [
        {
          key: 'sccacc',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'SCC accuracy',
        },
      ],
    },
    {
      name: 'gfn',
      kind: InstructionKind.Group,
      description: 'GFN method settings',
      options: [
        {
          key: 'method',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'GFN method (gfn1, gfn2, gfnff)',
        },
      ],
    },
    {
      name: 'metadyn',
      kind: InstructionKind.Group,
      description: 'Metadynamics settings',
      options: [
        {
          key: 'atoms',
          kind: OptionKind.List,
          preferredOperator: OptionOperator.Colon,
          description: 'Atoms for metadynamics',
        },
        {
          key: 'kpush',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Push strength',
        },
        {
          key: 'alpha',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Alpha parameter',
        },
      ],
    },
    {
      name: 'scc',
      kind: InstructionKind.Group,
      description: 'Self-consistent charge settings',
      options: [
        {
          key: 'maxiter',
          kind: OptionKind.Single,
          preferredOperator: OptionOperator.Equals,
          description: 'Maximum SCC iterations',
        },
      ],
    },
    {
      name: 'chrg',
      kind: InstructionKind.Logical,
      description: 'Set molecular charge',
      options: [],
    },
    {
      name: 'spin',
      kind: InstructionKind.Logical,
      description: 'Set spin state',
      options: [],
    },
    {
      name: 'cmd',
      kind: InstructionKind.Logical,
      description: 'Specify command',
      options: [],
    },
    {
      name: 'date',
      kind: InstructionKind.Logical,
      description: 'Date information',
      options: [],
    },
    {
      name: 'end',
      kind: InstructionKind.End,
      description: 'End marker for group instructions',
      options: [],
    },
  ],
};

/**
 * Find instruction specification by name
 */
export function findInstructionSpec(
  schema: XtbSchema,
  name: string
): XtbInstructionSpec | undefined {
  return schema.instructions.find((inst) => inst.name === name);
}

/**
 * Find option specification within an instruction
 */
export function findOptionSpec(
  instructionSpec: XtbInstructionSpec,
  optionKey: string
): XtbOptionSpec | undefined {
  return instructionSpec.options.find((opt) => opt.key === optionKey);
}
