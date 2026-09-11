/**
 * G-Lab PC Builder: Algorithmic Hardware Recommendation & Optimization Engine
 * 
 * Generates mathematically balanced, 100% physically compatible PC configurations
 * from available catalog inventory based on:
 * - Target budget constraints (STRICT ENFORCEMENT: Never silently exceeds budget)
 * - In-stock inventory verification (Excludes out-of-stock items)
 * - Intended usage (Esports, 1440p/4K AAA Gaming, Content Creation, Value)
 * - Specific game target requirements (Cyberpunk 2077, CS2, Valorant, etc.)
 * - Component compatibility rules (Socket, RAM generation, GPU clearance, PSU wattage)
 */

import { getProductSpecs } from './hardwareSpecs.js';
import { validateBuildCompatibility } from './compatibility.js';
import { GAMES_DATABASE } from '../data/gamesDatabase.js';

// Standard fallback cooling parts if catalog has 0 DB entries
export const FALLBACK_COOLER = {
  _id: 'stock-air-cooler',
  name: 'Standard High-Performance Air Cooler (Stock)',
  brand: 'OEM Precision',
  price: 0,
  stock: 50,
  componentType: 'cooler',
  coolerType: 'Air',
  supportedSockets: ['AM5', 'AM4', 'LGA1851', 'LGA1700'],
  coolerHeight: 155,
  isVerified: true,
};

export const FALLBACK_FANS = {
  _id: 'chassis-default-fans',
  name: 'Pre-Installed Chassis High-Airflow PWM Fans',
  brand: 'Chassis OEM',
  price: 0,
  stock: 99,
  componentType: 'fans',
  fanCount: 3,
  isVerified: true,
};

/**
 * Categorizes and enriches catalog products by hardware category.
 * If requireInStock is true, only products with stock > 0 are included.
 */
export function categorizeInventory(allProducts = [], requireInStock = false) {
  const categorized = {
    cases: [],
    motherboards: [],
    cpus: [],
    gpus: [],
    ram: [],
    storage: [],
    psus: [],
    coolers: [FALLBACK_COOLER],
    fans: [FALLBACK_FANS],
  };

  allProducts.forEach((p) => {
    // In-stock enforcement
    if (requireInStock && p.stock !== undefined && Number(p.stock) <= 0) {
      return;
    }

    const specs = getProductSpecs(p);
    const enriched = { ...specs, ...p };
    const cat = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();

    if (cat.includes('case') || name.includes('h9') || name.includes('chassis')) {
      categorized.cases.push(enriched);
    } else if (cat.includes('motherboard') || name.includes('b850') || name.includes('x870') || name.includes('z790')) {
      categorized.motherboards.push(enriched);
    } else if (cat.includes('processor') || cat.includes('cpu') || name.includes('ryzen') || name.includes('ultra 7') || name.includes('core i')) {
      categorized.cpus.push(enriched);
    } else if (cat.includes('card') || cat.includes('gpu') || name.includes('rtx') || name.includes('radeon') || name.includes('geforce')) {
      categorized.gpus.push(enriched);
    } else if (cat.includes('ram') || cat.includes('memory') || name.includes('ddr5') || name.includes('fury') || name.includes('vengeance')) {
      categorized.ram.push(enriched);
    } else if (cat.includes('storage') || cat.includes('ssd') || name.includes('nvme') || name.includes('990 evo') || name.includes('sn850x')) {
      categorized.storage.push(enriched);
    } else if (cat.includes('power') || cat.includes('psu') || name.includes('watt') || name.includes('650w') || name.includes('750w') || name.includes('850w') || name.includes('1000w')) {
      categorized.psus.push(enriched);
    }
  });

  return categorized;
}

/**
 * Calculates the absolute minimum cost for a 100% compatible, fully functional
 * PC build using currently in-stock catalog products.
 */
