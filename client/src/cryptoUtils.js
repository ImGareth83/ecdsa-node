import { toHex } from "ethereum-cryptography/utils";

/**
 * Cleans and validates a private key hex string
 * @param {string} privateKey - The private key (hex string, with or without 0x prefix)
 * @returns {string|null} - The cleaned private key hex string, or null if invalid
 */
export function cleanPrivateKey(privateKey) {
  try {
    // Remove '0x' prefix if present and trim whitespace
    let cleanPrivateKey = privateKey.trim();
    if (cleanPrivateKey.startsWith('0x') || cleanPrivateKey.startsWith('0X')) {
      cleanPrivateKey = cleanPrivateKey.slice(2);
    }
    
    // Validate hex string
    if (!/^[0-9a-fA-F]+$/.test(cleanPrivateKey)) {
      console.error("Invalid hex string in private key");
      return null;
    }
    
    // Ensure even length (pad with leading zero if needed)
    if (cleanPrivateKey.length % 2 !== 0) {
      cleanPrivateKey = '0' + cleanPrivateKey;
    }
    
    return cleanPrivateKey;
  } catch (error) {
    console.error("Error cleaning private key:", error);
    return null;
  }
}

/**
 * Converts a signature object to a hex string
 * @param {Object} signature - The signature object (may have r/s properties, toCompactHex method, or be a Uint8Array)
 * @returns {string|null} - The signature as a 128-character hex string (64 bytes), or null if invalid
 */
export function signatureToHex(signature) {
  try {
    if (!signature) {
      console.error("Invalid signature: signature is null or undefined");
      return null;
    }

    // Log signature structure for debugging
    console.log("Signature object type:", typeof signature);
    console.log("Signature object keys:", Object.keys(signature || {}));
    console.log("Signature object:", signature);

    return toHex(signature);    

  } catch (error) {
    console.error("Error converting signature to hex:", error);
    return null;
  }
}

