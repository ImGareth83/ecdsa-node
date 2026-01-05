## ECDSA & Blockchain Transaction Authentication

### Description

This project is an educational exercise focused on learning ECDSA (Elliptic Curve Digital Signature Algorithm) and understanding how it works at the blockchain node level. The main purpose is to demonstrate how ECDSA authenticates that transactions are indeed from the sender, which is a fundamental security mechanism in blockchain systems.

The application consists of a React-based client that generates and signs transactions using ECDSA, and an Express server (simulating a blockchain node) that verifies signatures and processes transfers. The server demonstrates the node's role in authenticating transactions by recovering the public key from the signature and verifying that the transaction was signed by the private key corresponding to the sender's address.

Since there is just a single server on the back-end handling transfers, this is clearly very centralized. We won't worry about distributed consensus for this project—the focus is purely on understanding ECDSA signature generation, verification, and how blockchain nodes authenticate transaction senders.

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher recommended)
- npm (comes with Node.js)

### Server Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```
   
   The server will start on `http://localhost:3042` (or the port specified in `server/index.js`).

### Client Installation

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   The client will start on `http://localhost:5173` (or the port shown in the terminal).

### Running the Application

1. **Start the server first** (in one terminal):
   ```bash
   cd server
   npm run dev
   ```

2. **Start the client** (in another terminal):
   ```bash
   cd client
   npm run dev
   ```

3. Open your browser and navigate to the client URL (typically `http://localhost:5173`).

**Note:** Both the server and client need to be running simultaneously for the application to work properly. The client makes API calls to the server for balance queries and transfer processing.

## Testing

To test the application, you can use a hard-coded private key and make a transaction to one of the hard-coded wallet addresses.

### Hard-Coded Wallet Addresses

The server has the following addresses with initial balances:
- `0x1` - Balance: 100
- `0x2` - Balance: 50
- `0x3` - Balance: 75
- `0xe16718ad21c1a2f96c667eaa8298df61e6ec50e8` - Balance: 188

### Testing Steps

1. **Enter a Private Key**: In the Wallet component, enter the following test private key:
   ```
   e9f66d1de4f06a3f6ceaeebc05b16daa9110fdb39d6c483a6f5d0475a1d32ccf
   ```
   This will generate a wallet address and display its balance.

2. **Make a Transfer**: 
   - In the Transfer component, enter:
     - **Recipient**: One of the hard-coded addresses (e.g., `0x1`, `0x2`, `0x3`, or `0xe16718ad21c1a2f96c667eaa8298df61e6ec50e8`)
     - **Amount**: Any positive number (e.g., `10`)
     - **Private Key**: The same test private key from step 1
   
3. **Verify the Transaction**:
   - The transaction should be signed using ECDSA
   - The server will verify the signature and authenticate that the transaction is from the sender
   - The balances will be updated for both sender and recipient
   - Check the updated balances in the Wallet component

### Testing ECDSA Authentication

The key learning point is observing how the server authenticates the transaction:
- The client signs the transaction with the private key
- The server recovers the public key from the signature
- The server derives the sender's address from the recovered public key
- The server verifies the signature matches the recovered public key
- Only if all checks pass will the transaction be processed

This demonstrates how blockchain nodes use ECDSA to verify that transactions are indeed from the claimed sender.

## Repo Details

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

## Reference

This project is based on Alchemy University's Week 1 project, which focuses on learning ECDSA and understanding how blockchain nodes authenticate transactions.