export function calculateMinimumBuildCost(allProducts = []) {
  const inv = categorizeInventory(allProducts, true);

  const missingCategories = [];
  if (inv.cases.length === 0) missingCategories.push('PC Cases');
  if (inv.motherboards.length === 0) missingCategories.push('Motherboards');
  if (inv.cpus.length === 0) missingCategories.push('Processors');
  if (inv.gpus.length === 0) missingCategories.push('Graphic Cards');
  if (inv.ram.length === 0) missingCategories.push('Memory (RAM)');
  if (inv.storage.length === 0) missingCategories.push('Storage (SSD)');
  if (inv.psus.length === 0) missingCategories.push('Power Supply');

  if (missingCategories.length > 0) {
    return {
      isFeasible: false,
      minimumCost: 0,
      missingCategories,
      cheapestBuild: null,
    };
  }

  // Find cheapest in-stock Case
  const cheapestCase = [...inv.cases].sort((a, b) => (a.price || 0) - (b.price || 0))[0];

  // Find cheapest compatible (CPU, Motherboard) pair in stock
  let cheapestCpuMoboPair = null;
  let lowestPairPrice = Infinity;

  inv.cpus.forEach((cpu) => {
    const matchingMobos = inv.motherboards.filter(
      (m) => m.socket && cpu.socket && m.socket.toUpperCase() === cpu.socket.toUpperCase()
    );
    matchingMobos.forEach((mobo) => {
      const pairPrice = (cpu.price || 0) + (mobo.price || 0);
      if (pairPrice < lowestPairPrice) {
        lowestPairPrice = pairPrice;
        cheapestCpuMoboPair = { cpu, mobo };
      }
    });
  });

  if (!cheapestCpuMoboPair) {
    return {
      isFeasible: false,
      minimumCost: 0,
      missingCategories: ['Compatible CPU & Motherboard Pair'],
      cheapestBuild: null,
    };
  }

  const { cpu: minCpu, mobo: minMobo } = cheapestCpuMoboPair;

  // Cheapest in-stock RAM matching motherboard generation
  const moboRamType = minMobo.ramType || 'DDR5';
  const compatibleRams = inv.ram.filter(
    (r) => !r.ramType || r.ramType.toUpperCase() === moboRamType.toUpperCase()
  );
  const cheapestRam = compatibleRams.sort((a, b) => (a.price || 0) - (b.price || 0))[0] || inv.ram[0];

  // Cheapest in-stock Storage
  const cheapestStorage = [...inv.storage].sort((a, b) => (a.price || 0) - (b.price || 0))[0];

  // Cheapest in-stock GPU
  const cheapestGpu = [...inv.gpus].sort((a, b) => (a.price || 0) - (b.price || 0))[0];

  // Cheapest in-stock PSU meeting estimated power demand + 25% safety margin
  const estPower = 75 + (minCpu.tdp || 120) + (cheapestGpu.powerConsumption || 200);
  const minRequiredWattage = Math.ceil((estPower * 1.25) / 50) * 50;
  const adequatePsus = inv.psus.filter((p) => (p.wattage || 650) >= minRequiredWattage);
  const cheapestPsu = adequatePsus.sort((a, b) => (a.price || 0) - (b.price || 0))[0] || inv.psus[0];

  const cheapestBuild = {
    pcCase: cheapestCase,
    motherboard: minMobo,
    cpu: minCpu,
    cooler: FALLBACK_COOLER,
    ram: cheapestRam,
    gpu: cheapestGpu,
    storage: cheapestStorage,
    psu: cheapestPsu,
    fans: FALLBACK_FANS,
  };

  const minimumCost = Object.values(cheapestBuild).reduce((sum, p) => sum + (p?.price || 0), 0);

  return {
    isFeasible: true,
    minimumCost,
    missingCategories: [],
    cheapestBuild,
  };
}

/**
 * Generates an optimized, 100% compatible build based on budget and user preferences.
 * STRICT ENFORCEMENT: Never silently exceeds the target budget.
 */
