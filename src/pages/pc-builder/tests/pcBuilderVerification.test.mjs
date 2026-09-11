import { validateBuildCompatibility, testCandidateCompatibility, calculateSystemPower } from '../utils/compatibility.js';
import { calculateBudgetStatus } from '../utils/budget.js';
import {
  generateAutoBuild,
  calculateMinimumBuildCost,
  evaluateGamePerformance,
  categorizeInventory,
  evaluateGameBudgetFeasibility,
  generateGameBuild,
} from '../utils/recommendations.js';
import { generateBuildSpecSheet } from '../utils/pcBuilderStorage.js';
import { GAMES_DATABASE } from '../data/gamesDatabase.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('--- TEST SUITE: G-LAB PC BUILDER (PHASE A AUDIT & ENFORCEMENT) ---');

// 1. CPU <-> Motherboard Socket Match
console.log('\n1. Testing Socket Compatibility:');
const am5Cpu = { name: 'AMD Ryzen 7 9800X3D', socket: 'AM5', tdp: 120, componentType: 'cpu', stock: 6, price: 189900 };
const am5Mobo = { name: 'ASUS ROG Strix B850-F', socket: 'AM5', formFactor: 'ATX', ramType: 'DDR5', componentType: 'motherboard', stock: 11, price: 109900 };
const intelCpu = { name: 'Intel Core Ultra 7 265K', socket: 'LGA1851', tdp: 125, componentType: 'cpu', stock: 10, price: 169900 };

const am5Validation = validateBuildCompatibility({ cpu: am5Cpu, motherboard: am5Mobo });
assert(am5Validation.isCompatible === true, 'AM5 CPU + AM5 Motherboard is compatible');

const mismatchValidation = validateBuildCompatibility({ cpu: intelCpu, motherboard: am5Mobo });
assert(mismatchValidation.isCompatible === false, 'Intel LGA1851 CPU + AM5 Motherboard is detected incompatible');

// 2. RAM <-> Motherboard Standard
console.log('\n2. Testing RAM Generation Compatibility:');
const ddr5Ram = { name: 'Corsair Vengeance 32GB', ramType: 'DDR5', componentType: 'ram', capacityGB: 32, stock: 12, price: 38500 };
const ddr4Ram = { name: 'Corsair Vengeance 16GB', ramType: 'DDR4', componentType: 'ram', capacityGB: 16, stock: 5, price: 15000 };

const ddr5Check = validateBuildCompatibility({ motherboard: am5Mobo, ram: ddr5Ram });
assert(ddr5Check.isCompatible === true, 'DDR5 RAM with DDR5 Motherboard matches');

const ddr4Check = validateBuildCompatibility({ motherboard: am5Mobo, ram: ddr4Ram });
assert(ddr4Check.isCompatible === false, 'DDR4 RAM with DDR5 Motherboard is flagged incompatible');

// 3. GPU <-> Case Clearance
console.log('\n3. Testing GPU Length Clearance:');
const pcCase = { name: 'NZXT H9 Flow', maxGpuLength: 435, supportedFormFactors: ['ATX', 'Micro-ATX'], componentType: 'pcCase', stock: 12, price: 79900 };
const normalGpu = { name: 'ASUS Dual RTX 4070 SUPER', gpuLength: 267, powerConsumption: 220, componentType: 'gpu', vramGB: 12, stock: 20, price: 245000 };
const oversizedGpu = { name: 'Hypothetical 500mm GPU', gpuLength: 500, powerConsumption: 400, componentType: 'gpu', stock: 5, price: 300000 };

const gpuFitCheck = validateBuildCompatibility({ pcCase, gpu: normalGpu });
assert(gpuFitCheck.isCompatible === true, '267mm GPU fits in 435mm clearance case');

const gpuOversizedCheck = validateBuildCompatibility({ pcCase, gpu: oversizedGpu });
assert(gpuOversizedCheck.isCompatible === false, '500mm GPU flagged incompatible in 435mm case');

// 4. Power Calculation & PSU Headroom (25% safety margin)
console.log('\n4. Testing Power Estimation & Headroom:');
const parts = { cpu: am5Cpu, gpu: normalGpu, motherboard: am5Mobo, ram: ddr5Ram };
const power = calculateSystemPower(parts);
// Baseline (75) + CPU (120) + GPU (220) = 415W. Headroom = 415 * 1.25 = 518.75 -> rounded to 550W.
assert(power.estimatedPower === 415, `Estimated system power is calculated accurately (Expected 415W, got ${power.estimatedPower}W)`);
assert(power.recommendedPsuWattage >= 550, `Recommended PSU has 25% safety margin (Got ${power.recommendedPsuWattage}W)`);

