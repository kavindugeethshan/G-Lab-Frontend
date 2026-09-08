/**
 * Security file validator for image uploads
 * Checks file size, file extensions, MIME types, dangerous payload patterns,
 * verifies file magic byte signatures, and validates image dimension rendering
 * to prevent arbitrary file upload vulnerabilities.
 */
export async function validateImageSecurity(file) {
  if (!file) return { valid: false, error: 'No file selected.' };

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
  if (!file.size || file.size < 16) {
    return { valid: false, error: 'Security Warning: The selected file is empty or corrupted.' };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit. Please choose a smaller photo.' };
  }

  const fileName = (file.name || '').toLowerCase();
  const dangerousPatterns = /\.(php|phtml|html|htm|js|exe|bat|cmd|sh|py|pl|vbs|svg|cgi|asp|aspx|dll|jar|scr)(\.|$)/i;
  if (dangerousPatterns.test(fileName)) {
    return { valid: false, error: 'Security Alert: Prohibited or executable file extension detected.' };
  }

  const ext = fileName.split('.').pop();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: 'Invalid file extension. Only JPG, JPEG, PNG, and WEBP files are allowed.' };
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes((file.type || '').toLowerCase())) {
    return { valid: false, error: `Invalid file format (${file.type || 'unknown'}). Only JPG, PNG, and WEBP are permitted.` };
  }

  // Magic bytes check (first 16 bytes)
  try {
    const headerSlice = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(headerSlice);
    let isReal = false;

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      isReal = true;
    }
    // PNG: 89 50 4E 47
    else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      isReal = true;
    }
    // WEBP: RIFF .... WEBP
    else if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      isReal = true;
    }

    if (!isReal) {
      return { valid: false, error: 'Security Alert: File signature mismatch! The file is not a genuine image.' };
    }
  } catch {
    return { valid: false, error: 'Failed to verify file integrity.' };
  }

  // Verify renderability and dimension limits in browser environments
  if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.naturalWidth > 6000 || img.naturalHeight > 6000) {
          resolve({ valid: false, error: 'Image dimensions too large (max 6000x6000px).' });
        } else {
          resolve({ valid: true });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ valid: false, error: 'Corrupted or non-renderable image file.' });
      };
      img.src = objectUrl;
    });
  }

  return { valid: true };
}