export function generateAutoBuild({
  allProducts = [],
  targetBudget = 350000,
  purpose = 'aaa_gaming', // 'esports' | 'aaa_gaming' | 'workstation' | 'budget'
  preferredCpuBrand = 'all', // 'amd' | 'intel' | 'all'
  preferredGpuBrand = 'all', // 'nvidia' | 'amd' | 'all'
  selectedGameId = null,
}) {
  const budgetNum = Number(targetBudget) || 0;

  // 1. Calculate minimum feasible build cost with in-stock products
  const minStatus = calculateMinimumBuildCost(allProducts);

  if (!minStatus.isFeasible) {
    return {
      status: 'catalog_unavailable',
      message: 'Current inventory lacks essential in-stock hardware categories to build a complete PC.',
      missingCategories: minStatus.missingCategories,
      build: null,
      totalCost: 0,
      isCompatible: false,
    };
  }

  // 2. Strict Budget Check: If target budget is below minimum feasible build
  if (budgetNum > 0 && budgetNum < minStatus.minimumCost) {
    const shortfall = minStatus.minimumCost - budgetNum;
    return {
      status: 'insufficient_budget',
      userBudget: budgetNum,
      minimumRequiredBudget: minStatus.minimumCost,
      shortfall,
      message: `Your target budget of Rs. ${budgetNum.toLocaleString()} is below the minimum required budget for available in-stock components.`,
      explanation: `The most cost-effective 100% compatible PC build with currently in-stock G-Lab inventory requires Rs. ${minStatus.minimumCost.toLocaleString()}. Your entered budget has a shortfall of Rs. ${shortfall.toLocaleString()}.`,
      alternatives: [
        {
          title: `Upgrade Budget to Rs. ${minStatus.minimumCost.toLocaleString()}`,
          desc: 'Enables our high-performance baseline configuration with current in-stock components.',
        },
        {
          title: 'Manual Component Assembly',
          desc: 'Use Manual Mode to selectively assemble components, or wait for budget-tier inventory restocks.',
        },
      ],
      build: null,
      totalCost: 0,
      isCompatible: false,
    };
  }

  // 3. Build within budget using in-stock products
  const inv = categorizeInventory(allProducts, true);

  // Filter CPUs by preferred brand
  let candidateCpus = inv.cpus;
  if (preferredCpuBrand === 'amd') {
    const filtered = candidateCpus.filter((c) => c.brand?.toLowerCase().includes('amd') || c.name?.toLowerCase().includes('ryzen'));
    if (filtered.length > 0) candidateCpus = filtered;
  } else if (preferredCpuBrand === 'intel') {
    const filtered = candidateCpus.filter((c) => c.brand?.toLowerCase().includes('intel') || c.name?.toLowerCase().includes('core'));
    if (filtered.length > 0) candidateCpus = filtered;
  }

  // Filter GPUs by preferred brand
  let candidateGpus = inv.gpus;
  if (preferredGpuBrand === 'nvidia') {
    const filtered = candidateGpus.filter((g) => g.name?.toLowerCase().includes('rtx') || g.brand?.toLowerCase().includes('nvidia') || g.name?.toLowerCase().includes('geforce'));
    if (filtered.length > 0) candidateGpus = filtered;
  } else if (preferredGpuBrand === 'amd') {
    const filtered = candidateGpus.filter((g) => g.name?.toLowerCase().includes('radeon') || g.name?.toLowerCase().includes('rx '));
    if (filtered.length > 0) candidateGpus = filtered;
  }

  // Helper to sort by price ascending
  const sortByPriceAsc = (arr) => [...arr].sort((a, b) => (a.price || 0) - (b.price || 0));
  const sortedCases = sortByPriceAsc(inv.cases);
  const sortedStorage = sortByPriceAsc(inv.storage);
  const sortedRam = sortByPriceAsc(inv.ram);
  const sortedPsus = sortByPriceAsc(inv.psus);

  const selectedCase = sortedCases[0] || minStatus.cheapestBuild.pcCase;

  // Best compatible CPU + Motherboard match
  let selectedCpu = null;
  let selectedMobo = null;

  // For high-end gaming/workstation, start from highest and step down to respect budget
  const sortedCpus = [...candidateCpus].sort((a, b) => {
    if (purpose === 'workstation' || purpose === 'aaa_gaming') return (b.price || 0) - (a.price || 0);
    return (a.price || 0) - (b.price || 0);
  });

  for (const cpu of sortedCpus) {
    const matchingMobo = inv.motherboards.find((m) => m.socket?.toUpperCase() === cpu.socket?.toUpperCase());
    if (matchingMobo) {
      selectedCpu = cpu;
      selectedMobo = matchingMobo;
      break;
    }
  }

  if (!selectedCpu) {
    selectedCpu = minStatus.cheapestBuild.cpu;
    selectedMobo = minStatus.cheapestBuild.motherboard;
  }

  // RAM matching Motherboard DDR standard (prefer DDR5)
  const ramStandard = selectedMobo?.ramType || 'DDR5';
  const matchingRamList = sortedRam.filter((r) => !r.ramType || r.ramType.toUpperCase() === ramStandard.toUpperCase());
  const selectedRam = (purpose === 'workstation' || budgetNum > 650000)
    ? (matchingRamList.find((r) => r.capacityGB >= 32) || matchingRamList[matchingRamList.length - 1] || sortedRam[0])
    : (matchingRamList[0] || sortedRam[0]);

  // Storage: NVMe M.2
  const selectedStorage = budgetNum > 700000
    ? (sortedStorage.find((s) => (s.capacityGB || 0) >= 2000) || sortedStorage[sortedStorage.length - 1] || sortedStorage[0])
    : (sortedStorage[0] || null);

  // GPU target selection: ~40% of budget
  const targetGpuCost = Math.max(budgetNum * 0.4, 115000);
  let selectedGpu = null;
  if (candidateGpus.length > 0) {
    const sortedGpus = [...candidateGpus].sort((a, b) => Math.abs((a.price || 0) - targetGpuCost) - Math.abs((b.price || 0) - targetGpuCost));
    selectedGpu = sortedGpus[0];
  } else {
    selectedGpu = minStatus.cheapestBuild.gpu;
  }

  // PSU: calculate power requirements and select adequate PSU with 25% safety margin
  const estLoad = 75 + (selectedCpu?.tdp || 120) + (selectedGpu?.powerConsumption || 200);
  const minPsuWattage = Math.ceil((estLoad * 1.25) / 50) * 50;
  const adequatePsus = sortedPsus.filter((p) => (p.wattage || 650) >= minPsuWattage);
  const selectedPsu = adequatePsus[0] || sortedPsus[sortedPsus.length - 1] || minStatus.cheapestBuild.psu;

  let currentBuild = {
    pcCase: selectedCase,
    motherboard: selectedMobo,
    cpu: selectedCpu,
    cooler: FALLBACK_COOLER,
    ram: selectedRam,
    gpu: selectedGpu,
    storage: selectedStorage,
    psu: selectedPsu,
    fans: FALLBACK_FANS,
  };

  let totalCost = Object.values(currentBuild).reduce((sum, p) => sum + (p?.price || 0), 0);

  // If initial selection exceeds budget, step down GPU or CPU until within budget
  if (budgetNum > 0 && totalCost > budgetNum) {
    // Step down GPU to cheaper candidate
    const cheaperGpus = sortByPriceAsc(candidateGpus);
    for (const g of cheaperGpus) {
      currentBuild.gpu = g;
      totalCost = Object.values(currentBuild).reduce((sum, p) => sum + (p?.price || 0), 0);
      if (totalCost <= budgetNum) break;
    }
  }

  // If still over budget, fallback to minimum feasible build
  if (budgetNum > 0 && totalCost > budgetNum) {
    currentBuild = { ...minStatus.cheapestBuild };
    totalCost = minStatus.minimumCost;
  }

  // Final check: Never return build over budget
  if (budgetNum > 0 && totalCost > budgetNum) {
    const shortfall = totalCost - budgetNum;
    return {
      status: 'insufficient_budget',
      userBudget: budgetNum,
      minimumRequiredBudget: totalCost,
      shortfall,
      message: `Your target budget of Rs. ${budgetNum.toLocaleString()} is below the minimum required budget for available in-stock components.`,
      explanation: `The most cost-effective 100% compatible PC build with currently in-stock G-Lab inventory requires Rs. ${totalCost.toLocaleString()}. Your entered budget has a shortfall of Rs. ${shortfall.toLocaleString()}.`,
      alternatives: [
        {
          title: `Upgrade Budget to Rs. ${totalCost.toLocaleString()}`,
          desc: 'Enables our high-performance baseline configuration with current in-stock components.',
        },
        {
          title: 'Manual Component Assembly',
          desc: 'Use Manual Mode to selectively assemble components, or wait for budget-tier inventory restocks.',
        },
      ],
      build: null,
      totalCost: 0,
      isCompatible: false,
    };
  }

  const validation = validateBuildCompatibility(currentBuild);

  return {
    status: 'success',
    build: currentBuild,
    totalCost,
    isCompatible: validation.isCompatible,
    checks: validation.checks,
    estimatedPower: validation.powerAnalysis.estimatedPower,
    recommendedPsuWattage: validation.powerAnalysis.recommendedPsuWattage,
  };
}

