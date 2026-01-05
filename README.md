## Project 1: Build a Web App using ECDSA

This project is an example of using a client and server to facilitate transfers between different addresses. Since there is just a single server on the back-end handling transfers, this is clearly very centralized. We won't worry about distributed consensus for this project.

However, something that we would like to incorporate is Public Key Cryptography. By using Elliptic Curve Digital Signatures we can make it so the server only allows transfers that have been signed for by the person who owns the associated address.

## Video Instructions
For an overview of this project as well as getting started instructions, check out the following video:

https://www.youtube.com/watch?v=GU5vlKaNvmI

If you are interested in a text-based guide, please read on below. ⬇️

## Setup Instructions
 
### Client

The client folder contains a [react app](https://reactjs.org/) using [vite](https://vitejs.dev/). To get started, follow these steps:

1. Open up a terminal in the `/client` folder
2. Run `npm install` to install all the dependencies
3. Run `npm run dev` to start the application 
4. Now you should be able to visit the app at http://localhost:5173/

### Server

The server folder contains a Node.js server using [express](https://expressjs.com/). To run the server, follow these steps:

1. Open a terminal within the `/server` folder 
2. Run `npm install` to install all the dependencies 
3. Run `node index` to start the server

_Hint_ - > Run `npm i -g nodemon` and then run `nodemon index` instead of `node index` to automatically restart the server on any changes!

The application should connect to the default server port (3042) automatically!

## 🏁 Your Goal: Set Up a Secure ECDSA-based Web Application

Only read this section **AFTER** you've followed the **Setup Instructions** above!

This project begins with a client that is allowed to transfer any funds from any account to another account. That's not very secure. By applying digital signatures we can require that only the user with the appropriate private key can create a signature that will allow them to move funds from one account to the other. Then, the server can verify the signature to move funds from one account to another.

Your project is considered **done** when you have built the following features in a secure way (NOTE: your project is not final if it still uses private keys anywhere on the client side!):
- Incorporate public key cryptography so transfers can only be completed with a valid signature
- The person sending the transaction should have to verify that they own the private key corresponding to the address that is sending funds

> 🤔 While you're working through this project consider the security implications of your implementation decisions. What if someone intercepted a valid signature, would they be able to replay that transfer by sending it back to the server?

## Recommended Approach To Building This Project

There are many ways to approach this project. The goal is to create a client-server webapp that safely validates transaction intents, using public key cryptography, between accounts. Below is a phased approach that clearly details out a roadmap to solving this goal:

### **Phase 1**
- You have successfully git cloned this project onto your local machine
- You installed all dependencies by running `npm i` both in the `/client` and in the `/server` folders
- You have a website running on http://localhost:5173/ by running `npm run dev` in the `/client` folder
- You have a server process running by running `nodemon index` in the `/server` folder (remember to run `npm i -g nodemon` prior to this)
- A balance displays on the `Wallet Address` input box when you type in "0x1", "0x2" and "0x3"
- When you type in "0x1" (or any of the other accounts listed in the `server/index.js` file, you can also send an amount to any other account (using the right-hand column); this action withdraws whatever amount you send from the first account too. You should see these changes in real time, especially if you are using `nodemon` to run your server process
- Even if you reload the page on http://localhost:5173/, the balance changes you've previously made still remain - this is because it is your server actually keeping track of balances, not your client (ie. your front-end)

If all of these are complete, move on to **Phase 2**! ⬇️

### **Phase 2**

At this point, our app security is not very good. If we deploy this app now, anyone can access any balance and make changes. This means that Alice (or really.. anyone!) can type in "0x2" and transfer an amount, even if that account is not actually her account! We need to find a way to assign ownership of accounts. 

Let's incorporate some of the cryptography we've learned in the previous lessons to build a half-baked solution; we will use [Ethereum Cryptography library](https://www.npmjs.com/package/ethereum-cryptography/v/1.2.0).

> Please use v1.2.0 of the Ethereum Cryptography library!

Start a new terminal tab and run `npm i ethereum-cryptography@1.2.0` - this will pull down functions to cryptographically sign and verify data.

> Remember, you must run `npm i ethereum-cryptography@1.2.0` in BOTH the `/client` and the `/server` folder!

In **Phase 2**, your job is to implement private keys so that when a user interacts with your application, the ONLY way they are allowed to move funds is if they provide the **private key** of the account they want to move funds from.

The key change is to change the `balances` object in the `/server/index.js` file to use **real public keys**.

You can do this programmatically (by editting the `/server/index.js` file) or using a script with the following functions:

```js
const secp = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");

const privateKey = secp.utils.randomPrivateKey();

console.log('private key: ', toHex(privateKey));

const publicKey = secp.getPublicKey(privateKey);

console.log('public key', toHex(publicKey));
```

The script above will create a brand new random private key, and then get its equivalent public key, each time you run it.

Now you have the foundation to implement public key cryptography into your project!

To pass **Phase 2**:

- You have replaced "0x1", "0x2" and "0x3" in the `server/index.js` file with actual public keys generated by using the [Ethereum Cryptography library](https://www.npmjs.com/package/ethereum-cryptography/v/1.2.0). These public keys, in this suggested flow, were generated from a randomly generated private key assigned to the user. The method used to generate the public key was: `secp.getPublicKey(privateKey)`.

> Extra credit: Make your accounts look like Ethereum addresses! (ie. instead of the long public key hexadecimal format, use the "0x" + 20 hex characters format of Ethereum - this is a fun challenge to get right!)

- You are able to transfer funds between the addresses, via public keys/addresses of your server's users, that have been generated by inputting a private key into the webapp.
 
### **Phase 3**

Asking users to input a private key directly into your webapp is a big no-no! 🚫

The next step for YOU to accomplish is to make it so that you can send a signed transaction to the server, via your webapp; the server should the authenticate that transaction by deriving the public key associated with it. If that public key has funds, move the funds to the intended recipient. All of this should be accomplished via digital signatures alone.

Hint: In `index.js`, you will want to:
- get a signature from the client-side application
- recover the public address from the signature itself
- validate the recovered address against your server's `balances` object

To pass **Phase 3**:

- Your app is able to validate and move funds using digital signatures.

> Hint: https://github.com/paulmillr/noble-secp256k1 is a great library to leverage for this final phase!

## My Implementation Details

This section explains the main methods and components of the implementation.

### Client-Side Components

#### `client/src/Transfer.jsx`

The Transfer component handles transaction creation and signing.

**Main Methods:**

- **`generateSignature(privateKey, sender, recipient, amount)`**
  - Generates an ECDSA signature for a transaction
  - Cleans and validates the private key
  - Creates a message by concatenating sender address, recipient address, and amount
  - Hashes the message using keccak256
  - Signs the message hash with the private key using secp256k1
  - Returns both the signature object and recovery ID (for consistent public key recovery on the server)
  - Supports decimal amounts

- **`transfer(evt)`**
  - Handles the transfer form submission
  - Validates all required fields (address, recipient, amount, private key)
  - Calls `generateSignature()` to create a cryptographic signature
  - Converts the signature object to a hex string using `signatureToHex()`
  - Sends the transaction (message, signature, recovery ID, recipient, amount) to the server's `/transfer` endpoint
  - Updates the sender's balance on successful transfer

#### `client/src/cryptoUtils.js`

Utility functions for cryptographic operations.

**Main Methods:**

- **`cleanPrivateKey(privateKey)`**
  - Cleans and validates a private key hex string
  - Removes '0x' prefix if present
  - Validates that the string contains only hexadecimal characters
  - Ensures even length by padding with a leading zero if needed
  - Returns the cleaned private key or null if invalid

- **`signatureToHex(signature)`**
  - Converts a signature object (from `secp.sign()`) to a hex string
  - Handles DER-encoded signature format
  - Returns the signature as a hex string for transmission to the server

#### `client/src/Wallet.jsx`

The Wallet component displays wallet information and generates addresses from private keys.

**Main Methods:**

- **`getPublicKeyFromPrivateKey(privateKey)`**
  - Derives a public key from a private key
  - Uses `cleanPrivateKey()` to validate the input
  - Generates an uncompressed public key using `secp.getPublicKey()`
  - Returns the public key as a Uint8Array

- **`getAddressFromPublicKey(publicKey)`**
  - Converts a public key to an Ethereum-style address
  - Removes the first byte (compression indicator) from the public key
  - Hashes the remaining bytes using keccak256
  - Takes the last 20 bytes and formats as "0x" + hex string
  - Returns the wallet address

- **`onChange(evt)`**
  - Handles private key input changes
  - Generates the public key and address from the entered private key
  - Fetches the balance for the generated address from the server
  - Updates the UI with the address and balance

### Server-Side Components

#### `server/index.js`

The Express server handles balance queries and transfer processing with signature verification.

**Main Methods:**

- **`GET /balance/:address`**
  - Retrieves the balance for a given address
  - Returns 0 if the address doesn't exist in the balances object
  - Logs the request for debugging

- **`POST /transfer`**
  - Processes a signed transaction transfer
  - **Signature Verification:**
    - Receives message, signature (hex), recovery ID, recipient, and amount from the client
    - Hashes the message using keccak256 (same method as client)
    - Recovers the public key from the signature using the provided recovery ID
    - Verifies the signature is valid for the recovered public key
  - **Address Derivation:**
    - Derives the sender's Ethereum address from the recovered public key
    - Uses the same method as the client: keccak256 hash of public key (without first byte), take last 20 bytes
  - **Message Validation:**
    - Reconstructs the expected message from the recovered sender address, recipient, and amount
    - Verifies the received message matches the expected message (prevents tampering)
  - **Transfer Processing:**
    - Validates the amount is a positive number
    - Checks the sender has sufficient balance
    - Updates balances for both sender and recipient
    - Returns the updated balances

- **`setInitialBalance(address)`**
  - Helper function to initialize a balance of 0 for new addresses
  - Called before processing transfers to ensure addresses exist in the balances object

### Security Features

1. **Signature Verification**: All transfers require a valid ECDSA signature that can be verified against the recovered public key
2. **Message Integrity**: The server reconstructs and verifies the message to prevent tampering with transaction details
3. **Recovery ID Consistency**: Using a consistent recovery ID ensures reliable public key recovery
4. **Decimal Amount Support**: Supports decimal amounts for more flexible transactions
