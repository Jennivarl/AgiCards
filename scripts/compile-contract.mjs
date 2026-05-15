import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const rootDir = process.cwd();
const contractPath = path.join(rootDir, "contracts", "AgiCardsRegistry.sol");
const outDir = path.join(rootDir, "artifacts");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "AgiCardsRegistry.sol": {
      content: source
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"]
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors ?? [];
const fatalErrors = errors.filter((error) => error.severity === "error");

for (const error of errors) {
  const stream = error.severity === "error" ? process.stderr : process.stdout;
  stream.write(`${error.formattedMessage}\n`);
}

if (fatalErrors.length > 0) {
  process.exit(1);
}

const artifact = output.contracts["AgiCardsRegistry.sol"].AgiCardsRegistry;
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "AgiCardsRegistry.json"),
  JSON.stringify(
    {
      contractName: "AgiCardsRegistry",
      abi: artifact.abi,
      bytecode: `0x${artifact.evm.bytecode.object}`
    },
    null,
    2
  )
);

console.log("Compiled contracts/AgiCardsRegistry.sol -> artifacts/AgiCardsRegistry.json");
