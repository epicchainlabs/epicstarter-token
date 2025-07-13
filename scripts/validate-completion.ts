import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface ValidationResult {
  category: string;
  checks: { [key: string]: boolean };
  score: number;
  issues: string[];
}

async function main() {
  console.log("🔍 EpicStarter Token - Project Completion Validation");
  console.log("═".repeat(60));

  const validationResults: ValidationResult[] = [];

  // 1. File Structure Validation
  console.log("\n📁 Validating File Structure...");
  const fileStructureResult = validateFileStructure();
  validationResults.push(fileStructureResult);
  printResult(fileStructureResult);

  // 2. Smart Contract Validation
  console.log("\n📄 Validating Smart Contracts...");
  const contractResult = await validateContracts();
  validationResults.push(contractResult);
  printResult(contractResult);

  // 3. Configuration Validation
  console.log("\n⚙️  Validating Configuration Files...");
  const configResult = validateConfiguration();
  validationResults.push(configResult);
  printResult(configResult);

  // 4. Test Structure Validation
  console.log("\n🧪 Validating Test Structure...");
  const testResult = validateTests();
  validationResults.push(testResult);
  printResult(testResult);

  // 5. Script Validation
  console.log("\n📜 Validating Scripts...");
  const scriptResult = validateScripts();
  validationResults.push(scriptResult);
  printResult(scriptResult);

  // 6. Documentation Validation
  console.log("\n📚 Validating Documentation...");
  const docResult = validateDocumentation();
  validationResults.push(docResult);
  printResult(docResult);

  // 7. Package.json Validation
  console.log("\n📦 Validating Package Configuration...");
  const packageResult = validatePackageJson();
  validationResults.push(packageResult);
  printResult(packageResult);

  // Calculate Overall Score
  const overallScore = calculateOverallScore(validationResults);

  console.log("\n" + "═".repeat(60));
  console.log("🏆 COMPLETION VALIDATION SUMMARY");
  console.log("═".repeat(60));

  validationResults.forEach(result => {
    const status = result.score >= 90 ? "✅" : result.score >= 70 ? "⚠️" : "❌";
    console.log(`${status} ${result.category}: ${result.score}%`);
  });

  console.log("\n📊 Overall Completion Score:", `${overallScore}%`);

  if (overallScore >= 95) {
    console.log("🎉 EXCELLENT! Project is fully complete and ready for production!");
  } else if (overallScore >= 85) {
    console.log("👍 GOOD! Minor issues remain but project is mostly complete.");
  } else if (overallScore >= 70) {
    console.log("⚠️  FAIR! Several components need completion.");
  } else {
    console.log("❌ INCOMPLETE! Significant work remains.");
  }

  // List all issues
  const allIssues = validationResults.flatMap(r => r.issues);
  if (allIssues.length > 0) {
    console.log("\n🔧 Issues to Address:");
    allIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }

  console.log("═".repeat(60));
}

function validateFileStructure(): ValidationResult {
  const requiredFiles = [
    "contracts/token/EpicStarterToken.sol",
    "contracts/interfaces/IEpicStarterToken.sol",
    "contracts/interfaces/IBurnable.sol",
    "contracts/interfaces/IPausable.sol",
    "contracts/extensions/BurnableExtension.sol",
    "contracts/extensions/PausableExtension.sol",
    "scripts/deploy.ts",
    "scripts/verify.ts",
    "scripts/simple-deploy.ts",
    "test/EpicStarterToken.test.ts",
    "utils/helpers.ts",
    "hardhat.config.ts",
    "package.json",
    "tsconfig.json",
    ".env.example",
    "README.md",
    "LICENSE",
    ".gitignore"
  ];

  const requiredDirs = [
    "contracts",
    "contracts/token",
    "contracts/interfaces",
    "contracts/extensions",
    "scripts",
    "test",
    "utils",
    "docs",
    "deployments"
  ];

  const checks: { [key: string]: boolean } = {};
  const issues: string[] = [];

  // Check files
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    checks[`File: ${file}`] = exists;
    if (!exists) {
      issues.push(`Missing file: ${file}`);
    }
  });

  // Check directories
  requiredDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    const exists = fs.existsSync(dirPath);
    checks[`Directory: ${dir}`] = exists;
    if (!exists) {
      issues.push(`Missing directory: ${dir}`);
    }
  });

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    category: "File Structure",
    checks,
    score,
    issues
  };
}

