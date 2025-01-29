const fs = require('fs');

// Constants
const SCALING_FACTOR = BigInt(1000000);
const INPUT_FILE = './script/data/enarewards.json';
const OUTPUT_FILE = './script/data/enarewardsfinal.json';

try {
    // Read and parse the input JSON file
    const rawData = fs.readFileSync(INPUT_FILE);
    const data = JSON.parse(rawData);

    // Extract amounts and wallets
    const amounts = data.enaRewardsUSD;
    const wallets = data.wallets;

    // Validate input data
    if (!amounts.length || !wallets.length || amounts.length !== wallets.length) {
        throw new Error('Invalid input data: amounts and wallets must be non-empty and of the same length.');
    }

    // Convert amounts to BigInt (scaled up to handle decimals)
    const amountsBigInt = amounts.map(amount => BigInt(Math.round(amount * Number(SCALING_FACTOR))));

    // Calculate the total amount in USD (scaled up)
    const totalUSDBigInt = amountsBigInt.reduce((acc, val) => acc + val, BigInt(0));

    // Total amount of tokens to distribute
    const totalTokens = BigInt("23952950190000000000000");

    // Calculate the share for each wallet in tokens
    const shares = {};
    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const amount = amountsBigInt[i];
        const share = (amount * totalTokens) / totalUSDBigInt; // Calculate share in tokens
        shares[wallet] = share.toString(); // Convert to string to handle large numbers
    }

    // Check if total distributed tokens exceed the total tokens available
    const totalDistributedTokens = Object.values(shares).reduce((acc, val) => acc + BigInt(val), BigInt(0));
    if (totalDistributedTokens > totalTokens) {
        throw new Error('Total distributed tokens exceed the total available tokens.');
    }

    // Write the results to a new JSON file
    const outputData = JSON.stringify(shares, null, 2);
    fs.writeFileSync(OUTPUT_FILE, outputData);

    // Log success
    console.log(`Total USD value (scaled): ${totalUSDBigInt}`);
    console.log(`Total tokens to distribute: ${totalTokens}`);
    console.log(`Number of wallets processed: ${wallets.length}`);
    console.log('Shares calculated and written to', OUTPUT_FILE);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