/**
 * Checks how well a given build performs against a selected game's hardware specs.
 */
export function evaluateGamePerformance(build, gameId, userBudget = 0) {
  const game = GAMES_DATABASE.find((g) => g.id === gameId);
  if (!game) return null;

  const { cpu, gpu, ram, storage } = build || {};
  const checks = [];

  // 1. CPU Check
  if (!cpu) {
    checks.push({ item: 'CPU', status: 'missing', message: 'No processor installed' });
  } else {
    const cores = cpu.cores || 8;
    if (cores >= (game.recommended.cores || 6)) {
      checks.push({ item: 'CPU', status: 'recommended', message: `${cpu.name} surpasses recommended requirements` });
    } else if (cores >= (game.minimum.cores || 4)) {
      checks.push({ item: 'CPU', status: 'minimum', message: `${cpu.name} satisfies minimum requirements` });
    } else {
      checks.push({ item: 'CPU', status: 'below', message: `${cpu.name} is below recommended core count` });
    }
  }

  // 2. GPU Check
  if (!gpu) {
    checks.push({ item: 'Graphics (GPU)', status: 'missing', message: 'No graphics card installed' });
  } else {
    const vram = gpu.vramGB || 8;
    if (vram >= (game.recommended.vramGB || 8)) {
      checks.push({ item: 'Graphics (GPU)', status: 'recommended', message: `${gpu.name} (${vram}GB VRAM) ready for High/Ultra graphics` });
    } else if (vram >= (game.minimum.vramGB || 4)) {
      checks.push({ item: 'Graphics (GPU)', status: 'minimum', message: `${gpu.name} satisfies minimum requirements` });
    } else {
      checks.push({ item: 'Graphics (GPU)', status: 'below', message: `${gpu.name} has low VRAM for this title` });
    }
  }

  // 3. RAM Check
  if (!ram) {
    checks.push({ item: 'Memory (RAM)', status: 'missing', message: 'No RAM installed' });
  } else {
    const capacity = ram.capacityGB || 16;
    if (capacity >= (game.recommended.ramGB || 16)) {
      checks.push({ item: 'Memory (RAM)', status: 'recommended', message: `${capacity}GB RAM exceeds recommended spec` });
    } else if (capacity >= (game.minimum.ramGB || 8)) {
      checks.push({ item: 'Memory (RAM)', status: 'minimum', message: `${capacity}GB RAM satisfies minimum spec` });
    } else {
      checks.push({ item: 'Memory (RAM)', status: 'below', message: `${capacity}GB RAM may cause stuttering` });
    }
  }

  // 4. Budget Feasibility Check (if user budget provided)
  const budgetStatus = userBudget > 0 && userBudget < game.minEstimatedBudget
    ? {
        isSufficient: false,
        shortfall: game.minEstimatedBudget - userBudget,
        minEstimatedBudget: game.minEstimatedBudget,
      }
    : {
        isSufficient: true,
        shortfall: 0,
        minEstimatedBudget: game.minEstimatedBudget,
      };

  // Overall tier
  const hasBelow = checks.some((c) => c.status === 'below' || c.status === 'missing');
  const allRecommended = checks.every((c) => c.status === 'recommended');

  let tier = 'playable';
  let tierLabel = 'Playable';
  let badgeColor = 'text-warning';

  if (allRecommended) {
    tier = 'high_fps';
    tierLabel = 'Recommended 60-144+ FPS';
    badgeColor = 'text-success';
  } else if (hasBelow) {
    tier = 'insufficient';
    tierLabel = 'Upgrade Recommended';
    badgeColor = 'text-danger';
  }

  return {
    game,
    tier,
    tierLabel,
    badgeColor,
    checks,
    budgetStatus,
  };
}