async function validateContracts(): ValidationResult {
  const checks: { [key: string]: boolean } = {};
  const issues: string[] = [];

  try {
    // Try to compile contracts
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('npx hardhat compile');
      checks["Contracts compile successfully"] = true;
    } catch (error) {
      checks["Contracts compile successfully"] = false;
      issues.push("Contract compilation failed");
    }

    // Check if contract factory can be created
    try {
      await ethers.getContractFactory("EpicStarterToken");
      checks["EpicStarterToken factory creation"] = true;
    } catch (error) {
      checks["EpicStarterToken factory creation"] = false;
      issues.push("Cannot create EpicStarterToken factory");
    }

    // Check contract size
    const artifactPath = path.join(process.cwd(), "artifacts/contracts/token/EpicStarterToken.sol/EpicStarterToken.json");
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      const bytecodeSize = (artifact.deployedBytecode.length - 2) / 2; // Remove 0x and convert hex to bytes
      const maxSize = 24576; // 24KB limit
      checks["Contract size within limits"] = bytecodeSize <= maxSize;
      if (bytecodeSize > maxSize) {
        issues.push(`Contract size (${bytecodeSize} bytes) exceeds limit (${maxSize} bytes)`);
      }
    } else {
      checks["Contract size within limits"] = false;
      issues.push("Contract artifacts not found");
    }

    // Check for required functions in interface
    const interfacePath = path.join(process.cwd(), "contracts/interfaces/IEpicStarterToken.sol");
    if (fs.existsSync(interfacePath)) {
      const interfaceContent = fs.readFileSync(interfacePath, "utf8");
      const requiredFunctions = ["burn", "burnFrom", "pause", "unpause", "emergencyWithdraw"];
      requiredFunctions.forEach(func => {
        const hasFunction = interfaceContent.includes(`function ${func}`);
        checks[`Interface has ${func} function`] = hasFunction;
        if (!hasFunction) {
          issues.push(`Interface missing ${func} function`);
        }
      });
    } else {
      issues.push("Interface file not found");
    }

  } catch (error) {
    issues.push(`Contract validation error: ${error}`);
  }

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  return {
    category: "Smart Contracts",
    checks,
    score,
    issues
  };
}

function validateConfiguration(): ValidationResult {
  const checks: { [key: string]: boolean } = {};
  const issues: string[] = [];

  // Check hardhat.config.ts
  const hardhatConfigPath = path.join(process.cwd(), "hardhat.config.ts");
  if (fs.existsSync(hardhatConfigPath)) {
    const configContent = fs.readFileSync(hardhatConfigPath, "utf8");
    checks["Hardhat config exists"] = true;
    checks["Has BSC testnet config"] = configContent.includes("bscTestnet");
    checks["Has BSC mainnet config"] = configContent.includes("bscMainnet");
    checks["Has verification config"] = configContent.includes("etherscan");
    checks["Has gas reporter config"] = configContent.includes("gasReporter");
  } else {
    checks["Hardhat config exists"] = false;
    issues.push("Missing hardhat.config.ts");
  }

  // Check tsconfig.json
  const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    checks["TypeScript config exists"] = true;
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
      checks["Has proper compiler options"] = tsconfig.compilerOptions && tsconfig.compilerOptions.target;
    } catch {
      checks["Has proper compiler options"] = false;
      issues.push("Invalid tsconfig.json format");
    }
  } else {
    checks["TypeScript config exists"] = false;
    issues.push("Missing tsconfig.json");
  }

  // Check .env.example
  const envExamplePath = path.join(process.cwd(), ".env.example");
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, "utf8");
    checks[".env.example exists"] = true;
    checks["Has PRIVATE_KEY"] = envContent.includes("PRIVATE_KEY");
    checks["Has BSCSCAN_API_KEY"] = envContent.includes("BSCSCAN_API_KEY");
  } else {
    checks[".env.example exists"] = false;
    issues.push("Missing .env.example");
  }

  // Check linting configs
  checks["ESLint config exists"] = fs.existsSync(path.join(process.cwd(), ".eslintrc.js"));
  checks["Prettier config exists"] = fs.existsSync(path.join(process.cwd(), ".prettierrc.js"));
  checks["Solhint config exists"] = fs.existsSync(path.join(process.cwd(), ".solhint.json"));

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    category: "Configuration",
    checks,
    score,
    issues
  };
}

function validateTests(): ValidationResult {
  const checks: { [key: string]: boolean } = {};
  const issues: string[] = [];

  const testPath = path.join(process.cwd(), "test/EpicStarterToken.test.ts");
  if (fs.existsSync(testPath)) {
    const testContent = fs.readFileSync(testPath, "utf8");
    checks["Main test file exists"] = true;

    // Check for test categories
    const testCategories = [
      "Deployment",
      "ERC20 Basic Functionality",
      "Burning Functionality",
      "Pausable Functionality",
      "Access Control",
      "Emergency Functions",
      "Batch Operations"
    ];

    testCategories.forEach(category => {
      const hasCategory = testContent.includes(category);
      checks[`Has ${category} tests`] = hasCategory;
      if (!hasCategory) {
        issues.push(`Missing ${category} test category`);
      }
    });

    // Check for fixture usage
    checks["Uses test fixtures"] = testContent.includes("loadFixture");

    // Check for comprehensive assertions
    checks["Has comprehensive assertions"] = testContent.includes("expect") && testContent.includes("to.equal");

  } else {
    checks["Main test file exists"] = false;
    issues.push("Missing main test file");
  }

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    category: "Tests",
    checks,
    score,
    issues
  };
}

