import type { ConceptRecord } from './types.js';
import { BLOOM_LEVELS } from './types.js';
import type { CourseValidationFinding } from './types.js';
import fs from 'fs-extra';
import path from 'node:path';

const EXPECTED_HEADER = 'ConceptID,ConceptLabel,Dependencies,TaxonomyID,Bloom';

export function parseConceptsCsv(text: string): ConceptRecord[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) throw new Error('concepts.csv is empty');
  if (lines[0].trim() !== EXPECTED_HEADER) {
    throw new Error(`concepts.csv header must be exactly: ${EXPECTED_HEADER}`);
  }
  const records: ConceptRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length !== 5) {
      throw new Error(`concepts.csv row ${i + 1} must have 5 columns (ConceptLabel may not contain a comma)`);
    }
    const [idStr, label, depStr, taxStr, bloom] = cols.map((c) => c.trim());
    const dependencies = depStr === ''
      ? []
      : depStr.split('|').map((d) => Number(d.trim()));
    records.push({
      id: Number(idStr),
      label,
      dependencies,
      taxonomyId: Number(taxStr),
      bloom,
    });
  }
  return records;
}

export function validateConceptDag(records: ConceptRecord[]): CourseValidationFinding[] {
  const findings: CourseValidationFinding[] = [];
  const err = (message: string) => findings.push({ level: 'error', message });

  // Duplicate IDs.
  const seen = new Set<number>();
  for (const r of records) {
    if (seen.has(r.id)) err(`duplicate ConceptID ${r.id}`);
    seen.add(r.id);
  }
  const ids = new Set(records.map((r) => r.id));

  // Field validity + dependency targets.
  for (const r of records) {
    if (!Number.isInteger(r.id) || r.id <= 0) err(`ConceptID must be a positive integer (got "${r.id}")`);
    if (!Number.isInteger(r.taxonomyId) || r.taxonomyId <= 0) {
      err(`concept ${r.id} has a non-positive TaxonomyID`);
    }
    if (!(BLOOM_LEVELS as readonly string[]).includes(r.bloom)) {
      err(`concept ${r.id} has an invalid Bloom level "${r.bloom}"`);
    }
    for (const d of r.dependencies) {
      if (d === r.id) err(`concept ${r.id} depends on itself`);
      else if (!ids.has(d)) err(`concept ${r.id} depends on unknown ConceptID ${d}`);
    }
  }

  // Connectivity: a concept with no deps and no dependents is disconnected.
  if (records.length > 1) {
    const hasDependents = new Set<number>();
    for (const r of records) for (const d of r.dependencies) hasDependents.add(d);
    for (const r of records) {
      if (r.dependencies.length === 0 && !hasDependents.has(r.id)) {
        err(`concept ${r.id} ("${r.label}") is disconnected (no dependencies and nothing depends on it)`);
      }
    }
  }

  // Cycle detection (DFS over dependency edges).
  const byId = new Map(records.map((r) => [r.id, r]));
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<number, number>(records.map((r) => [r.id, WHITE]));
  let cycle = false;
  const visit = (id: number): void => {
    color.set(id, GRAY);
    for (const d of byId.get(id)?.dependencies ?? []) {
      if (!byId.has(d)) continue;
      const c = color.get(d);
      if (c === GRAY) cycle = true;
      else if (c === WHITE) visit(d);
    }
    color.set(id, BLACK);
  };
  for (const r of records) if (color.get(r.id) === WHITE) visit(r.id);
  if (cycle) err('concepts.csv contains a dependency cycle (must be a DAG)');

  return findings;
}

export async function runValidateConcepts(
  slug: string,
): Promise<{ findings: CourseValidationFinding[] }> {
  const csvPath = path.join('book-output', slug, 'concepts.csv');
  if (!(await fs.pathExists(csvPath))) {
    return { findings: [{ level: 'error', message: `not found: ${csvPath}` }] };
  }
  const text = await fs.readFile(csvPath, 'utf-8');
  let records: ConceptRecord[];
  try {
    records = parseConceptsCsv(text);
  } catch (e) {
    return { findings: [{ level: 'error', message: e instanceof Error ? e.message : String(e) }] };
  }
  return { findings: validateConceptDag(records) };
}