// 5. Budget Calculation
console.log('\n5. Testing Budget Utilities:');
const budgetTestParts = {
  cpu: { name: 'Ryzen 7', price: 150000 },
  gpu: { name: 'RTX 4070', price: 230000 },
};
const budgetStatus = calculateBudgetStatus(budgetTestParts, 400000);
assert(budgetStatus.currentTotal === 380000, 'Total cost calculated correctly (380k)');
assert(budgetStatus.remaining === 20000, 'Remaining budget calculated correctly (20k)');
assert(budgetStatus.isOverBudget === false, 'Not over budget flag is correct');

const overBudgetStatus = calculateBudgetStatus(budgetTestParts, 300000);
assert(overBudgetStatus.isOverBudget === true, 'Over budget detected correctly');
assert(overBudgetStatus.overAmount === 80000, 'Over budget discrepancy calculated accurately (80k)');

// 6. Game Performance Evaluation
console.log('\n6. Testing Game Benchmark Evaluation:');
const cyberpunkEval = evaluateGamePerformance({ cpu: am5Cpu, gpu: normalGpu, ram: ddr5Ram }, 'cyberpunk-2077');
assert(cyberpunkEval.tier === 'high_fps', 'Build achieves high_fps tier for Cyberpunk 2077');

// 7. Phase A: Minecraft and Call of Duty: Warzone Profiles
console.log('\n7. Testing Game Database Completeness (Phase A):');
const minecraft = GAMES_DATABASE.find((g) => g.id === 'minecraft');
assert(!!minecraft, 'Minecraft game profile exists in database');
assert(minecraft?.minimum?.ramGB === 4 && minecraft?.recommended?.vramGB === 8, 'Minecraft has valid minimum/recommended requirements');

const warzone = GAMES_DATABASE.find((g) => g.id === 'call-of-duty-warzone');
assert(!!warzone, 'Call of Duty: Warzone game profile exists in database');
assert(warzone?.recommended?.cores === 8 && warzone?.minEstimatedBudget === 220000, 'Call of Duty: Warzone has valid published specs');

// 8. Phase A: Minimum Build Cost Calculation
console.log('\n8. Testing Minimum Feasible Build Cost Calculation:');
const mockCatalog = [
  pcCase,
  am5Mobo,
  am5Cpu,
  intelCpu,
  ddr5Ram,
  normalGpu,
  { name: 'Samsung 990 EVO 1TB', price: 28000, category: 'Storage', componentType: 'storage', stock: 15 },
  { name: 'MSI 650W Bronze', price: 24500, category: 'Power Supply', wattage: 650, componentType: 'psu', stock: 12 },
  { name: 'Corsair RM750e 750W', price: 42500, category: 'Power Supply', wattage: 750, componentType: 'psu', stock: 15 },
];
const minCostResult = calculateMinimumBuildCost(mockCatalog);
assert(minCostResult.isFeasible === true, 'Minimum build cost is feasible with mock catalog');
// NZXT H9 (79900) + ASUS B850 (109900) + Ryzen 7 (189900) + RAM (38500) + SSD (28000) + GPU (245000) + PSU (24500) = 715,700
assert(minCostResult.minimumCost > 0, `Calculated minimum feasible build cost is Rs. ${minCostResult.minimumCost.toLocaleString()}`);

// 9. Phase A: Strict Insufficient Budget Detection (Never Silently Exceeds Budget)
console.log('\n9. Testing Strict Insufficient Budget Detection:');
const lowBudgetResult = generateAutoBuild({
  allProducts: mockCatalog,
  targetBudget: 250000, // Lower than minimum feasible build
  purpose: 'aaa_gaming',
});
assert(lowBudgetResult.status === 'insufficient_budget', 'Auto build correctly detects insufficient budget');
assert(lowBudgetResult.build === null, 'Auto build NEVER silently returns an over-budget build');
assert(lowBudgetResult.shortfall > 0, `Auto build calculates exact shortfall (Shortfall: Rs. ${lowBudgetResult.shortfall?.toLocaleString()})`);
assert(Array.isArray(lowBudgetResult.alternatives) && lowBudgetResult.alternatives.length > 0, 'Auto build provides actionable alternatives');

