/* =========================================================
   CodeAlpha · Calculator (Task 2)
   - All arithmetic ops: + - × ÷  (+ % + DEL + AC)
   - Real-time display, live history
   - Keyboard support (numbers, operators, Enter, Backspace, Esc)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- DOM ---------- */
  const currentEl  = document.getElementById('current');
  const historyEl  = document.getElementById('history');
  const allBtns    = document.querySelectorAll('.btn');
  const opButtons  = document.querySelectorAll('.btn-op');

  /* ---------- STATE ---------- */
  let currentInput   = '0';    // what user is typing / current result
  let previousValue  = null;   // stored operand
  let operator       = null;   // + - * /
  let waitingForNew  = false;  // after operator or equals, next digit starts fresh
  let lastExpression = '';     // shown in history line

  /* ---------- RENDERING ---------- */
  function updateDisplay(flash = false) {
    // Pretty format big numbers
    let displayValue = currentInput;

    if (displayValue.length > 12 && !displayValue.includes('e')) {
      const num = parseFloat(displayValue);
      if (!isNaN(num)) {
        displayValue = num.toExponential(6);
      }
    }

    currentEl.textContent = displayValue;
    historyEl.textContent = lastExpression;

    if (flash) {
      currentEl.classList.remove('flash');
      // force reflow to restart animation
      void currentEl.offsetWidth;
      currentEl.classList.add('flash');
    }
  }

  /* ---------- HELPERS ---------- */
  function safeEval(a, b, op) {
    const x = parseFloat(a);
    const y = parseFloat(b);
    if (isNaN(x) || isNaN(y)) return '0';
    let result;
    switch (op) {
      case '+': result = x + y; break;
      case '-': result = x - y; break;
      case '*': result = x * y; break;
      case '/':
        if (y === 0) return 'Error';
        result = x / y;
        break;
      default:  return b;
    }
    // Round to avoid floating-point weirdness (0.1 + 0.2)
    if (!Number.isFinite(result)) return 'Error';
    return parseFloat(result.toFixed(10)).toString();
  }

  function symbolOf(op) {
    return { '+': '+', '-': '−', '*': '×', '/': '÷' }[op] || op;
  }

  function highlightOperator(op) {
    opButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.op === op);
    });
  }

  function clearOperatorHighlight() {
    opButtons.forEach(btn => btn.classList.remove('active'));
  }

  /* ---------- CORE ACTIONS ---------- */
  function inputNumber(num) {
    if (waitingForNew) {
      currentInput = num === '.' ? '0.' : num;
      waitingForNew = false;
    } else {
      // prevent multiple dots
      if (num === '.' && currentInput.includes('.')) return;

      if (currentInput === '0' && num !== '.') {
        currentInput = num;
      } else if (currentInput === 'Error') {
        currentInput = num;
      } else {
        // limit length
        if (currentInput.replace('-', '').replace('.', '').length >= 12) return;
        currentInput += num;
      }
    }
    updateDisplay();
  }

  function chooseOperator(op) {
    // if user is chaining operations
    if (operator !== null && !waitingForNew) {
      const result = safeEval(previousValue, currentInput, operator);
      currentInput = result;
      previousValue = result;
      updateDisplay();
    } else {
      previousValue = currentInput;
    }

    operator = op;
    waitingForNew = true;
    lastExpression = `${previousValue} ${symbolOf(op)}`;
    highlightOperator(op);
    updateDisplay();
  }

  function equals() {
    if (operator === null || previousValue === null) return;

    const a = previousValue;
    const b = currentInput;
    const op = operator;
    const result = safeEval(a, b, op);

    lastExpression = `${a} ${symbolOf(op)} ${b} =`;
    currentInput = result;
    previousValue = null;
    operator = null;
    waitingForNew = true;
    clearOperatorHighlight();
    updateDisplay(true);
  }

  function clearAll() {
    currentInput = '0';
    previousValue = null;
    operator = null;
    waitingForNew = false;
    lastExpression = '';
    clearOperatorHighlight();
    updateDisplay();
  }

  function deleteLast() {
    if (waitingForNew) {
      // just clear current if we were starting fresh
      currentInput = '0';
      waitingForNew = false;
    } else if (currentInput.length === 1 || currentInput === 'Error') {
      currentInput = '0';
    } else {
      currentInput = currentInput.slice(0, -1);
    }
    updateDisplay();
  }

  function percent() {
    const num = parseFloat(currentInput);
    if (isNaN(num)) return;
    currentInput = (num / 100).toString();
    updateDisplay(true);
  }

  /* ---------- BUTTON CLICKS ---------- */
  allBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // remove press animation
      btn.classList.remove('keypress');
      void btn.offsetWidth;

      const action = btn.dataset.action;

      if (btn.dataset.num !== undefined) {
        inputNumber(btn.dataset.num);
      } else if (action === 'operator') {
        chooseOperator(btn.dataset.op);
      } else if (action === 'equals') {
        equals();
      } else if (action === 'clear') {
        clearAll();
      } else if (action === 'delete') {
        deleteLast();
      } else if (action === 'percent') {
        percent();
      }
    });
  });

  /* ---------- KEYBOARD SUPPORT (Bonus) ---------- */
  document.addEventListener('keydown', (e) => {
    const key = e.key;

    // digits + decimal
    if (/^[0-9]$/.test(key)) {
      inputNumber(key);
      flashKey(`[data-num="${key}"]`);
      return;
    }

    if (key === '.') {
      inputNumber('.');
      flashKey('[data-num="."]');
      return;
    }

    // operators
    if (['+', '-', '*', '/'].includes(key)) {
      e.preventDefault();
      chooseOperator(key);
      flashKey(`[data-op="${key}"]`);
      return;
    }

    // x or X as multiplication
    if (key === 'x' || key === 'X') {
      chooseOperator('*');
      flashKey('[data-op="*"]');
      return;
    }

    // equals / enter
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      equals();
      flashKey('[data-action="equals"]');
      return;
    }

    // backspace = delete
    if (key === 'Backspace') {
      e.preventDefault();
      deleteLast();
      flashKey('#btnDelete');
      return;
    }

    // escape / delete = AC
    if (key === 'Escape' || key === 'Delete') {
      e.preventDefault();
      clearAll();
      flashKey('#btnClear');
      return;
    }

    // percent
    if (key === '%') {
      percent();
      flashKey('#btnPercent');
      return;
    }
  });

  function flashKey(selector) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.classList.remove('keypress');
    void btn.offsetWidth;
    btn.classList.add('keypress');
    setTimeout(() => btn.classList.remove('keypress'), 200);
  }

  /* ---------- INIT ---------- */
  updateDisplay();
});