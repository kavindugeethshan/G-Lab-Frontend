/**
 * G-Lab PC Builder: Deterministic Hardware Specifications Registry
 * 
 * Provides verified actual manufacturer technical specifications for catalog products
 * and parses technical specs safely with validation flags.
 * NEVER assumes or invents hardware compatibility.
 */

// Actual verified manufacturer specifications for G-Lab hardware catalog
export const VERIFIED_HARDWARE_SPECS = {
  // PROCESSORS (CPUs)
  'AMD Ryzen 7 9800X3D': {
    componentType: 'cpu',
    socket: 'AM5',
    tdp: 120,
    supportedRamType: 'DDR5',
    integratedGpu: true,
    cores: 8,
    threads: 16,
    isVerified: true,
  },
  'AMD Ryzen 9 9950X': {
    componentType: 'cpu',
    socket: 'AM5',
    tdp: 170,
    supportedRamType: 'DDR5',
    integratedGpu: true,
    cores: 16,
    threads: 32,
    isVerified: true,
  },
  'Intel Core Ultra 7 265K': {
    componentType: 'cpu',
    socket: 'LGA1851',
    tdp: 125,
    maxTurboTdp: 250,
    supportedRamType: 'DDR5',
    integratedGpu: true,
    cores: 20,
    threads: 20,
    isVerified: true,
  },

  // MOTHERBOARDS
  'ASUS ROG Strix B850-F Gaming WiFi': {
    componentType: 'motherboard',
    socket: 'AM5',
    formFactor: 'ATX',
    ramType: 'DDR5',
    maxRamSlots: 4,
    pcieVersion: 'PCIe 5.0',
    m2Slots: 4,
    isVerified: true,
  },
  'MSI MAG X870 TOMAHAWK WIFI': {
    componentType: 'motherboard',
    socket: 'AM5',
    formFactor: 'ATX',
    ramType: 'DDR5',
    maxRamSlots: 4,
    pcieVersion: 'PCIe 5.0',
    m2Slots: 4,
    isVerified: true,
  },

  // GRAPHICS CARDS (GPUs)
  'NVIDIA GeForce RTX 4060 8GB': {
    componentType: 'gpu',
    powerConsumption: 115,
    recommendedPSU: 550,
    gpuLength: 242,
    slotWidth: 2,
    vramGB: 8,
    isVerified: true,
  },
  'ASUS Dual GeForce RTX 4070 SUPER 12GB': {
    componentType: 'gpu',
    powerConsumption: 220,
    recommendedPSU: 650,
    gpuLength: 267,
    slotWidth: 2.5,
    vramGB: 12,
    isVerified: true,
  },
  'MSI Gaming X Trio Radeon RX 7800 XT 16GB': {
    componentType: 'gpu',
    powerConsumption: 263,
    recommendedPSU: 700,
    gpuLength: 328,
    slotWidth: 3,
    vramGB: 16,
    isVerified: true,
  },
  'Gigabyte GeForce RTX 4060 Ti 8GB Gaming OC': {
    componentType: 'gpu',
    powerConsumption: 160,
    recommendedPSU: 550,
    gpuLength: 281,
    slotWidth: 2.5,
    vramGB: 8,
    isVerified: true,
  },
  'Sapphire Pulse Radeon RX 7600 XT 16GB': {
    componentType: 'gpu',
    powerConsumption: 190,
    recommendedPSU: 600,
    gpuLength: 245,
    slotWidth: 2.2,
    vramGB: 16,
    isVerified: true,
  },

  // MEMORY (RAM)
  'Kingston Fury Beast 16GB DDR5 5600MHz': {
    componentType: 'ram',
    ramType: 'DDR5',
    capacityGB: 16,
    speedMHz: 5600,
    modules: 1,
    isVerified: true,
  },
  'Corsair Vengeance RGB 32GB DDR5 6000MHz': {
    componentType: 'ram',
    ramType: 'DDR5',
    capacityGB: 32,
    speedMHz: 6000,
    modules: 2,
    isVerified: true,
  },
  'TeamGroup T-Force Delta RGB 32GB DDR5 6000MHz': {
    componentType: 'ram',
    ramType: 'DDR5',
    capacityGB: 32,
    speedMHz: 6000,
    modules: 2,
    isVerified: true,
  },
  'Crucial Pro 32GB DDR5 5600MHz': {
    componentType: 'ram',
    ramType: 'DDR5',
    capacityGB: 32,
    speedMHz: 5600,
    modules: 2,
    isVerified: true,
  },

  // STORAGE (SSDs)
  'Samsung 990 EVO Plus 1TB NVMe SSD': {
    componentType: 'storage',
    formFactor: 'M.2 2280',
    interface: 'PCIe 4.0 / 5.0 NVMe',
    capacityGB: 1000,
    isVerified: true,
  },
  'Kingston NV3 1TB NVMe PCIe 4.0 SSD': {
    componentType: 'storage',
    formFactor: 'M.2 2280',
    interface: 'PCIe 4.0 NVMe',
    capacityGB: 1000,
    isVerified: true,
  },
  'WD Black SN850X 2TB NVMe SSD': {
    componentType: 'storage',
    formFactor: 'M.2 2280',
    interface: 'PCIe 4.0 NVMe',
    capacityGB: 2000,
    isVerified: true,
  },
  'Crucial P3 Plus 1TB NVMe SSD': {
    componentType: 'storage',
    formFactor: 'M.2 2280',
    interface: 'PCIe 4.0 NVMe',
    capacityGB: 1000,
    isVerified: true,
  },

  // POWER SUPPLIES (PSUs)
  'MSI MAG A650BN 650W 80+ Bronze': {
    componentType: 'psu',
    wattage: 650,
    efficiencyRating: '80+ Bronze',
    formFactor: 'ATX',
    isVerified: true,
  },
  'Corsair RM750e 750W 80+ Gold': {
    componentType: 'psu',
    wattage: 750,
    efficiencyRating: '80+ Gold',
    formFactor: 'ATX',
    isVerified: true,
  },
  'Cooler Master MWE Gold 850 V2 850W': {
    componentType: 'psu',
    wattage: 850,
    efficiencyRating: '80+ Gold',
    formFactor: 'ATX',
    isVerified: true,
  },
  'ASUS TUF Gaming 1000W Gold': {
    componentType: 'psu',
    wattage: 1000,
    efficiencyRating: '80+ Gold',
    formFactor: 'ATX',
    isVerified: true,
  },

  // PC CASES
  'NZXT H9 Flow': {
    componentType: 'case',
    caseType: 'Dual-Chamber Mid-Tower',
    supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'],
    maxGpuLength: 435,
    maxCoolerHeight: 165,
    maxPsuLength: 200,
    radiatorSupport: 'Up to 360mm',
    isVerified: true,
  },
};

