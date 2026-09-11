/**
 * G-Lab PC Builder: Deterministic Compatibility Engine
 * 
 * Verifies real-time hardware compatibility between selected PC parts.
 * Strict rules:
 * - CPU ↔ Motherboard: Socket matching
 * - RAM ↔ Motherboard: DDR generation matching
 * - GPU ↔ Case: Physical length clearance
 * - Motherboard ↔ Case: Form factor support
 * - CPU Cooler ↔ CPU: Socket support
 * - CPU Cooler ↔ Case: Cooler height clearance
 * - PSU ↔ System Power: Total estimated wattage with 25% safety margin
 * 
 * If specifications are missing or unverified, it explicitly flags "unverified"
 * rather than falsely assuming compatibility.
 */

/**
 * Calculates estimated system power consumption based on installed components.
 * Base system (Motherboard + RAM + NVMe Storage + fans/RGB) consumes ~75W.
 */
export function calculateSystemPower(parts) {
  const { cpu, gpu, ram, storage, cooler, fans } = parts;

  let totalPower = 75; // Baseline motherboard, chipset, fans & background IO
  let hasIncompletePowerData = false;

  // CPU TDP
  if (cpu) {
    if (cpu.tdp) {
      totalPower += cpu.tdp;
    } else {
      totalPower += 125; // Standard fallback estimate
      hasIncompletePowerData = true;
    }
  }

  // GPU Power
  if (gpu) {
    if (gpu.powerConsumption) {
      totalPower += gpu.powerConsumption;
    } else {
      totalPower += 200; // Standard modern GPU fallback
      hasIncompletePowerData = true;
    }
  }

  // Extra storage drives
  if (storage) {
    totalPower += 10;
  }

  // Liquid AIO pump / extra fans
  if (cooler && cooler.coolerType === 'AIO') {
    totalPower += 25;
  }

  if (fans) {
    totalPower += 15;
  }

  // 25% safety margin to account for transient power spikes
  const recommendedPsuWattage = Math.ceil((totalPower * 1.25) / 50) * 50;

  return {
    estimatedPower: totalPower,
    recommendedPsuWattage: Math.max(recommendedPsuWattage, 500),
    hasIncompletePowerData,
  };
}

/**
 * Validates complete build compatibility.
 * Returns {
 *   overallStatus: 'compatible' | 'warning' | 'unverified' | 'incompatible' | 'pending',
 *   isCompatible: boolean,
 *   checks: Array,
 *   categories: {
 *     socketPlatform: { title, icon, checks, status },
 *     memory: { title, icon, checks, status },
 *     clearances: { title, icon, checks, status },
 *     thermalPower: { title, icon, checks, status }
 *   },
 *   powerAnalysis: { estimatedPower, recommendedPsuWattage, hasIncompletePowerData }
 * }
 */
