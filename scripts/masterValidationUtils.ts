export interface ValidationReport {
  errors: string[];
  warnings: string[];
}

export function addError(report: ValidationReport, scope: string, message: string): void {
  report.errors.push(`[${scope}] ${message}`);
}

export function addWarning(report: ValidationReport, scope: string, message: string): void {
  report.warnings.push(`[${scope}] ${message}`);
}

export function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates].sort();
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
