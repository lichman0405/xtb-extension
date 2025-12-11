# Code Snippets Reference

## Available Snippets

All snippets start with the prefix `xtb.` and provide IntelliSense completion with tab stops for easy editing.

### Basic Instructions

#### `xtb.chrg` - Set Charge

```
$chrg 0
```

Sets the molecular charge.

#### `xtb.spin` - Set Spin

```
$spin 0
```

Sets the spin state (number of unpaired electrons).

#### `xtb.cmd` - Command

```
$cmd xtb coord --opt
```

Specify xTB command to execute.

---

### Group Instructions

#### `xtb.fix` - Fix Atoms Block

```
$fix
   atoms: 1-5
   elements: C,H
$end
```

Fix atoms during optimization. Press Tab to navigate between fields.

#### `xtb.constrain` - Geometric Constraints

```
$constrain
   distance: 1,2,2.5
$end
```

Add geometric constraints. First tab stop lets you choose constraint type (distance/angle/dihedral).

#### `xtb.wall` - Confining Potential

```
$wall
   potential=logfermi
   sphere: auto,30
   alpha=1.0
   beta=6
   temp=300
$end
```

Define confining wall potential. Tab stops for all common parameters.

#### `xtb.opt` - Optimization Settings

```
$opt
   maxcycle=200
   engine=rf
   optlevel: normal
$end
```

Configure optimization parameters with dropdown choices for engine and optlevel.

#### `xtb.write` - Output Control

```
$write
   charges=true
$end
```

Control output file generation.

---

### Advanced Instructions

#### `xtb.scan` - Coordinate Scan

```
$scan
   distance: 1,2
   start=1.0
   end=3.0
   steps=20
$end
```

Set up coordinate scanning.

#### `xtb.gfn` - GFN Method

```
$gfn
   method=gfn2
$end
```

Choose GFN method (gfn2, gfn1, gfnff).

#### `xtb.metadyn` - Metadynamics

```
$metadyn
   atoms: 1-10
   kpush=0.01
   alpha=1.0
$end
```

Configure metadynamics simulation.

#### `xtb.hess` - Hessian Calculation

```
$hess
   sccacc=1.0
$end
```

Set up Hessian calculation.

---

### Constraint Helpers

#### `xtb.distance` - Distance Constraint

```
distance: atom1,atom2,distance
```

Add inside a `$constrain` block.

#### `xtb.angle` - Angle Constraint

```
angle: atom1,atom2,atom3,angle
```

Add inside a `$constrain` block.

#### `xtb.dihedral` - Dihedral Constraint

```
dihedral: atom1,atom2,atom3,atom4,angle
```

Add inside a `$constrain` block.

---

### Complete Templates

#### `xtb.template` - Full xcontrol Template

Complete file template with all common sections:

- Charge and spin
- Fixed atoms
- Geometric constraints
- Wall potential
- Optimization settings
- Output control

#### `xtb.simple` - Simple Optimization

Minimal template for basic optimization:

```
# Simple optimization

$chrg 0
$spin 0

$opt
   maxcycle=200
$end
```

#### `xtb.constrained` - Constrained Optimization

Template for optimization with constraints:

```
# Constrained optimization

$chrg 0
$spin 0

$fix
   atoms: 1-5
$end

$constrain
   distance: 6,7,2.5
$end

$opt
   maxcycle=200
$end
```

---

## Usage Tips

1. **Start typing `xtb.`** in an xcontrol file to see all available snippets
2. **Press Tab** to move between placeholder fields
3. **Press Enter** to accept the current placeholder
4. **Use dropdown choices** where available (indicated by `|` in the snippet definition)
5. **Combine snippets** - use constraint helpers inside `$constrain` blocks

## Examples

### Creating a fixed-atom optimization:

1. Type `xtb.chrg` → Tab → Enter charge
2. Type `xtb.spin` → Tab → Enter spin
3. Type `xtb.fix` → Tab through atom selection
4. Type `xtb.opt` → Configure optimization

### Adding multiple constraints:

1. Type `xtb.constrain` → Enter
2. Type `xtb.distance` → Add first constraint
3. Type `xtb.angle` → Add second constraint
4. Continue as needed
5. Don't forget `$end` (included in `xtb.constrain`)

---

## Snippet List Quick Reference

| Prefix            | Description              |
| ----------------- | ------------------------ |
| `xtb.chrg`        | Set charge               |
| `xtb.spin`        | Set spin                 |
| `xtb.cmd`         | Command                  |
| `xtb.fix`         | Fix atoms block          |
| `xtb.constrain`   | Constraint block         |
| `xtb.distance`    | Distance constraint      |
| `xtb.angle`       | Angle constraint         |
| `xtb.dihedral`    | Dihedral constraint      |
| `xtb.wall`        | Wall potential           |
| `xtb.opt`         | Optimization settings    |
| `xtb.write`       | Output control           |
| `xtb.scan`        | Coordinate scan          |
| `xtb.gfn`         | GFN method               |
| `xtb.symmetry`    | Symmetry                 |
| `xtb.embedding`   | Embedding                |
| `xtb.hess`        | Hessian                  |
| `xtb.metadyn`     | Metadynamics             |
| `xtb.template`    | Full template            |
| `xtb.simple`      | Simple optimization      |
| `xtb.constrained` | Constrained optimization |