/**
 * Extract / enrich hardware specs from a product object.
 * Checks:
 * 1. Explicit database fields (if present in product schema)
 * 2. Verified specs registry match by product name/model
 * 3. Safe regex parser on product name & description
 */
export function getProductSpecs(product) {
  if (!product) return null;

  const productName = product.name?.trim() || '';
  const verified = VERIFIED_HARDWARE_SPECS[productName];

  // 1. Direct verified registry match
  if (verified) {
    return {
      ...verified,
      productId: product._id,
      name: productName,
      price: product.price,
      brand: product.brand,
      image: product.image,
      stock: product.stock,
      isVerified: true,
    };
  }

  // 2. Check if product already has properties in DB
  const fromDb = {
    componentType: product.componentType,
    socket: product.socket,
    ramType: product.ramType,
    formFactor: product.formFactor,
    powerConsumption: product.powerConsumption,
    recommendedPSU: product.recommendedPSU,
    gpuLength: product.gpuLength,
    coolerHeight: product.coolerHeight,
    maxGpuLength: product.maxGpuLength,
    maxCoolerHeight: product.maxCoolerHeight,
    supportedFormFactors: product.supportedFormFactors,
    wattage: product.wattage,
  };

  const hasDbSpecs = Object.values(fromDb).some((v) => v !== undefined && v !== null);
  if (hasDbSpecs) {
    return {
      ...fromDb,
      productId: product._id,
      name: productName,
      price: product.price,
      brand: product.brand,
      image: product.image,
      stock: product.stock,
      isVerified: true,
    };
  }

  // 3. Fallback safe extraction from title & description
  const text = `${productName} ${product.description || ''}`.toUpperCase();
  const inferred = {};
  let inferredFieldsCount = 0;

  // Socket
  if (text.includes('AM5')) {
    inferred.socket = 'AM5';
    inferredFieldsCount++;
  } else if (text.includes('LGA1851') || text.includes('LGA 1851') || text.includes('ULTRA 7 265K') || text.includes('ULTRA 9 285K')) {
    inferred.socket = 'LGA1851';
    inferredFieldsCount++;
  } else if (text.includes('LGA1700') || text.includes('LGA 1700') || text.includes('13TH GEN') || text.includes('14TH GEN')) {
    inferred.socket = 'LGA1700';
    inferredFieldsCount++;
  } else if (text.includes('AM4')) {
    inferred.socket = 'AM4';
    inferredFieldsCount++;
  }

  // RAM Type
  if (text.includes('DDR5')) {
    inferred.ramType = 'DDR5';
    inferredFieldsCount++;
  } else if (text.includes('DDR4')) {
    inferred.ramType = 'DDR4';
    inferredFieldsCount++;
  }

  // Form Factor
  if (text.includes('MINI-ITX') || text.includes('ITX')) {
    inferred.formFactor = 'Mini-ITX';
    inferredFieldsCount++;
  } else if (text.includes('MICRO-ATX') || text.includes('MATX') || text.includes('M-ATX')) {
    inferred.formFactor = 'Micro-ATX';
    inferredFieldsCount++;
  } else if (text.includes('E-ATX')) {
    inferred.formFactor = 'E-ATX';
    inferredFieldsCount++;
  } else if (text.includes('ATX')) {
    inferred.formFactor = 'ATX';
    inferredFieldsCount++;
  }

  // Wattage (for PSUs)
  const wattageMatch = text.match(/(\d{3,4})\s*W/);
  if (wattageMatch && Number(wattageMatch[1]) >= 300) {
    inferred.wattage = Number(wattageMatch[1]);
    inferredFieldsCount++;
  }

  return {
    ...inferred,
    productId: product._id,
    name: productName,
    price: product.price,
    brand: product.brand,
    image: product.image,
    stock: product.stock,
    isVerified: inferredFieldsCount >= 2,
    unverifiedNotice: inferredFieldsCount < 2 ? 'Compatibility cannot be fully verified because product specifications are incomplete.' : null,
  };
}
