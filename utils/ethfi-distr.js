const fs = require('fs');
const csv = require('csv-parse/sync');

// Constants
const INPUT_FILE = './script/data/ETHFI_finalv2_distribution.csv';
const OUTPUT_FILE = './script/data/ETHFI_finalv2_distribution.json';

try {
  // Read the CSV file
  const input = fs.readFileSync(INPUT_FILE, 'utf8');

  // Parse the CSV data
  const records = csv.parse(input, {
    columns: true,
    skip_empty_lines: true,
  });

  // Validate CSV data
  if (!records.length || !records[0].wallet || !records[0].ETHFI) {
    throw new Error('Invalid CSV format: missing required columns (wallet, ETHFI).');
  }

  // Create the output object
  const output = {};
  let totalTokens = 0n;

  records.forEach((record) => {
    const wallet = record['wallet'];
    const amountStr = record['ETHFI'];

    // Validate wallet address
    if (!wallet || !wallet.startsWith('0x') || wallet.length !== 42) {
      console.error(`Invalid wallet address: ${wallet}`);
      return; // Skip this record
    }

    // Convert amount to BigInt (1e18 precision)
    const amount = BigInt(Math.round(parseFloat(amountStr.replace(/,/g, '')) * 1e18));

    // Update total tokens
    totalTokens += amount;

    // Add to output if wallet and amount are valid
    if (amount > 0n) {
      output[wallet] = amount.toString();
    }
  });

  // Write the output to a JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  // Log success
  console.log(`Total records processed: ${records.length}`);
  console.log(`Total tokens distributed: ${totalTokens.toString()}`);
  console.log(`Conversion complete. Check ${OUTPUT_FILE} for the result.`);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
