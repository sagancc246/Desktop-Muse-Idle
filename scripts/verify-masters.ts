import { validateCsvMasters } from './master-csv-utils';

const result = validateCsvMasters();

if (result.errors.length > 0) {
  for (const error of result.errors) {
    console.error(`CSV master error: ${error}`);
  }
  console.error(`CSV master validation failed with ${result.errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log('CSV master validation passed');
}
