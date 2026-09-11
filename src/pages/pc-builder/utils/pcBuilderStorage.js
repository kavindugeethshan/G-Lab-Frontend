/**
 * G-Lab PC Builder: Storage, Export & Sharing Engine
 */

const SAVED_BUILDS_KEY = 'glab_saved_pc_builds';

/**
 * Get all saved builds from local storage.
 */
export function getSavedBuilds() {
  try {
    const raw = localStorage.getItem(SAVED_BUILDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse saved builds', e);
    return [];
  }
}

/**
 * Save a custom build to local storage.
 */
export function saveBuildToStorage(name, parts, targetBudget) {
  const builds = getSavedBuilds();
  const totalPrice = Object.values(parts).filter(Boolean).reduce((sum, p) => sum + (p.price || 0), 0);
  
  const newBuild = {
    id: 'build_' + Date.now(),
    name: name.trim() || `Custom Rig #${builds.length + 1}`,
    parts,
    targetBudget,
    totalPrice,
    createdAt: new Date().toISOString(),
  };

  const updated = [newBuild, ...builds];
  localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(updated));
  return newBuild;
}

/**
 * Delete a saved build from local storage.
 */
export function deleteSavedBuild(buildId) {
  const builds = getSavedBuilds();
  const filtered = builds.filter((b) => b.id !== buildId);
  localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(filtered));
  return filtered;
}

/**
 * Generates a formatted Bill of Materials (BOM) text specification sheet.
 */
export function generateBuildSpecSheet(parts, targetBudget, powerData) {
  const items = Object.entries(parts).filter(([_, p]) => !!p);
  const totalPrice = items.reduce((sum, [_, p]) => sum + (p.price || 0), 0);

  let sheet = `====================================================\n`;
  sheet += `        G-LAB COMPUTER HARDWARE - RIG SPEC SHEET\n`;
  sheet += `====================================================\n`;
  sheet += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
  sheet += `Estimated System Power: ${powerData?.estimatedPower || 0}W (Recommended PSU: ${powerData?.recommendedPsuWattage || 650}W+)\n`;
  sheet += `Target Budget: Rs. ${(targetBudget || 0).toLocaleString()}\n`;
  sheet += `Total Build Cost: Rs. ${totalPrice.toLocaleString()}\n`;
  sheet += `----------------------------------------------------\n`;
  sheet += `BILL OF MATERIALS:\n`;

  items.forEach(([slot, part]) => {
    sheet += `• [${slot.toUpperCase()}] ${part.name} - Rs. ${(part.price || 0).toLocaleString()}\n`;
    if (part.socket) sheet += `    Socket: ${part.socket}\n`;
    if (part.ramType) sheet += `    RAM Type: ${part.ramType}\n`;
    if (part.wattage) sheet += `    Wattage: ${part.wattage}W\n`;
  });

  sheet += `----------------------------------------------------\n`;
  sheet += `Assembled via G-Lab Interactive PC Studio: https://glab.lk/pc-builder\n`;
  sheet += `====================================================\n`;

  return sheet;
}

/**
 * Encodes selected parts stable IDs and budget into a compact URL query string.
 */
export function encodeRigToQuery(parts, budget) {
  try {
    const idMap = {};
    Object.entries(parts || {}).forEach(([slot, part]) => {
      if (part && (part._id || part.id)) {
        idMap[slot] = part._id || part.id;
      }
    });
    const payload = { p: idMap, b: budget || 0 };
    return btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

/**
 * Decodes a compact rig query string into slot product IDs and budget.
 */
export function decodeRigFromQuery(queryString) {
  if (!queryString) return null;
  try {
    let base64 = queryString.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

