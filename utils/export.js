const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dirPath = './src'; // Replace with your actual directory path
const network = process.argv[2];
const EXCLUDED_CONTRACTS = new Set([
  'KintoWallet', 'IBridge', 'IController', 'IConnector', 'ISocket', 'IHook', 'BridgedToken', 'AccessPoint'
]);

if (!network) {
  console.error('Network argument is missing.');
  process.exit(1);
}

console.log(`Exporting contracts for network: ${network}\n`);

const addressesPath = `./test/artifacts/${network}/addresses.json`;
if (!fs.existsSync(addressesPath)) {
  console.error(`Addresses file not found at ${addressesPath}`);
  process.exit(1);
}

let addresses;
try {
  const rawData = fs.readFileSync(addressesPath, 'utf-8');
  addresses = JSON.parse(rawData);
} catch (error) {
  console.error(`Error reading or parsing addresses file: ${error.message}`);
  process.exit(1);
}

let contracts = {};

/**
 * Processes a single .sol file to extract its ABI and address.
 * @param {string} filePath - Path of the Solidity file.
 * @param {string} contractName - Name of the contract.
 */
function processSolidityFile(filePath, contractName) {
  const cmd = `forge inspect ${filePath}:${contractName} abi`;
  try {
    const result = execSync(cmd).toString();
    const jsonObject = JSON.parse(result);
    console.log(`Processing: ${contractName}`);
    const address = addresses[contractName];
    if ((!address || address.length < 8) && !EXCLUDED_CONTRACTS.has(contractName)) {
      console.error(`* Missing address for ${contractName}`);
    } else {
      console.log(`Exported: ${contractName} ABI`);
      contracts[contractName] = { abi: jsonObject, address: address };
    }
  } catch (error) {
    console.error(`Error executing command: ${cmd}`, error.message);
  }
}

/**
 * Processes a directory containing .sol files.
 * @param {string} dir - Directory to process.
 */
function processDirectory(dir) {
  const dirFiles = fs.readdirSync(dir, { withFileTypes: true });
  dirFiles.forEach(file => {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      processDirectory(filePath); // Recursively process subdirectories
    } else if (file.isFile() && path.extname(filePath) === '.sol' && !filePath.includes('Structs.sol')) {
      const contractName = path.basename(filePath, '.sol');
      processSolidityFile(filePath, contractName);
    }
  });
}

/**
 * Processes all .sol files in the specified directory and its subdirectories.
 */
function processFiles() {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  files.forEach(file => {
    const filePath = path.join(dirPath, file.name);
    if (file.isDirectory() && !filePath.includes('interfaces') && !filePath.includes('libraries')) {
      processDirectory(filePath);
    } else if (file.isFile() && path.extname(filePath) === '.sol') {
      const contractName = path.basename(filePath, '.sol');
      processSolidityFile(filePath, contractName);
    }
  });
}

processFiles();

const outputDir = './artifacts';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const jsonString = JSON.stringify({ contracts }, null, 2);
fs.writeFileSync(`${outputDir}/${network}.json`, jsonString);

console.log(`Total contracts processed: ${Object.keys(contracts).length}`);
console.log(`Exported contracts written to ${outputDir}/${network}.json`);