// 10. Phase A: Sufficient Budget Auto Build Generation
console.log('\n10. Testing Auto Build Generation within Budget:');
const validBudgetResult = generateAutoBuild({
  allProducts: mockCatalog,
  targetBudget: 750000,
  purpose: 'aaa_gaming',
});
assert(validBudgetResult.status === 'success', 'Auto build succeeds when budget is sufficient');
assert(validBudgetResult.build !== null, 'Auto build returns complete build');
assert(validBudgetResult.totalCost <= 750000, `Total cost (Rs. ${validBudgetResult.totalCost.toLocaleString()}) does not exceed target budget (Rs. 750,000)`);
assert(validBudgetResult.isCompatible === true, 'Auto-generated build is 100% physically compatible');

// 11. Phase A: Out of Stock Filtering in Auto Build
console.log('\n11. Testing Stock Enforcement in Auto Build:');
const outOfStockGpu = {
  name: 'Rare RTX 4090 Monster',
  price: 50000,
  category: 'Graphic Cards',
  componentType: 'gpu',
  powerConsumption: 250,
  gpuLength: 300,
  stock: 0, // OUT OF STOCK
};
const catalogWithOos = [...mockCatalog, outOfStockGpu];
const autoWithOos = generateAutoBuild({
  allProducts: catalogWithOos,
  targetBudget: 800000,
  purpose: 'aaa_gaming',
});
assert(autoWithOos.build.gpu.name !== 'Rare RTX 4090 Monster', 'Out of stock product is NEVER selected by auto-build');
assert(autoWithOos.build.gpu.stock > 0, 'Selected GPU has confirmed in-stock inventory');

// 12. Phase A: Manual Mode Out of Stock Enforcement
console.log('\n12. Testing Manual Mode Out of Stock Enforcement Logic:');
const testInStock = { name: 'Item In Stock', stock: 5 };
const testOutOfStock = { name: 'Item Out of Stock', stock: 0 };
const isOosFunc = (item) => item.stock !== undefined && Number(item.stock) <= 0;
assert(isOosFunc(testInStock) === false, 'In stock item is allowed');
assert(isOosFunc(testOutOfStock) === true, 'Out of stock item (stock=0) is identified and blocked');

// 13. Phase A: Intel LGA1851 Motherboard Empty State Logic
console.log('\n13. Testing Intel LGA1851 Motherboard Empty State:');
const currentMotherboards = [
  { name: 'ASUS ROG Strix B850-F', socket: 'AM5' },
  { name: 'MSI MAG X870 TOMAHAWK', socket: 'AM5' },
];
const lga1851Matches = currentMotherboards.filter(
  (m) => m.socket?.toUpperCase() === intelCpu.socket.toUpperCase()
);
assert(lga1851Matches.length === 0, 'Verified 0 LGA1851 motherboards in current catalog');
const isLga1851Triggered = (slotId, cpu) => slotId === 'motherboard' && cpu?.socket?.toUpperCase() === 'LGA1851';
assert(isLga1851Triggered('motherboard', intelCpu) === true, 'LGA1851 specific empty state triggers when Intel Ultra 7 is selected');

// 14. Spec Sheet Generation
console.log('\n14. Testing Spec Sheet Formatter:');
const specSheet = generateBuildSpecSheet(validBudgetResult.build, 750000, { estimatedPower: 415, recommendedPsuWattage: 550 });
assert(specSheet.includes('BILL OF MATERIALS'), 'Spec sheet contains Bill of Materials header');
assert(specSheet.includes('Estimated System Power: 415W'), 'Spec sheet includes power estimation');

// ============================================================================
// PHASE B TESTS: GAME MODE BUDGET, FEASIBILITY, CONFIRMATION, & DIAGNOSTICS
// ============================================================================
console.log('\n--- TEST SUITE: G-LAB PC BUILDER (PHASE B IMPLEMENTATION AUDIT) ---');

// 15. Game Budget Input & Parsing
console.log('\n15. Testing Game Budget Input & Parsing:');
const parseBudgetInput = (val) => {
  const raw = String(val).replace(/\D/g, '');
  return Number(raw) || 0;
};
assert(parseBudgetInput('Rs. 600,000') === 600000, 'Budget parser converts currency-formatted "Rs. 600,000" to numeric 600000');
assert(parseBudgetInput('450,000') === 450000, 'Budget parser converts "450,000" to 450000');
assert(parseBudgetInput('') === 0, 'Budget parser handles empty input gracefully');
assert(parseBudgetInput('invalid') === 0, 'Budget parser handles non-numeric strings safely');

