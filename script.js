// State management variables
let currentValue = '0';
let previousValue = null;
let operator = null;
let waitingForNewValue = false; // Flag to indicate a new number should start
let isError = false;

// DOM Elements
const display = document.getElementById('display');
const buttons = document.querySelectorAll('.btn');

// --- Core Logic ---

function updateDisplay(value) {
    if (value === 'Error') {
        display.textContent = value;
    } else {
        // Prevent extremely long decimals or large numbers from breaking the display
        // Convert to string and limit length
        let stringValue = value.toString();
        
        // Basic length limitation (12 chars max looks good on this layout)
        if (stringValue.length > 12) {
            // For simple numbers, truncate or format to exponential
            if (stringValue.includes('.')) {
                // If it's a long decimal, cut it
                const parts = stringValue.split('.');
                const integerLength = parts[0].length;
                if (integerLength >= 12) {
                    // Number is too big, use exponential notation
                    stringValue = parseFloat(value).toExponential(5);
                } else {
                    const decimalLength = 11 - integerLength;
                    stringValue = parseFloat(value).toFixed(decimalLength);
                }
            } else {
                stringValue = parseFloat(value).toExponential(5);
            }
        }
        display.textContent = stringValue;
    }
}

// Function to add the subtle highlight animation on the display
function triggerDisplayAnimation() {
    display.classList.add('highlight');
    // Remove the highlight after a short delay
    setTimeout(() => {
        display.classList.remove('highlight');
    }, 150);
}

function handleNumber(numString) {
    if (isError) handleClear();

    if (waitingForNewValue) {
        currentValue = numString;
        waitingForNewValue = false;
    } else {
        currentValue = currentValue === '0' ? numString : currentValue + numString;
    }
    updateDisplay(currentValue);
}

function handleDecimal() {
    if (isError) handleClear();
    
    if (waitingForNewValue) {
        currentValue = '0.';
        waitingForNewValue = false;
        updateDisplay(currentValue);
        return;
    }
    
    // Prevent multiple decimals in a single number
    if (!currentValue.includes('.')) {
        currentValue += '.';
        updateDisplay(currentValue);
    }
}

function handleClear() {
    currentValue = '0';
    previousValue = null;
    operator = null;
    waitingForNewValue = false;
    isError = false;
    
    removeActiveOperatorClass();
    updateDisplay(currentValue);
}

function calculate(a, b, op) {
    a = parseFloat(a);
    b = parseFloat(b);
    
    // Handle invalid states gracefully
    if (isNaN(a) || isNaN(b)) return b;

    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
            // Edge case: Division by zero
            if (b === 0) return 'Error';
            return a / b;
        default: return b;
    }
}

function handleOperator(nextOperator) {
    if (isError) return;

    // Edge case: Pressing an operator key twice in a row just replaces the operator
    if (operator && waitingForNewValue) {
        operator = nextOperator;
        setActiveOperatorClass(nextOperator);
        return;
    }

    if (previousValue === null) {
        // First operator pressed, store the value
        previousValue = currentValue;
    } else if (operator) {
        // Chained calculation, e.g., 5 + 3 + 
        const result = calculate(previousValue, currentValue, operator);
        
        if (result === 'Error') {
            isError = true;
            currentValue = 'Error';
            updateDisplay(currentValue);
            return;
        } else {
            // Round to avoid float precision issues (e.g., 0.1 + 0.2 = 0.30000000000000004)
            // Multiplying by 10^10, rounding, and dividing removes typical JS float errors
            currentValue = `${Math.round(result * 10000000000) / 10000000000}`;
            previousValue = currentValue;
            updateDisplay(currentValue);
            triggerDisplayAnimation(); // Provide tactile visual feedback
        }
    }

    operator = nextOperator;
    waitingForNewValue = true; // Next number input should start fresh
    setActiveOperatorClass(nextOperator);
}

function handleEquals() {
    // Edge case: Pressing "=" with no second number entered should do nothing or return the current value
    if (isError || !operator || waitingForNewValue) return;

    const result = calculate(previousValue, currentValue, operator);
    
    if (result === 'Error') {
        isError = true;
        currentValue = 'Error';
    } else {
        currentValue = `${Math.round(result * 10000000000) / 10000000000}`;
        // Reset state for future calculations after equals
        previousValue = null;
        operator = null;
        triggerDisplayAnimation();
    }
    
    waitingForNewValue = true; // Prepare for possible next calculation
    removeActiveOperatorClass();
    updateDisplay(currentValue);
}

// --- UI Helpers ---

function setActiveOperatorClass(op) {
    removeActiveOperatorClass();
    const btn = document.querySelector(`[data-action="${op}"]`);
    if (btn) btn.classList.add('active-op');
}

function removeActiveOperatorClass() {
    buttons.forEach(btn => btn.classList.remove('active-op'));
}

// Visual active press simulation for keyboard
function simulateKeyPress(btnElement) {
    if (!btnElement) return;
    btnElement.classList.add('active-press');
    setTimeout(() => btnElement.classList.remove('active-press'), 100);
}

// --- Event Listeners ---

// Mouse interactions
buttons.forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;
        const buttonContent = button.textContent;

        if (button.classList.contains('number') && !action) {
            handleNumber(buttonContent);
        } else if (action === 'decimal') {
            handleDecimal();
        } else if (action === 'clear') {
            handleClear();
        } else if (action === 'equals') {
            handleEquals();
        } else if (['+', '-', '*', '/'].includes(action)) {
            handleOperator(action);
        }
    });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    let key = e.key;
    let btnToClick = null;

    // Numbers
    if (/[0-9]/.test(key)) {
        e.preventDefault();
        handleNumber(key);
        btnToClick = Array.from(buttons).find(b => b.textContent === key && b.classList.contains('number'));
    }
    // Decimal
    else if (key === '.' || key === ',') { // Support comma in some locales
        e.preventDefault();
        handleDecimal();
        btnToClick = document.querySelector('[data-action="decimal"]');
    }
    // Operators
    else if (key === '+' || key === '-') {
        e.preventDefault();
        handleOperator(key);
        btnToClick = document.querySelector(`[data-action="${key}"]`);
    }
    else if (key === '*' || key === 'x') {
        e.preventDefault();
        handleOperator('*');
        btnToClick = document.querySelector('[data-action="*"]');
    }
    else if (key === '/') {
        e.preventDefault();
        handleOperator('/');
        btnToClick = document.querySelector('[data-action="/"]');
    }
    // Equals
    else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
        btnToClick = document.querySelector('[data-action="equals"]');
    }
    // Clear
    else if (key === 'Escape' || key === 'Backspace' || key === 'c' || key === 'C') {
        e.preventDefault();
        handleClear();
        btnToClick = document.querySelector('[data-action="clear"]');
    }

    // Trigger visual effect on keyboard press
    if (btnToClick) simulateKeyPress(btnToClick);
});
