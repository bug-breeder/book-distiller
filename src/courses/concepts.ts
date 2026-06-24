import type { ConceptRecord } from './types.js';

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
