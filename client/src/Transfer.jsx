import { useState } from "react";
import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { hexToBytes, toHex } from "ethereum-cryptography/utils";
import { cleanPrivateKey, signatureToHex } from "./cryptoUtils";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  /**
   * Generates a signature for a transaction
   * @param {string} privateKey - The private key to sign with (hex string, with or without 0x prefix)
   * @param {string} sender - The sender's address
   * @param {string} recipient - The recipient's address
   * @param {number} amount - The amount to transfer
   * @returns {Promise<{signature: Object, recoveryId: number}|null>} - The signature object and recovery ID, or null if signing fails
   */
  async function generateSignature(privateKey, sender, recipient, amount) {
    try {
      // Clean and validate private key
      const cleanedKey = cleanPrivateKey(privateKey);
      if (!cleanedKey) {
        return null;
      }
      
      // Create a message from transaction details
      // Concatenate sender, recipient, and amount as strings
      const message = `${sender}${recipient}${amount}`;
      
      // Convert message to bytes (UTF-8 encoding)
      const messageBytes = new TextEncoder().encode(message);
      
      // Hash the message using keccak256
      const messageHash = keccak256(messageBytes);
      
      // Convert private key to bytes
      const privateKeyBytes = hexToBytes(cleanedKey);
      
      // Sign the message hash with the private key and get recovery ID
      const [signature, recoveryId] = await secp.sign(messageHash, privateKeyBytes, {
        recovered: true
      });
      
      // Return both signature and recovery ID
      return { signature, recoveryId };
    } catch (error) {
      console.error("Error generating signature:", error);
      return null;
    }
  }
  
  // Transfer function
  async function transfer(evt) {
    evt.preventDefault();

    // Validate required fields
    if (!address) {
      alert("Please set your wallet address first");
      return;
    }
    if (!recipient) {
      alert("Please enter a recipient address");
      return;
    }
    const amount = Number(sendAmount);
    if (!sendAmount || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (!privateKey) {
      alert("Please enter your private key");
      return;
    }

    try {
      console.log("Transaction details:", { address, recipient, amount });
      
      const result = await generateSignature(
        privateKey,
        address,
        recipient,
        amount
      );

      if (result && result.signature) {
        const { signature, recoveryId } = result;
        console.log("Recovery ID:", recoveryId);
        
        // Convert signature object to hex string for server
        const signatureHex = signatureToHex(signature);
        if (!signatureHex) {
          alert("Invalid signature format");
          return;
        }
        
        // Create message string
        const message = `${address}${recipient}${amount}`;
        
        // Send to transfer endpoint with recovery ID (server will use specific recovery ID)
        try {
          const {
            data: { message: responseMessage, senderBalance, recipientBalance },
          } = await server.post(`/transfer`, {
            message,
            signature: signatureHex,
            recoveryId,
            recipient,
            amount,
          });
          
          console.log("Transfer response:", { message: responseMessage, senderBalance, recipientBalance });
          
          alert(`Transfer successful!\n\nSender balance: ${senderBalance}\nRecipient balance: ${recipientBalance}`);
          setBalance(senderBalance);
        } catch (transferError) {
          console.error("Error processing transfer:", transferError);
          alert(transferError.response?.data?.error || "Failed to process transfer.");
        }
      } else {
        alert("Failed to generate signature. Please check your private key and try again.");
        return;
      }
    } catch (ex) {
      console.error("Error in transfer:", ex);
      alert(ex.response?.data?.message || "An error occurred. Check console for details.");
    }
  }

  return (
    <form className="container transfer" onSubmit={(e) => e.preventDefault()}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2.5, 3.14..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" className="button" onClick={transfer}>
          Transfer
        </button>
      </div>
    </form>
  );
}

export default Transfer;
