let totalAmount = 0;
let balanceAmount = 0;
let savingsAmount = 0;
let transactions = [];
const savingsLimit = 0.15;
const dueText = "Due";

function initializeExpenseTracker() {
    totalAmount = parseFloat(document.getElementById("totalAmountInput").value) || 0;
    savingsAmount = savingsLimit * totalAmount; // 15% of total amount as initial savings
    balanceAmount = totalAmount - savingsAmount;

    document.getElementById("totalAmount").innerText = totalAmount.toFixed(2);
    document.getElementById("savings").innerText = savingsAmount.toFixed(2);
    document.getElementById("totalAmountDisplay").style.display = "block";
    document.getElementById("totalAmountInput").disabled = true;

    document.getElementById("expenseForm").style.display = "block";
    document.getElementById("expenseTable").style.display = "block";
    document.getElementById("balance").style.display = "block";

    updateBalance();
}

function showOtherCategory() {
    const category = document.getElementById("category").value;
    const otherCategoryInput = document.getElementById("otherCategoryInput");

    if (category === "others") {
        otherCategoryInput.style.display = "block";
    } else {
        otherCategoryInput.style.display = "none";
    }
}

function addTransaction() {
    const expenseType = document.querySelector('input[name="expenseType"]:checked').value;
    const category = document.getElementById("category").value;
    const amount = parseFloat(document.getElementById("amount").value) || 0;
    let otherCategory = "";

    if (category === "others") {
        otherCategory = document.getElementById("otherCategory").value;
    }

    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        alert("Please enter valid start and end dates.");
        return;
    }

    const date = new Date().toLocaleString();
    const transaction = { date, type: expenseType, category: otherCategory || category, amount, startDate, endDate };
    transactions.push(transaction);

    if (expenseType === "savings") {
        savingsAmount += amount;
        balanceAmount += amount;
    } else {
        balanceAmount -= amount;
    }

    if (balanceAmount <= savingsLimit * totalAmount) {
        alert("You cannot perform additional expense transactions. Your balance has reached the savings limit.");
        document.getElementById("savingsType").checked = true;
        document.getElementById("expenseType").disabled = true;
        document.getElementById("savingsType").disabled = true;
    } else {
        document.getElementById("expenseType").disabled = false;
        document.getElementById("savingsType").disabled = false;
    }

    updateTable();
    updateBalance();
    updateRemainingDays();
    clearForm();

    // Send data to backend for prediction
    predictExpense(transaction.amount, Math.ceil((transaction.endDate - transaction.startDate) / (1000 * 60 * 60 * 24)));
}

function updateTable() {
    const tableBody = document.querySelector("#expenseTable tbody");

    // Clear existing rows
    tableBody.innerHTML = "";

    // Add new rows
    transactions.forEach(transaction => {
        const row = tableBody.insertRow();
        const dateCell = row.insertCell(0);
        const typeCell = row.insertCell(1);
        const categoryCell = row.insertCell(2);
        const amountCell = row.insertCell(3);

        dateCell.textContent = transaction.date;
        typeCell.textContent = transaction.type;
        categoryCell.textContent = transaction.category;
        amountCell.textContent = transaction.amount.toFixed(2);
    });
}

function updateBalance() {
    const displayBalance = balanceAmount < 0 ? dueText : `$${balanceAmount.toFixed(2)}`;
    document.getElementById("balance").innerText = `Balance: ${displayBalance}`;
    document.getElementById("savings").innerText = `Savings: $${savingsAmount.toFixed(2)}`;
}

function updateRemainingDays() {
    const today = new Date();
    const lastTransaction = transactions[transactions.length - 1];
    const endDate = lastTransaction.endDate;
    const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    document.getElementById("remainingDays").innerText = `Remaining Days: ${remainingDays} days`;
    document.getElementById("remainingDays").style.display = "block";
}

function clearForm() {
    document.getElementById("category").value = "";
    document.getElementById("otherCategory").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
}

function restartExpenseTracker() {
    // Clear all data and reset the form
    document.getElementById("totalAmountInput").value = "";
    document.getElementById("totalAmountInput").disabled = false;
    document.getElementById("totalAmountDisplay").style.display = "none";
    document.getElementById("expenseForm").style.display = "none";
    document.getElementById("expenseTable").style.display = "none";
    document.getElementById("balance").style.display = "none";
    document.getElementById("remainingDays").style.display = "none";

    totalAmount = 0;
    balanceAmount = 0;
    savingsAmount = 0;
    transactions = [];

    updateBalance();
    updateTable();
    updateRemainingDays();
    clearForm();
}

function saveData() {
    // Save data to localStorage with an expiration time (1 day in milliseconds)
    const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000;
    localStorage.setItem("expenseData", JSON.stringify({
        totalAmount,
        balanceAmount,
        savingsAmount,
        transactions,
        expirationTime
    }));
    alert("Data saved successfully!");
}

function clearSavedTransactions() {
    // Clear saved transactions from localStorage
    localStorage.removeItem("expenseData");
    alert("Saved transactions cleared!");
}

async function predictExpense(amount, dateDiff) {
    try {
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, dateDiff })
        });

        const data = await response.json();
        document.getElementById("predictionResult").innerText = `Predicted Expense for Next Day: $${data.prediction.toFixed(2)}`;
    } catch (error) {
        console.error('Error:', error);
    }
}

// Check if there is saved data and initialize the tracker
const savedData = localStorage.getItem("expenseData");
if (savedData) {
    const parsedData = JSON.parse(savedData);
    const currentTime = new Date().getTime();

    // Check if saved data has not expired
    if (parsedData.expirationTime && parsedData.expirationTime > currentTime) {
        totalAmount = parsedData.totalAmount;
        balanceAmount = parsedData.balanceAmount;
        savingsAmount = parsedData.savingsAmount;
        transactions = parsedData.transactions;

        document.getElementById("totalAmountInput").value = totalAmount;
        initializeExpenseTracker(); // Initialize the tracker with saved data
    } else {
        // Clear expired saved data
        clearSavedTransactions();
    }
}