/**
 * Calculates the minimum cost to build a PC satisfying a game's target requirements.
 * targetLevel can be:
 * - '1080p' (satisfies minimum requirements)
 * - '1440p' (satisfies recommended requirements)
 * - '4k' (enthusiast: >= 12GB VRAM GPU, >= 8-core CPU, >= 32GB RAM)
 */
export function calculateMinimumGameBuildCost(allProducts = [], gameId, targetLevel = '1440p') {
  const game = GAMES_DATABASE.find((g) => g.id === gameId);
  const minStatus = calculateMinimumBuildCost(allProducts);

  if (!minStatus.isFeasible) {
    return minStatus;
  }

  if (!game) {
    return minStatus;
  }

  const inv = categorizeInventory(allProducts, true);

  // Determine criteria based on targetLevel
  let reqCores = 4;
  let reqVram = 4;
  let reqRam = 8;

  if (targetLevel === '1080p') {
    reqCores = game.minimum?.cores || 4;
    reqVram = game.minimum?.vramGB || 4;
    reqRam = game.minimum?.ramGB || 8;
  } else if (targetLevel === '4k') {
    reqCores = Math.max(game.recommended?.cores || 8, 8);
    reqVram = Math.max(game.recommended?.vramGB || 8, 12);
    reqRam = Math.max(game.recommended?.ramGB || 16, 32);
  } else {
    // Default: '1440p' / recommended
    reqCores = game.recommended?.cores || 6;
    reqVram = game.recommended?.vramGB || 8;
    reqRam = game.recommended?.ramGB || 16;
  }

  // Filter CPUs that meet core count
  let qualifiedCpus = inv.cpus.filter((c) => (c.cores || 8) >= reqCores);
  if (qualifiedCpus.length === 0) qualifiedCpus = inv.cpus;

  // Filter GPUs that meet VRAM count
  let qualifiedGpus = inv.gpus.filter((g) => (g.vramGB || 8) >= reqVram);
  if (qualifiedGpus.length === 0) qualifiedGpus = inv.gpus;

  // Filter RAM that meets capacity
  let qualifiedRam = inv.ram.filter((r) => (r.capacityGB || 16) >= reqRam);
  if (qualifiedRam.length === 0) qualifiedRam = inv.ram;

  // Find cheapest compatible (CPU, Motherboard) pair
  let cheapestPair = null;
  let lowestPairPrice = Infinity;

  qualifiedCpus.forEach((cpu) => {
    const matchingMobos = inv.motherboards.filter(
      (m) => m.socket && cpu.socket && m.socket.toUpperCase() === cpu.socket.toUpperCase()
    );
    matchingMobos.forEach((mobo) => {
      const pairPrice = (cpu.price || 0) + (mobo.price || 0);
      if (pairPrice < lowestPairPrice) {
        lowestPairPrice = pairPrice;
        cheapestPair = { cpu, mobo };
      }
    });
  });

  if (!cheapestPair) {
    cheapestPair = { cpu: minStatus.cheapestBuild.cpu, mobo: minStatus.cheapestBuild.motherboard };
  }

  const { cpu: selectedCpu, mobo: selectedMobo } = cheapestPair;

  // Cheapest matching RAM
  const moboRamType = selectedMobo.ramType || 'DDR5';
  const matchingRam = qualifiedRam.filter((r) => !r.ramType || r.ramType.toUpperCase() === moboRamType.toUpperCase());
  const selectedRam = matchingRam.sort((a, b) => (a.price || 0) - (b.price || 0))[0] || inv.ram[0];

  // Cheapest qualified GPU
  const selectedGpu = [...qualifiedGpus].sort((a, b) => (a.price || 0) - (b.price || 0))[0] || minStatus.cheapestBuild.gpu;

  // Cheapest case & storage
  const selectedCase = [...inv.cases].sort((a, b) => (a.price || 0) - (b.price || 0))[0] || minStatus.cheapestBuild.pcCase;
  const selectedStorage = [...inv.storage].sort((a, b) => (a.price || 0) - (b.price || 0))[0] || minStatus.cheapestBuild.storage;

  // Adequate PSU
  const estPower = 75 + (selectedCpu.tdp || 120) + (selectedGpu.powerConsumption || 200);
  const minRequiredWattage = Math.ceil((estPower * 1.25) / 50) * 50;
  const adequatePsus = inv.psus.filter((p) => (p.wattage || 650) >= minRequiredWattage);
  const selectedPsu = adequatePsus.sort((a, b) => (a.price || 0) - (b.price || 0))[0] || inv.psus[0];

  const gameBuild = {
    pcCase: selectedCase,
    motherboard: selectedMobo,
    cpu: selectedCpu,
    cooler: FALLBACK_COOLER,
    ram: selectedRam,
    gpu: selectedGpu,
    storage: selectedStorage,
    psu: selectedPsu,
    fans: FALLBACK_FANS,
  };

  const minimumCost = Object.values(gameBuild).reduce((sum, p) => sum + (p?.price || 0), 0);

  return {
    isFeasible: true,
    minimumCost: Math.max(minimumCost, minStatus.minimumCost),
    cheapestBuild: gameBuild,
    game,
    targetLevel,
  };
}

