// State management variables
let currentValue = '0';
let previousValue = null;
let operator = null;
let waitingForNewValue = false; // Flag to indicate a new number should start
let isError = false;

// DOM Elements
const display = document.getElementById('display');
const expressionDisplay = document.getElementById('expression'); // New expression line element
const displayContainer = document.querySelector('.display-container');
const buttons = document.querySelectorAll('.btn');

// --- Helper Functions for Expression Display ---

// Map raw JS operators to cute mathematical symbols for the expression display
function getOperatorSymbol(op) {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    if (op === '-') return '−';
    return '+';
}

// Updates the small expression text above the main number
function updateExpressionDisplay(text) {
    expressionDisplay.textContent = text;
}

// --- Core Logic ---

function updateDisplay(value) {
    if (value === 'Error 🥺') {
        display.textContent = value;
        // Trigger a cute little shake for the error state
        displayContainer.classList.add('shake');
        setTimeout(() => displayContainer.classList.remove('shake'), 400);
    } else {
        let stringValue = value.toString();
        
        // Prevent extremely long decimals or large numbers from breaking the cute display
        if (stringValue.length > 10) {
            if (stringValue.includes('.')) {
                const parts = stringValue.split('.');
                const integerLength = parts[0].length;
                if (integerLength >= 10) {
                    stringValue = parseFloat(value).toExponential(4);
                } else {
                    const decimalLength = 9 - integerLength;
                    stringValue = parseFloat(value).toFixed(decimalLength);
                }
            } else {
                stringValue = parseFloat(value).toExponential(4);
            }
        }
        display.textContent = stringValue;
    }
}

// Function to add a soft pastel glow on the display upon calculate
function triggerDisplayGlow() {
    displayContainer.classList.add('glow');
    setTimeout(() => {
        displayContainer.classList.remove('glow');
    }, 300);
}

// Function to add a tiny bounce/scale down to the display when clearing
function triggerClearAnimation() {
    displayContainer.style.transform = 'scale(0.95)';
    setTimeout(() => {
        displayContainer.style.transform = 'scale(1)';
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
    
    // Prevent multiple decimals
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
    updateExpressionDisplay(''); // Clear expression line too
    triggerClearAnimation(); // Little reset pop
}

function calculate(a, b, op) {
    a = parseFloat(a);
    b = parseFloat(b);
    
    if (isNaN(a) || isNaN(b)) return b;

    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
            // Handle divide by zero cutely!
            if (b === 0) return 'Error 🥺';
            return a / b;
        default: return b;
    }
}

function handleOperator(nextOperator) {
    if (isError) return;

    // Edge case: Pressing an operator key twice in a row replaces it
    if (operator && waitingForNewValue) {
        operator = nextOperator;
        // Update expression line to show new replaced operator
        updateExpressionDisplay(`${previousValue} ${getOperatorSymbol(operator)}`);
        setActiveOperatorClass(nextOperator);
        return;
    }

    if (previousValue === null) {
        previousValue = currentValue;
    } else if (operator) {
        const result = calculate(previousValue, currentValue, operator);
        
        if (result === 'Error 🥺') {
            isError = true;
            currentValue = 'Error 🥺';
            updateDisplay(currentValue);
            updateExpressionDisplay(''); // Clear expression on error
            return;
        } else {
            currentValue = `${Math.round(result * 100000000) / 100000000}`;
            previousValue = currentValue;
            updateDisplay(currentValue);
            triggerDisplayGlow(); 
        }
    }

    operator = nextOperator;
    waitingForNewValue = true;
    
    // Show the running expression on the display when an operator is pressed
    updateExpressionDisplay(`${previousValue} ${getOperatorSymbol(operator)}`);
    setActiveOperatorClass(nextOperator);
}

function handleEquals() {
    // Edge case: Pressing "=" with no second number entered does nothing
    if (isError || !operator || waitingForNewValue) return;

    // Show the full expression before we calculate and reset state
    updateExpressionDisplay(`${previousValue} ${getOperatorSymbol(operator)} ${currentValue} =`);

    const result = calculate(previousValue, currentValue, operator);
    
    if (result === 'Error 🥺') {
        isError = true;
        currentValue = 'Error 🥺';
    } else {
        currentValue = `${Math.round(result * 100000000) / 100000000}`;
        previousValue = null;
        operator = null;
        triggerDisplayGlow();
    }
    
    waitingForNewValue = true;
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

// Visual active press down simulation for keyboard
function simulateKeyPress(btnElement) {
    if (!btnElement) return;
    btnElement.classList.add('active-press');
    // Matched to the 0.15s CSS transition for satisfying tactile feel
    setTimeout(() => btnElement.classList.remove('active-press'), 150);
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
    // Prevent the calculator from stealing keystrokes when you're typing in the AI chat input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    let key = e.key;
    let btnToClick = null;

    if (/[0-9]/.test(key)) {
        e.preventDefault();
        handleNumber(key);
        btnToClick = Array.from(buttons).find(b => b.textContent === key && b.classList.contains('number'));
    } else if (key === '.' || key === ',') {
        e.preventDefault();
        handleDecimal();
        btnToClick = document.querySelector('[data-action="decimal"]');
    } else if (key === '+' || key === '-') {
        e.preventDefault();
        handleOperator(key);
        btnToClick = document.querySelector(`[data-action="${key}"]`);
    } else if (key === '*' || key === 'x') {
        e.preventDefault();
        handleOperator('*');
        btnToClick = document.querySelector('[data-action="*"]');
    } else if (key === '/') {
        e.preventDefault();
        handleOperator('/');
        btnToClick = document.querySelector('[data-action="/"]');
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
        btnToClick = document.querySelector('[data-action="equals"]');
    } else if (key === 'Escape' || key === 'Backspace' || key === 'c' || key === 'C') {
        e.preventDefault();
        handleClear();
        btnToClick = document.querySelector('[data-action="clear"]');
    }

    if (btnToClick) simulateKeyPress(btnToClick);
});
