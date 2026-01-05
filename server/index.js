import express from "express";
const app = express();
import cors from "cors";
import * as secp from "ethereum-cryptography/secp256k1.js";
import { keccak256 } from "ethereum-cryptography/keccak.js";
import { hexToBytes, toHex } from "ethereum-cryptography/utils.js";
const port = 3042;

console.log("Server file loaded!");

app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

//TODO: mock keys as public keys and balances as balances. 
const balances = {
  "0x1": 100,
  "0x2": 50,
  "0x3": 75,
  "0xe16718ad21c1a2f96c667eaa8298df61e6ec50e8": 188
};

app.get("/balance/:address", (req, res) => {
  console.log("========================================");
  console.log("Route /balance/:address hit!");
  console.log("========================================");
  const { address } = req.params;
  console.log("address:", address);
  console.log("address type:", typeof address);
  const balance = balances[address] || 0;
  console.log("server balance:", balance);
  console.log("balances object keys:", Object.keys(balances));
  res.send({ balance });
  console.log("Response sent!");
});

// Transfer endpoint: receives signature and recovers public key to process transfer
app.post("/transfer", (req, res) => {
  const { message, signature, recoveryId, recipient, amount } = req.body;

  if (!message || !signature || recoveryId === undefined || !recipient || amount === undefined) {
    return res.status(400).json({ error: "Missing message/signature/recoveryId/recipient/amount" });
  }

  try {
    // Hash the message the same way as the client (UTF-8 encoding then keccak256)
    const messageBytes = new TextEncoder().encode(message);
    const msgHash = keccak256(messageBytes);
    
    // Remove '0x' prefix from signature if present
    let cleanSignature = signature.trim();
    if (cleanSignature.startsWith('0x') || cleanSignature.startsWith('0X')) {
      cleanSignature = cleanSignature.slice(2);
    }
    
    const sigBytes = hexToBytes(cleanSignature);
    
    // Recover public key from signature using the provided recovery ID
    let publicKey = null;
    try {
      publicKey = secp.recoverPublicKey(msgHash, sigBytes, recoveryId);
      if (!publicKey) {
        return res.status(400).json({ error: "Failed to recover public key from signature" });
      }
      
      // Verify the signature is valid for this recovered public key
      const isValid = secp.verify(sigBytes, msgHash, publicKey);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid signature" });
      }
      
      console.log(`Recovered public key with recovery ID: ${recoveryId}`);
    } catch (error) {
      return res.status(400).json({ 
        error: "Failed to recover public key from signature",
        message: error.message 
      });
    }

    // Derive address from public key
    const senderAddress = "0x" + toHex(keccak256(publicKey.slice(1)).slice(-20));

    // Parse the message to extract sender, recipient, and amount
    // Message format: ${sender}${recipient}${amount}
    // Since addresses can be variable length (e.g., "0x1" or "0xe16718ad..."),
    // we need to reconstruct the expected message and verify it matches
    const expectedMessage = `${senderAddress}${recipient}${amount}`;
    
    // Verify that the received message matches what was signed
    if (message !== expectedMessage) {
      return res.status(400).json({ 
        error: "Message does not match signature",
        expected: expectedMessage,
        received: message
      });
    }

    // Convert amount to number
    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    console.log("Sender address:", senderAddress);
    console.log("Recipient:", recipient);
    console.log("Amount:", transferAmount);
    console.log("Sender balance:", balances[senderAddress]);

    // Process transfer
    setInitialBalance(senderAddress);
    setInitialBalance(recipient);

    if (balances[senderAddress] < transferAmount) {
      return res.status(400).json({ 
        error: "Not enough funds!",
        balance: balances[senderAddress],
        required: transferAmount
      });
    }

    balances[senderAddress] -= transferAmount;
    balances[recipient] += transferAmount;

    res.json({ 
      message: "Transfer successful",
      sender: senderAddress,
      senderBalance: balances[senderAddress],
      recipientBalance: balances[recipient]
    });

  } catch (error) {
    console.error("Error processing transfer:", error);
    res.status(500).json({ 
      error: "Error during transfer",
      message: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
  console.log(`Server started at: ${new Date().toISOString()}`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
