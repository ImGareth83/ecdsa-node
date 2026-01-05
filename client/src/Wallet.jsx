import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { hexToBytes, toHex } from "ethereum-cryptography/utils";
import { cleanPrivateKey } from "./cryptoUtils";

//TODO: Generate public key and then into wallet address before sending to server. 
//testing private key: e9f66d1de4f06a3f6ceaeebc05b16daa9110fdb39d6c483a6f5d0475a1d32ccf
function Wallet({ address, setAddress, balance, setBalance, privateKey, setPrivateKey }) {
  function getPublicKeyFromPrivateKey(privateKey) {
    try {

      const cleanedKey = cleanPrivateKey(privateKey);
      if (!cleanedKey) {
        return null;
      }
      
      const privateKeyBytes = hexToBytes(cleanedKey);
      // Use secp.getPublicKey (namespace import)
      const publicKey = secp.getPublicKey(privateKeyBytes, false); // false = uncompressed for address generation
      return publicKey;
    } catch (error) {
      console.error("Error generating public key:", error);
      return null;
    }
  }

  function getAddressFromPublicKey(publicKey) {
    return "0x" + toHex(keccak256(publicKey.slice(1)).slice(-20));
  }

  async function onChange(evt) {
    const newPrivateKey = evt.target.value;
    setPrivateKey(newPrivateKey);
    
    if (newPrivateKey) {
      const publicKey = getPublicKeyFromPrivateKey(newPrivateKey);
      if (publicKey) {
        const generatedAddress = getAddressFromPublicKey(publicKey);
        setAddress(generatedAddress);
        
        // Fetch balance for the generated address 
        try {
          const {
            data: { balance },
          } = await server.get(`/balance/${generatedAddress}`);
          setBalance(balance);
        } catch (error) {
          console.log(error);
          setBalance(0);
        }
      } else {
        setAddress("");
        setBalance(0);
      }
    } else {
      setAddress("");
      setBalance(0);
    }
  }
    //TODO: Add new components to allow users to input private key and displayed generated signature. 
  return (
    <div className="container Wallet">
      <h1>Your Wallet</h1>
    
      <label>
        Private Key
        <input 
          placeholder="Enter your private key" 
          value={privateKey}
          onChange={onChange}
        ></input>
      </label>

      <label>
        Wallet Address
        <input placeholder="Type an address, for example: 0x1" value={address} readOnly></input>
      </label>

      <div className="balance">Balance: {balance}</div>
    </div>
  );
}

export default Wallet;
