// activity.js

const TRANSACTIONS_STORAGE_KEY = "cashAppTransactionsHistory_v1"; // Using a versioned key

/**
 * Retrieves all transactions from localStorage.
 * @returns {Array} An array of transaction objects.
 */
function getAllTransactions() {
  const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  try {
    if (storedTransactions) {
      const transactions = JSON.parse(storedTransactions);
      return Array.isArray(transactions) ? transactions : [];
    }
    return [];
  } catch (error) {
    console.error("Error parsing transactions from localStorage:", error);
    return []; // Return empty array on error
  }
}

/**
 * Saves the complete list of transactions to localStorage.
 * @param {Array} transactionsArray - The array of transaction objects to save.
 */
function saveAllTransactions(transactionsArray) {
  try {
    localStorage.setItem(
      TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(transactionsArray)
    );
  } catch (error) {
    console.error("Error saving transactions to localStorage:", error);
    // Potentially notify the user if storage is full
  }
}

/**
 * Adds a new transaction to the history.
 * @param {Object} transactionData - The transaction object to add.
 *  Expected structure:
 *  {
 *      id: String, (e.g., 'tx' + Date.now())
 *      name: String, (Recipient's name)
 *      cashtag: String, (Optional, recipient's cashtag)
 *      amount: Number, (Positive for received, negative for sent)
 *      note: String, (Transaction note/description)
 *      status: String, ('completed', 'pending', 'failed')
 *      timestamp: String, (ISO 8601 date string)
 *      avatarType: String, ('initial' or 'image')
 *      avatarData: String, (Initial letter or image URL/DataURL)
 *      avatarColor: String (Hex color for initial-based avatar, optional)
 *  }
 */
function addTransactionToHistory(transactionData) {
  if (
    !transactionData ||
    typeof transactionData.id === "undefined" ||
    typeof transactionData.amount === "undefined"
  ) {
    console.error("Invalid transaction data provided:", transactionData);
    return;
  }

  const transactions = getAllTransactions();

  // Check for duplicates if necessary, though unique IDs should prevent this
  // const existingTransaction = transactions.find(tx => tx.id === transactionData.id);
  // if (existingTransaction) {
  //     console.warn("Attempted to add duplicate transaction ID:", transactionData.id);
  //     return; // Or update existing
  // }

  transactions.push(transactionData);
  saveAllTransactions(transactions);
  console.log("Transaction added to history:", transactionData);
}

/**
 * (Optional) Helper function to generate a simple unique ID for transactions.
 * @returns {String} A unique ID.
 */
function generateTransactionId() {
  return (
    "tx_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
  );
}

// You can add more utility functions here if needed, e.g.,
// - getTransactionById(id)
// - updateTransactionInHistory(updatedTransaction)
// - deleteTransactionFromHistory(id)
//   (Note: history.html already has its own delete/edit, but this could centralize if desired)

console.log("transaction.js loaded");