/**
 * Real-time verification of whether the user's budget can satisfy the selected game target.
 */
export function evaluateGameBudgetFeasibility({
  allProducts = [],
  gameId,
  targetBudget = 0,
  targetLevel = '1440p',
}) {
  const game = GAMES_DATABASE.find((g) => g.id === gameId);
  const budgetNum = Number(targetBudget) || 0;

  const gameCostResult = calculateMinimumGameBuildCost(allProducts, gameId, targetLevel);

  if (!gameCostResult.isFeasible) {
    return {
      isFeasible: false,
      status: 'catalog_unavailable',
      message: 'Current inventory lacks essential hardware categories to configure a PC.',
      userBudget: budgetNum,
      minimumCost: 0,
      shortfall: 0,
      alternatives: [],
    };
  }

  const minRequired = gameCostResult.minimumCost;

  if (budgetNum > 0 && budgetNum < minRequired) {
    const shortfall = minRequired - budgetNum;

    // Realistic, actionable alternatives formatted as Options 1-4
    const alternatives = [];

    // Option 1: Increase budget
    alternatives.push({
      id: 'increase_budget',
      optionNumber: 1,
      title: `Option 1: Increase budget to Rs. ${minRequired.toLocaleString()}`,
      desc: `Meets the exact minimum inventory cost for ${game?.name || 'this game'} at ${targetLevel.toUpperCase()} (Shortfall: Rs. ${shortfall.toLocaleString()}).`,
    });

    // Option 2: Lower resolution target
    if (targetLevel === '4k') {
      alternatives.push({
        id: 'lower_resolution_1440p',
        optionNumber: 2,
        title: 'Option 2: Target 1440p instead of 4K',
        desc: 'Reduces required GPU VRAM and processing demands to fit a more moderate budget.',
      });
    } else if (targetLevel !== '1080p') {
      alternatives.push({
        id: 'lower_target_1080p',
        optionNumber: 2,
        title: `Option 2: Target 1080p instead of ${targetLevel.toUpperCase()}`,
        desc: 'Enables smooth playable framerates using baseline gaming hardware.',
      });
    } else {
      alternatives.push({
        id: 'lower_resolution_1080p',
        optionNumber: 2,
        title: 'Option 2: Optimize in-game render scale / FSR / DLSS',
        desc: 'Reduces native rendering workload while maintaining smooth framerates on budget hardware.',
      });
    }

    // Option 3: Lower performance target
    alternatives.push({
      id: 'lower_performance_target',
      optionNumber: 3,
      title: 'Option 3: Choose a lower performance target',
      desc: 'Target medium/standard graphics settings or 60 FPS standard rather than ultra ray tracing.',
    });

    // Option 4: More affordable GPU
    alternatives.push({
      id: 'budget_gpu',
      optionNumber: 4,
      title: 'Option 4: Use a more affordable GPU',
      desc: 'Select a cost-effective discrete GPU from available inventory to reduce overall system price.',
    });

    return {
      isFeasible: false,
      status: 'insufficient_budget',
      game,
      targetLevel,
      userBudget: budgetNum,
      minimumCost: minRequired,
      shortfall,
      message: `⚠ Budget insufficient`,
      explanation: `Minimum estimated build with in-stock parts is Rs. ${minRequired.toLocaleString()}, creating a shortfall of Rs. ${shortfall.toLocaleString()}.`,
      alternatives,
    };
  }

  return {
    isFeasible: true,
    status: 'sufficient_budget',
    game,
    targetLevel,
    userBudget: budgetNum,
    minimumCost: minRequired,
    headroom: Math.max(0, budgetNum - minRequired),
    message: `✓ Budget appears sufficient for the selected target`,
    explanation: `Your entered budget of Rs. ${budgetNum.toLocaleString()} satisfies the minimum estimated build cost of Rs. ${minRequired.toLocaleString()} for ${game?.name || 'this game'} at ${targetLevel}.`,
    alternatives: [],
  };
}