function validateScripts(): ValidationResult {
  const checks: { [key: string]: boolean } = {};
  const issues: string[] = [];

  const requiredScripts = [
    "deploy.ts",
    "verify.ts",
    "simple-deploy.ts",
    "utils.ts",
    "analyze.ts",
    "test-runner.ts"
  ];

  requiredScripts.forEach(script => {
    const scriptPath = path.join(process.cwd(), "scripts", script);
    const exists = fs.existsSync(scriptPath);
    checks[`Script: ${script}`] = exists;
    if (!exists) {
      issues.push(`Missing script: ${script}`);
    }
  });

  // Check if scripts have proper structure
  const deployScriptPath = path.join(process.cwd(), "scripts/simple-deploy.ts");
  if (fs.existsSync(deployScriptPath)) {
    const deployContent = fs.readFileSync(deployScriptPath, "utf8");
    checks["Deploy script has main function"] = deployContent.includes("async function main");
    checks["Deploy script has error handling"] = deployContent.includes("catch");
  }

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    category: "Scripts",
    checks,
    score,
    issues
  };
}

function validateDocumentation(): ValidationResult {
  const checks: { [key: string]: boolean } = {};
  const issues: string[] = [];

  // Check README.md
  const readmePath = path.join(process.cwd(), "README.md");
  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, "utf8");
    checks["README.md exists"] = true;
    checks["Has project overview"] = readmeContent.includes("Overview");
    checks["Has installation instructions"] = readmeContent.includes("Installation");
    checks["Has deployment guide"] = readmeContent.includes("Deployment");
    checks["Has usage examples"] = readmeContent.includes("Usage") || readmeContent.includes("Example");
  } else {
    checks["README.md exists"] = false;
    issues.push("Missing README.md");
  }

  // Check technical documentation
  const techDocsPath = path.join(process.cwd(), "docs/TECHNICAL.md");
  if (fs.existsSync(techDocsPath)) {
    const techContent = fs.readFileSync(techDocsPath, "utf8");
    checks["Technical docs exist"] = true;
    checks["Has architecture overview"] = techContent.includes("Architecture");
    checks["Has function documentation"] = techContent.includes("Function Documentation");
  } else {
    checks["Technical docs exist"] = false;
    issues.push("Missing technical documentation");
  }

  // Check LICENSE
  const licensePath = path.join(process.cwd(), "LICENSE");
  checks["LICENSE file exists"] = fs.existsSync(licensePath);
  if (!fs.existsSync(licensePath)) {
    issues.push("Missing LICENSE file");
  }

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    category: "Documentation",
    checks,
    score,
    issues
  };
}

function validatePackageJson(): ValidationResult {
  const checks: { [key: string]: boolean } = {};
  const issues: string[] = [];

  const packagePath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(packagePath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
      checks["package.json exists"] = true;
      checks["Has name field"] = !!packageJson.name;
      checks["Has version field"] = !!packageJson.version;
      checks["Has description"] = !!packageJson.description;
      checks["Has scripts"] = !!packageJson.scripts;
      checks["Has dependencies"] = !!packageJson.dependencies;
      checks["Has devDependencies"] = !!packageJson.devDependencies;

      // Check required scripts
      const requiredScripts = ["build", "test", "deploy:testnet", "deploy:mainnet"];
      requiredScripts.forEach(script => {
        const hasScript = packageJson.scripts && packageJson.scripts[script];
        checks[`Has ${script} script`] = !!hasScript;
        if (!hasScript) {
          issues.push(`Missing ${script} script in package.json`);
        }
      });

      // Check required dependencies
      const requiredDeps = ["@openzeppelin/contracts"];
      requiredDeps.forEach(dep => {
        const hasDep = packageJson.dependencies && packageJson.dependencies[dep];
        checks[`Has ${dep} dependency`] = !!hasDep;
        if (!hasDep) {
          issues.push(`Missing ${dep} dependency`);
        }
      });

      // Check required devDependencies
      const requiredDevDeps = ["hardhat", "typescript", "@types/node"];
      requiredDevDeps.forEach(dep => {
        const hasDevDep = packageJson.devDependencies && packageJson.devDependencies[dep];
        checks[`Has ${dep} devDependency`] = !!hasDevDep;
        if (!hasDevDep) {
          issues.push(`Missing ${dep} devDependency`);
        }
      });

    } catch (error) {
      checks["package.json valid JSON"] = false;
      issues.push("Invalid package.json format");
    }
  } else {
    checks["package.json exists"] = false;
    issues.push("Missing package.json");
  }

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    category: "Package Configuration",
    checks,
    score,
    issues
  };
}

function calculateOverallScore(results: ValidationResult[]): number {
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  return Math.round(totalScore / results.length);
}

function printResult(result: ValidationResult): void {
  const status = result.score >= 90 ? "✅" : result.score >= 70 ? "⚠️" : "❌";
  console.log(`${status} ${result.category}: ${result.score}%`);

  if (result.issues.length > 0) {
    result.issues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  });