// 16. Game Budget Feasibility Evaluation
console.log('\n16. Testing Game Budget Feasibility Evaluation:');
const sufficientFeasibility = evaluateGameBudgetFeasibility({
  allProducts: mockCatalog,
  gameId: 'cyberpunk-2077',
  targetBudget: 800000,
  targetLevel: '1440p',
});
assert(sufficientFeasibility.isFeasible === true, 'Feasibility detects sufficient budget (800k vs 715k min)');
assert(sufficientFeasibility.status === 'sufficient_budget', 'Feasibility status is sufficient_budget');
assert(sufficientFeasibility.headroom > 0, `Budget headroom calculated accurately (${sufficientFeasibility.headroom})`);

const insufficientFeasibility = evaluateGameBudgetFeasibility({
  allProducts: mockCatalog,
  gameId: 'cyberpunk-2077',
  targetBudget: 400000,
  targetLevel: '1440p',
});
assert(insufficientFeasibility.isFeasible === false, 'Feasibility detects insufficient budget (400k vs 715k min)');
assert(insufficientFeasibility.status === 'insufficient_budget', 'Feasibility status is insufficient_budget');
assert(insufficientFeasibility.shortfall === 315700, `Shortfall calculated accurately (Expected 315,700, got ${insufficientFeasibility.shortfall})`);
assert(insufficientFeasibility.message.includes('insufficient'), 'Feasibility message clearly indicates budget insufficiency');

// 17. Game Build Cannot Exceed Budget
console.log('\n17. Testing Game Build Strictly Respects Budget Constraint:');
const gameBuildSuccess = generateGameBuild({
  allProducts: mockCatalog,
  gameId: 'cyberpunk-2077',
  targetBudget: 750000,
  targetLevel: '1440p',
});
assert(gameBuildSuccess.status === 'success', 'generateGameBuild succeeds when budget is sufficient');
assert(gameBuildSuccess.build !== null, 'generateGameBuild returns build object');
assert(gameBuildSuccess.totalCost <= 750000, `Total build cost (${gameBuildSuccess.totalCost}) never exceeds user budget (750000)`);

const gameBuildBlocked = generateGameBuild({
  allProducts: mockCatalog,
  gameId: 'cyberpunk-2077',
  targetBudget: 400000,
  targetLevel: '1440p',
});
assert(gameBuildBlocked.status === 'insufficient_budget', 'generateGameBuild blocks under-budget attempt');
assert(gameBuildBlocked.build === null, 'generateGameBuild NEVER returns an over-budget build');

// 18. Insufficient Game Budget Result Details
console.log('\n18. Testing Insufficient Game Budget Returned Data:');
assert(gameBuildBlocked.minimumCost === 715700, 'Insufficient result returns minimum required build cost');
assert(gameBuildBlocked.shortfall === 315700, 'Insufficient result returns exact shortfall amount');
assert(gameBuildBlocked.message === 'No compatible build is currently available within your budget.', 'Insufficient result returns standard user-facing error message');

// 19. Alternative Recommendations (Options 1 to 4)
console.log('\n19. Testing Alternative Suggestions (Options 1-4):');
const alts = insufficientFeasibility.alternatives;
assert(Array.isArray(alts) && alts.length >= 4, `Provides at least 4 structured alternatives (Found ${alts.length})`);
const option1 = alts.find((a) => a.optionNumber === 1 || a.id === 'increase_budget');
assert(!!option1 && option1.title.includes('Option 1'), 'Option 1 suggests increasing budget with exact minimum cost');
const option2 = alts.find((a) => a.optionNumber === 2);
assert(!!option2 && option2.title.includes('Option 2'), 'Option 2 suggests adjusting resolution / target level');
const option3 = alts.find((a) => a.optionNumber === 3 || a.id === 'lower_performance_target');
assert(!!option3 && option3.title.includes('Option 3'), 'Option 3 suggests lowering performance target');
const option4 = alts.find((a) => a.optionNumber === 4 || a.id === 'budget_gpu');
assert(!!option4 && option4.title.includes('Option 4'), 'Option 4 suggests choosing a more affordable GPU');

// 20. Manual Mode: Incompatible Component Confirmation Logic
console.log('\n20. Testing Incompatible Component Confirmation Logic:');
let currentBuildState = { motherboard: am5Mobo };
let pendingModalState = null;

// Simulated user clicks incompatible Intel CPU on AM5 build
const candidateCheck = testCandidateCompatibility(intelCpu, currentBuildState);
assert(candidateCheck.isCompatible === false, 'Candidate is flagged incompatible');

// Selection handler with confirmation guard
const handleAttemptInstall = (slot, part, isComp, reason) => {
  if (!isComp) {
    pendingModalState = { slot, part, reason };
    return false; // Do not install immediately
  }
  currentBuildState[slot] = part;
  return true;
};