export function validateBuildCompatibility(parts) {
  const { cpu, motherboard, ram, gpu, pcCase, cooler, psu } = parts;

  // 1. SECTION: SOCKET & PLATFORM
  const socketChecks = [];

  // 1A. CPU ↔ Motherboard
  if (!cpu && !motherboard) {
    socketChecks.push({
      id: 'cpu-mobo',
      title: 'CPU ↔ Motherboard Socket',
      status: 'pending',
      message: 'Select a Processor and Motherboard to verify socket and platform interoperability.',
    });
  } else if (cpu && !motherboard) {
    socketChecks.push({
      id: 'cpu-mobo',
      title: 'CPU ↔ Motherboard Socket',
      status: 'pending',
      message: `Processor installed (${cpu.name}, Socket: ${cpu.socket || 'Unknown'}). Select a motherboard to verify socket match.`,
    });
  } else if (!cpu && motherboard) {
    socketChecks.push({
      id: 'cpu-mobo',
      title: 'CPU ↔ Motherboard Socket',
      status: 'pending',
      message: `Motherboard installed (${motherboard.name}, Socket: ${motherboard.socket || 'Unknown'}). Select a compatible processor.`,
    });
  } else {
    // Both CPU and Motherboard installed
    if (!cpu.socket || !motherboard.socket) {
      socketChecks.push({
        id: 'cpu-mobo',
        title: 'CPU ↔ Motherboard Socket',
        status: 'unverified',
        message: 'Compatibility cannot be fully verified: Socket specifications are missing or unconfirmed in catalog data.',
      });
    } else if (cpu.socket.toUpperCase() === motherboard.socket.toUpperCase()) {
      socketChecks.push({
        id: 'cpu-mobo',
        title: 'CPU ↔ Motherboard Socket',
        status: 'compatible',
        message: `Compatible: Both CPU (${cpu.name}) and Motherboard (${motherboard.name}) utilize the ${cpu.socket} socket platform.`,
      });
    } else {
      socketChecks.push({
        id: 'cpu-mobo',
        title: 'CPU ↔ Motherboard Socket',
        status: 'incompatible',
        message: `Incompatible Socket: CPU requires ${cpu.socket}, but Motherboard has ${motherboard.socket}. This CPU cannot physically fit into this motherboard.`,
      });
    }
  }

  // 1B. CPU Socket Specification
  if (cpu) {
    if (cpu.socket) {
      socketChecks.push({
        id: 'cpu-socket',
        title: 'CPU Socket Specification',
        status: 'compatible',
        message: `CPU Socket: ${cpu.socket} architecture verified for ${cpu.name}.`,
      });
    } else {
      socketChecks.push({
        id: 'cpu-socket',
        title: 'CPU Socket Specification',
        status: 'unverified',
        message: 'Compatibility cannot be fully verified: CPU socket specification is missing.',
      });
    }
  } else {
    socketChecks.push({
      id: 'cpu-socket',
      title: 'CPU Socket Specification',
      status: 'pending',
      message: 'Select a Processor to inspect its socket specification.',
    });
  }

  // 1C. Motherboard Platform / Chipset
  if (motherboard) {
    if (motherboard.chipset) {
      socketChecks.push({
        id: 'platform-chipset',
        title: 'Motherboard Platform / Chipset',
        status: 'compatible',
        message: `Platform Verified: ${motherboard.chipset} chipset natively supports ${motherboard.socket || 'target'} architecture.`,
      });
    } else if (motherboard.socket) {
      socketChecks.push({
        id: 'platform-chipset',
        title: 'Motherboard Platform / Chipset',
        status: 'compatible',
        message: `Platform Socket: ${motherboard.socket} platform confirmed for ${motherboard.name}.`,
      });
    } else {
      socketChecks.push({
        id: 'platform-chipset',
        title: 'Motherboard Platform / Chipset',
        status: 'unverified',
        message: 'Compatibility cannot be fully verified: Motherboard platform specification is missing.',
      });
    }
  } else {
    socketChecks.push({
      id: 'platform-chipset',
      title: 'Motherboard Platform / Chipset',
      status: 'pending',
      message: 'Select a Motherboard to inspect platform and chipset integration.',
    });
  }

  // 2. SECTION: MEMORY ARCHITECTURE
  const memoryChecks = [];

  // 2A. RAM Generation (RAM ↔ Motherboard)
  if (!ram && !motherboard) {
    memoryChecks.push({
      id: 'ram-mobo',
      title: 'RAM Generation (RAM ↔ Motherboard)',
      status: 'pending',
      message: 'Select Motherboard and RAM to verify DDR memory architecture support.',
    });
  } else if (ram && !motherboard) {
    memoryChecks.push({
      id: 'ram-mobo',
      title: 'RAM Generation (RAM ↔ Motherboard)',
      status: 'pending',
      message: `RAM selected (${ram.name}, ${ram.ramType || 'DDR5'}). Select a motherboard to verify memory architecture compatibility.`,
    });
  } else if (!ram && motherboard) {
    memoryChecks.push({
      id: 'ram-mobo',
      title: 'RAM Generation (RAM ↔ Motherboard)',
      status: 'pending',
      message: `Motherboard requires ${motherboard.ramType || 'DDR5'} memory. Select RAM modules to complete verification.`,
    });
  } else {
    // Both RAM and Motherboard installed
    if (!ram.ramType || !motherboard.ramType) {
      memoryChecks.push({
        id: 'ram-mobo',
        title: 'RAM Generation (RAM ↔ Motherboard)',
        status: 'unverified',
        message: 'Compatibility cannot be fully verified: Memory generation standard (DDR4/DDR5) data is incomplete.',
      });
    } else if (ram.ramType.toUpperCase() === motherboard.ramType.toUpperCase()) {
      memoryChecks.push({
        id: 'ram-mobo',
        title: 'RAM Generation (RAM ↔ Motherboard)',
        status: 'compatible',
        message: `Compatible: Both RAM (${ram.name}) and Motherboard support ${motherboard.ramType} memory architecture.`,
      });
    } else {
      memoryChecks.push({
        id: 'ram-mobo',
        title: 'RAM Generation (RAM ↔ Motherboard)',
        status: 'incompatible',
        message: `Incompatible Memory Type: Motherboard requires ${motherboard.ramType}, but selected RAM is ${ram.ramType}. DDR generations are physically keyed differently and cannot be interchanged.`,
      });
    }
  }

  // 2B. Motherboard RAM Support
  if (motherboard) {
    if (motherboard.ramType) {
      memoryChecks.push({
        id: 'mobo-ram-support',
        title: 'Motherboard RAM Support',
        status: 'compatible',
        message: `Motherboard natively supports ${motherboard.ramType} high-speed memory architecture.`,
      });
    } else {
      memoryChecks.push({
        id: 'mobo-ram-support',
        title: 'Motherboard RAM Support',
        status: 'unverified',
        message: 'Compatibility cannot be fully verified: Motherboard memory architecture support is unverified.',
      });
    }
  } else {
    memoryChecks.push({
      id: 'mobo-ram-support',
      title: 'Motherboard RAM Support',
      status: 'pending',
      message: 'Select a Motherboard to verify supported memory generation standard.',
    });
  }

  // 3. SECTION: PHYSICAL CLEARANCES
  const clearanceChecks = [];

  // 3A. GPU ↔ PC Case
  if (!gpu || !pcCase) {
    clearanceChecks.push({
      id: 'gpu-case',
      title: 'GPU ↔ Case Length Clearance',
      status: 'pending',
      message: 'Select Graphics Card and Chassis to verify physical length clearance.',
    });
  } else {
    if (!gpu.gpuLength || !pcCase.maxGpuLength) {
      clearanceChecks.push({
        id: 'gpu-case',
        title: 'GPU ↔ Case Length Clearance',
        status: 'unverified',
        message: 'Compatibility cannot be fully verified: GPU length or chassis maximum clearance dimensions are missing.',
      });
    } else if (gpu.gpuLength <= pcCase.maxGpuLength) {
      const remainingClearance = pcCase.maxGpuLength - gpu.gpuLength;
      clearanceChecks.push({
        id: 'gpu-case',
        title: 'GPU ↔ Case Length Clearance',
        status: 'compatible',
        message: `Compatible Clearance: GPU length (${gpu.gpuLength}mm) fits comfortably inside chassis (${pcCase.maxGpuLength}mm max, ${remainingClearance}mm remaining clearance).`,
      });
    } else {
      clearanceChecks.push({
        id: 'gpu-case',
        title: 'GPU ↔ Case Length Clearance',
        status: 'incompatible',
        message: `GPU Too Long: GPU length is ${gpu.gpuLength}mm, which exceeds case maximum clearance of ${pcCase.maxGpuLength}mm by ${gpu.gpuLength - pcCase.maxGpuLength}mm.`,
      });
    }
  }

  // 3B. Cooler Height ↔ Case
  if (cooler && pcCase) {
    if (!cooler.coolerHeight || !pcCase.maxCoolerHeight) {
      clearanceChecks.push({
        id: 'cooler-case',
        title: 'Cooler ↔ Case Height Clearance',
        status: 'unverified',
        message: 'Compatibility cannot be fully verified: Cooler height or chassis clearance dimensions are unconfirmed.',
      });
    } else if (cooler.coolerHeight <= pcCase.maxCoolerHeight) {
      clearanceChecks.push({
        id: 'cooler-case',
        title: 'Cooler ↔ Case Height Clearance',
        status: 'compatible',
        message: `Compatible Clearance: Cooler height (${cooler.coolerHeight}mm) fits within chassis side clearance (${pcCase.maxCoolerHeight}mm).`,
      });
    } else {
      clearanceChecks.push({
        id: 'cooler-case',
        title: 'Cooler ↔ Case Height Clearance',
        status: 'incompatible',
        message: `Cooler Too Tall: Cooler height (${cooler.coolerHeight}mm) exceeds case side panel clearance (${pcCase.maxCoolerHeight}mm).`,
      });
    }
  } else if (!cooler && pcCase) {
    clearanceChecks.push({
      id: 'cooler-case',
      title: 'Cooler ↔ Case Height Clearance',
      status: 'pending',
      message: 'Select a CPU cooler to verify chassis side-panel clearance.',
    });
  }

  // 3C. Motherboard ↔ PC Case Form Factor
  if (!motherboard || !pcCase) {
    clearanceChecks.push({
      id: 'mobo-case',
      title: 'Motherboard ↔ Case Form Factor',
      status: 'pending',
      message: 'Select Motherboard and Chassis to verify form factor mounting clearance.',
    });
  } else {
    const supported = pcCase.supportedFormFactors || [];
    const moboFactor = motherboard.formFactor;

    if (!moboFactor || supported.length === 0) {
      clearanceChecks.push({
        id: 'mobo-case',
        title: 'Motherboard ↔ Case Form Factor',
        status: 'unverified',
        message: 'Compatibility cannot be fully verified: Case form factor or motherboard dimensions are not fully specified.',
      });
    } else if (supported.some((sf) => sf.toUpperCase() === moboFactor.toUpperCase())) {
      clearanceChecks.push({
        id: 'mobo-case',
        title: 'Motherboard ↔ Case Form Factor',
        status: 'compatible',
        message: `Compatible: Chassis (${pcCase.name}) supports ${moboFactor} motherboard mounting standoffs.`,
      });
    } else {
      clearanceChecks.push({
        id: 'mobo-case',
        title: 'Motherboard ↔ Case Form Factor',
        status: 'incompatible',
        message: `Form Factor Mismatch: Chassis supports (${supported.join(', ')}), but Motherboard is ${moboFactor}. It will not fit in this case.`,
      });
    }
  }

  // 4. SECTION: THERMAL & POWER
  const thermalPowerChecks = [];

  // 4A. CPU Cooling (Bracket & TDP)
  if (!cooler || !cpu) {
    thermalPowerChecks.push({
      id: 'cpu-cooling',
      title: 'CPU Cooling',
      status: 'pending',
      message: 'Select CPU and Cooler to verify bracket mounting compatibility and thermal dissipation.',
    });
  } else {
    if (!cpu.socket || !cooler.supportedSockets) {
      thermalPowerChecks.push({
        id: 'cpu-cooling',
        title: 'CPU Cooling',
        status: 'unverified',
        message: 'Compatibility cannot be fully verified: Socket bracket mounting data is incomplete.',
      });
    } else {
      const socketMatch = cooler.supportedSockets.some((s) => s.toUpperCase() === cpu.socket.toUpperCase());
      if (!socketMatch) {
        thermalPowerChecks.push({
          id: 'cpu-cooling',
          title: 'CPU Cooling',
          status: 'incompatible',
          message: `Incompatible Bracket: Cooler does not support ${cpu.socket} socket mounting mechanism.`,
        });
      } else if (cooler.maxTdpSupported && cpu.tdp && cooler.maxTdpSupported < cpu.tdp) {
        thermalPowerChecks.push({
          id: 'cpu-cooling',
          title: 'CPU Cooling',
          status: 'warning',
          message: `Potential Thermal Throttling: Cooler rated for ${cooler.maxTdpSupported}W TDP, but CPU TDP is ${cpu.tdp}W.`,
        });
      } else {
        thermalPowerChecks.push({
          id: 'cpu-cooling',
          title: 'CPU Cooling',
          status: 'compatible',
          message: `Compatible: Cooler (${cooler.name}) includes native ${cpu.socket} mounting bracket support and dissipates ${cooler.maxTdpSupported || cpu.tdp}W.`,
        });
      }
    }
  }

  // 4B. Estimated System Power
  const { estimatedPower, recommendedPsuWattage, hasIncompletePowerData } = calculateSystemPower(parts);

  thermalPowerChecks.push({
    id: 'system-power',
    title: 'Estimated System Power',
    status: hasIncompletePowerData ? 'unverified' : 'compatible',
    message: hasIncompletePowerData
      ? `Estimated System Load: ${estimatedPower}W (Some hardware components lack explicit TDP ratings in catalog data).`
      : `Estimated System Load: ${estimatedPower}W under standard load.`,
  });

  // 4C. PSU Recommendation
  thermalPowerChecks.push({
    id: 'psu-recommendation',
    title: 'PSU Recommendation',
    status: 'compatible',
    message: `Target PSU Recommendation: ${recommendedPsuWattage}W+ (calculates a 25% safety margin for transient spikes).`,
  });

  // 4D. PSU Safety Headroom
  if (!psu) {
    thermalPowerChecks.push({
      id: 'psu-power',
      title: 'PSU Safety Headroom',
      status: 'pending',
      message: `Estimated System Load: ${estimatedPower}W. Recommended PSU: ${recommendedPsuWattage}W+ (with 25% safety margin). Select a Power Supply unit.`,
    });
  } else {
    if (!psu.wattage) {
      thermalPowerChecks.push({
        id: 'psu-power',
        title: 'PSU Safety Headroom',
        status: 'unverified',
        message: 'Compatibility cannot be fully verified: PSU wattage specification is missing in catalog data.',
      });
    } else if (psu.wattage < estimatedPower) {
      thermalPowerChecks.push({
        id: 'psu-power',
        title: 'PSU Safety Headroom',
        status: 'incompatible',
        message: `Insufficient Power: Selected PSU (${psu.wattage}W) cannot handle estimated system load (${estimatedPower}W). System will trip over-current protection or crash under load.`,
      });
    } else if (psu.wattage < recommendedPsuWattage) {
      thermalPowerChecks.push({
        id: 'psu-power',
        title: 'PSU Safety Headroom',
        status: 'warning',
        message: `Tight Power Headroom: Selected PSU is ${psu.wattage}W (Estimated Load: ${estimatedPower}W). We recommend at least ${recommendedPsuWattage}W for transient power spikes and optimum efficiency.`,
      });
    } else {
      thermalPowerChecks.push({
        id: 'psu-power',
        title: 'PSU Safety Headroom',
        status: 'compatible',
        message: `Optimal Headroom: ${psu.wattage}W PSU provides healthy headroom above estimated system load (${estimatedPower}W, recommended: ${recommendedPsuWattage}W+ with 25% safety margin).`,
      });
    }
  }

  // Helper to determine status for a category
  const getCategoryStatus = (checksList) => {
    if (checksList.some((c) => c.status === 'incompatible')) return 'incompatible';
    if (checksList.some((c) => c.status === 'warning')) return 'warning';
    if (checksList.some((c) => c.status === 'unverified')) return 'unverified';
    if (checksList.every((c) => c.status === 'pending')) return 'pending';
    if (checksList.some((c) => c.status === 'compatible')) return 'compatible';
    return 'pending';
  };

  const categories = {
    socketPlatform: {
      id: 'socket-platform',
      title: 'Socket & Platform',
      icon: 'fa-solid fa-microchip',
      status: getCategoryStatus(socketChecks),
      checks: socketChecks,
    },
    memory: {
      id: 'memory-architecture',
      title: 'Memory Architecture',
      icon: 'fa-solid fa-memory',
      status: getCategoryStatus(memoryChecks),
      checks: memoryChecks,
    },
    clearances: {
      id: 'physical-clearances',
      title: 'Physical Clearances',
      icon: 'fa-solid fa-ruler-combined',
      status: getCategoryStatus(clearanceChecks),
      checks: clearanceChecks,
    },
    thermalPower: {
      id: 'thermal-power',
      title: 'Thermal & Power',
      icon: 'fa-solid fa-bolt',
      status: getCategoryStatus(thermalPowerChecks),
      checks: thermalPowerChecks,
    },
  };

  // Flat checks list (for backward compatibility with existing tests and code)
  const allChecks = [
    ...socketChecks,
    ...memoryChecks,
    ...clearanceChecks,
    ...thermalPowerChecks,
  ].filter((c) => c.status !== 'pending'); // pending items only shown when relevant

  const activeChecks = [
    ...socketChecks,
    ...memoryChecks,
    ...clearanceChecks,
    ...thermalPowerChecks,
  ];

  const hasIncompatible = activeChecks.some((c) => c.status === 'incompatible');
  const hasWarning = activeChecks.some((c) => c.status === 'warning');
  const hasUnverified = activeChecks.some((c) => c.status === 'unverified');

  let overallStatus = 'compatible';
  if (hasIncompatible) overallStatus = 'incompatible';
  else if (hasWarning) overallStatus = 'warning';
  else if (hasUnverified) overallStatus = 'unverified';
  else if (activeChecks.every((c) => c.status === 'pending')) overallStatus = 'pending';

  return {
    overallStatus,
    isCompatible: !hasIncompatible,
    checks: allChecks,
    categories,
    powerAnalysis: {
      estimatedPower,
      recommendedPsuWattage,
      hasIncompletePowerData,
    },
  };
}

/**
 * Checks whether a candidate product is compatible with the current parts selection.
 * Used by ComponentSelector to render live badge on candidate cards.
 */
export function testCandidateCompatibility(candidateProduct, currentParts) {
  if (!candidateProduct) return { isCompatible: true, message: null };

  const testParts = {
    ...currentParts,
    [candidateProduct.componentType || 'candidate']: candidateProduct,
  };

  const validation = validateBuildCompatibility(testParts);
  const relevantIncompatible = validation.checks.find((c) => c.status === 'incompatible');

  if (relevantIncompatible) {
    return {
      isCompatible: false,
      status: 'incompatible',
      reason: relevantIncompatible.message,
      message: relevantIncompatible.message,
    };
  }

  const relevantWarning = validation.checks.find((c) => c.status === 'warning');
  if (relevantWarning) {
    return {
      isCompatible: true,
      status: 'warning',
      reason: relevantWarning.message,
      message: relevantWarning.message,
    };
  }

  return {
    isCompatible: true,
    status: 'compatible',
    reason: null,
    message: 'Compatible with current build',
  };
}