/**
 * Generates an optimized, 100% compatible build for a specific game and target resolution.
 * Strictly respects the user's budget. Never generates an over-budget build!
 */
export function generateGameBuild({
  allProducts = [],
  gameId,
  targetBudget = 0,
  targetLevel = '1440p',
}) {
  const budgetNum = Number(targetBudget) || 0;

  // 1. Feasibility check
  const feasibility = evaluateGameBudgetFeasibility({
    allProducts,
    gameId,
    targetBudget: budgetNum,
    targetLevel,
  });

  if (!feasibility.isFeasible) {
    return {
      status: 'insufficient_budget',
      feasibility,
      build: null,
      totalCost: 0,
      userBudget: budgetNum,
      minimumCost: feasibility.minimumCost,
      shortfall: feasibility.shortfall,
      message: 'No compatible build is currently available within your budget.',
      alternatives: feasibility.alternatives,
    };
  }

  // 2. Generate build using auto build engine with targetBudget constraint
  const autoResult = generateAutoBuild({
    allProducts,
    targetBudget: budgetNum,
    purpose: 'aaa_gaming',
    selectedGameId: gameId,
  });

  if (
    autoResult.status !== 'success' ||
    !autoResult.build ||
    (budgetNum > 0 && autoResult.totalCost > budgetNum)
  ) {
    return {
      status: 'insufficient_budget',
      feasibility,
      build: null,
      totalCost: 0,
      userBudget: budgetNum,
      minimumCost: feasibility.minimumCost,
      shortfall: autoResult.shortfall || (autoResult.totalCost ? autoResult.totalCost - budgetNum : feasibility.shortfall),
      message: 'No compatible build is currently available within your budget.',
      alternatives: feasibility.alternatives,
    };
  }

  return {
    status: 'success',
    feasibility,
    build: autoResult.build,
    totalCost: autoResult.totalCost,
    userBudget: budgetNum,
    isCompatible: autoResult.isCompatible,
    checks: autoResult.checks,
    estimatedPower: autoResult.estimatedPower,
    recommendedPsuWattage: autoResult.recommendedPsuWattage,
  };
}