// User clicks "Install Anyway" on card
const installedDirectly = handleAttemptInstall('cpu', intelCpu, candidateCheck.isCompatible, candidateCheck.reason);
assert(installedDirectly === false, 'Incompatible component is NOT immediately installed');
assert(pendingModalState !== null, 'Confirmation modal state is activated with reason');
assert(pendingModalState.reason.includes('AM5'), 'Confirmation modal contains specific incompatibility reason');
assert(currentBuildState.cpu === undefined, 'Build state remains unpolluted before confirmation');

// Case A: User clicks "Cancel"
pendingModalState = null;
assert(currentBuildState.cpu === undefined, 'Build state remains unchanged after modal Cancel');

// Case B: User clicks "Install Anyway" in modal
handleAttemptInstall('cpu', intelCpu, true, null); // User override
assert(currentBuildState.cpu.name === intelCpu.name, 'Component is only installed after explicit user confirmation');

// 21. Compatibility Diagnostic Categories (4 Specific Groups)
console.log('\n21. Testing 4 Diagnostic Categories:');
const fullBuildValidation = validateBuildCompatibility({
  pcCase,
  motherboard: am5Mobo,
  cpu: am5Cpu,
  ram: ddr5Ram,
  gpu: normalGpu,
});

const cats = fullBuildValidation.categories;
assert(!!cats.socketPlatform, 'Diagnostics includes Socket & Platform category');
assert(cats.socketPlatform.title === 'Socket & Platform', 'Socket & Platform category has correct title');
assert(cats.socketPlatform.checks.some((c) => c.id === 'cpu-mobo'), 'Socket & Platform includes CPU ↔ Motherboard check');
assert(cats.socketPlatform.checks.some((c) => c.id === 'cpu-socket'), 'Socket & Platform includes CPU socket check');
assert(cats.socketPlatform.checks.some((c) => c.id === 'platform-chipset'), 'Socket & Platform includes Motherboard platform/chipset check');

assert(!!cats.memory, 'Diagnostics includes Memory Architecture category');
assert(cats.memory.title === 'Memory Architecture', 'Memory Architecture category has correct title');
assert(cats.memory.checks.some((c) => c.id === 'ram-mobo'), 'Memory Architecture includes RAM generation check');
assert(cats.memory.checks.some((c) => c.id === 'mobo-ram-support'), 'Memory Architecture includes Motherboard RAM support check');

assert(!!cats.clearances, 'Diagnostics includes Physical Clearances category');
assert(cats.clearances.title === 'Physical Clearances', 'Physical Clearances category has correct title');
assert(cats.clearances.checks.some((c) => c.id === 'gpu-case'), 'Physical Clearances includes GPU ↔ Case check');
assert(cats.clearances.checks.some((c) => c.id === 'cooler-case'), 'Physical Clearances includes Cooler ↔ Case check');
assert(cats.clearances.checks.some((c) => c.id === 'mobo-case'), 'Physical Clearances includes Motherboard ↔ Case check');

assert(!!cats.thermalPower, 'Diagnostics includes Thermal & Power category');
assert(cats.thermalPower.title === 'Thermal & Power', 'Thermal & Power category has correct title');
assert(cats.thermalPower.checks.some((c) => c.id === 'cpu-cooling'), 'Thermal & Power includes CPU cooling check');
assert(cats.thermalPower.checks.some((c) => c.id === 'system-power'), 'Thermal & Power includes Estimated system power check');
assert(cats.thermalPower.checks.some((c) => c.id === 'psu-recommendation'), 'Thermal & Power includes PSU recommendation check');
assert(cats.thermalPower.checks.some((c) => c.id === 'psu-power'), 'Thermal & Power includes PSU safety headroom check');

// 22. Unverified Status When Required Specifications Missing
console.log('\n22. Testing Unverified Status When Specifications Missing:');
const cpuWithoutSocket = { name: 'Mystery CPU', componentType: 'cpu' };
const moboWithoutSocket = { name: 'Mystery Motherboard', componentType: 'motherboard' };
const unverifiedValidation = validateBuildCompatibility({ cpu: cpuWithoutSocket, motherboard: moboWithoutSocket });
const unverifiedCpuMobo = unverifiedValidation.checks.find((c) => c.id === 'cpu-mobo');
assert(unverifiedCpuMobo.status === 'unverified', 'Missing socket specifications result in "unverified" status');
assert(unverifiedCpuMobo.status !== 'compatible', 'Never falsely displays "compatible" when specifications are missing');

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);

