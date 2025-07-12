
    (() => {
      const displayEl = document.getElementById('display');
      const historyListEl = document.getElementById('historyList');
      const darkToggleBtn = document.querySelector('.dark-toggle');

      let currentInput = '0';
      let lastInput = null;
      let operator = null;
      let resetNext = false;
      let errorState = false;
      let history = [];

      // Load theme from localStorage or prefer-color-scheme
      function loadTheme() {
        const saved = localStorage.getItem('calc-theme');
        if(saved !== null) {
          document.body.classList.toggle('light', saved === 'light');
        } else {
          const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
          document.body.classList.toggle('light', prefersLight);
        }
      }
      loadTheme();

      darkToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light');
        const mode = document.body.classList.contains('light') ? 'light' : 'dark';
        localStorage.setItem('calc-theme', mode);
      });

      function updateDisplay() {
        displayEl.textContent = currentInput;
        displayEl.setAttribute('aria-label', 'Display: ' + currentInput);
      }

      function appendNumber(num) {
        if(errorState) return;
        if (resetNext) {
          currentInput = num === '.' ? '0.' : num;
          resetNext = false;
        } else {
          if(num === '.' && currentInput.includes('.')) return;
          if(currentInput === '0' && num !== '.') {
            currentInput = num;
          } else {
            currentInput += num;
          }
        }
        updateDisplay();
      }

      function clearAll() {
        currentInput = '0';
        lastInput = null;
        operator = null;
        resetNext = false;
        errorState = false;
        updateDisplay();
      }

      function backspace() {
        if(errorState) {
          clearAll();
          return;
        }
        if(resetNext) return;
        if(currentInput.length === 1) {
          currentInput = '0';
        } else {
          currentInput = currentInput.slice(0, -1);
          if(currentInput === '-' || currentInput === '') currentInput = '0';
        }
        updateDisplay();
      }

      function addHistoryItem(expression, result) {
        history.push({ expression, result });
        if(history.length > 50) history.shift(); // limit history length

        const li = document.createElement('li');
        li.tabIndex = 0;
        li.className = 'history-item';

        const exprEl = document.createElement('div');
        exprEl.className = 'history-expression';
        exprEl.textContent = expression;

        const resEl = document.createElement('div');
        resEl.className = 'history-result';
        resEl.textContent = result;

        li.appendChild(exprEl);
        li.appendChild(resEl);
        li.title = 'Click to reuse this calculation';

        li.addEventListener('click', () => {
          if(errorState) clearAll();
          currentInput = result;
          lastInput = null;
          operator = null;
          resetNext = true;
          errorState = false;
          updateDisplay();
          displayEl.focus();
        });
        li.addEventListener('keydown', e => {
          if(e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            li.click();
          }
        });

        historyListEl.appendChild(li);
        historyListEl.scrollTop = historyListEl.scrollHeight;
      }

      function operate(op, a, b) {
        const x = parseFloat(a);
        const y = parseFloat(b);
        if(isNaN(x) || isNaN(y)) return 'Error';
        switch(op) {
          case 'add':      return (x + y).toString();
          case 'subtract': return (x - y).toString();
          case 'multiply': return (x * y).toString();
          case 'divide':
            if(y === 0) return 'Error';
            return (x / y).toString();
          case 'power':
            return Math.pow(x,y).toString();
          default: return 'Error';
        }
      }

      function chooseOperator(op) {
        if(errorState) return;
        if(op === 'sqrt') {
          const val = parseFloat(currentInput);
          if(val < 0) {
            currentInput = 'Error';
            errorState = true;
            updateDisplay();
            return;
          }
          const result = Math.sqrt(val);
          addHistoryItem(`√(${val})`, result.toString());
          currentInput = result.toString();
          resetNext = true;
          updateDisplay();
          return;
        }

        if(operator && !resetNext) {
          const result = operate(operator, lastInput, currentInput);
          if(result === 'Error') {
            currentInput = 'Error';
            errorState = true;
            operator = null;
            lastInput = null;
            resetNext = true;
            updateDisplay();
            return;
          } else {
            addHistoryItem(`${lastInput} ${operatorToSymbol(operator)} ${currentInput}`, result);
            currentInput = Number(result).toString();
            updateDisplay();
          }
        }
        operator = op;
        lastInput = currentInput;
        resetNext = true;
      }

      function calculate() {
        if(errorState) return;
        if(!operator || resetNext) return;
        const result = operate(operator, lastInput, currentInput);
        if(result === 'Error') {
          currentInput = 'Error';
          errorState = true;
          operator = null;
          lastInput = null;
          resetNext = true;
          updateDisplay();
          return;
        }
        addHistoryItem(`${lastInput} ${operatorToSymbol(operator)} ${currentInput}`, result);
        currentInput = Number(result).toString();
        updateDisplay();
        lastInput = null;
        operator = null;
        resetNext = true;
      }

      function operatorToSymbol(op) {
        switch(op) {
          case 'add': return '+';
          case 'subtract': return '−';
          case 'multiply': return '×';
          case 'divide': return '÷';
          case 'power': return '^';
          default: return op;
        }
      }

      // Button click handler
      document.querySelector('.buttons').addEventListener('click', e => {
        const target = e.target.closest('button');
        if(!target) return;

        if(target.hasAttribute('data-number')) {
          appendNumber(target.getAttribute('data-number'));
          return;
        }
        if(target.hasAttribute('data-action')) {
          switch(target.getAttribute('data-action')) {
            case 'clear':
              clearAll();
              break;
            case 'backspace':
              backspace();
              break;
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
            case 'power':
            case 'sqrt':
              chooseOperator(target.getAttribute('data-action'));
              break;
            case 'equals':
              calculate();
              break;
          }
        }
      });

      // Keyboard support
      window.addEventListener('keydown', e => {
        if(e.repeat) return; // Ignore held keys
        if(errorState && !['Escape','c','C'].includes(e.key)) return;

        if((e.key >= '0' && e.key <= '9') || e.key === '.') {
          e.preventDefault();
          appendNumber(e.key);
          return;
        }

        switch(e.key) {
          case 'Enter':
          case '=':
            e.preventDefault();
            calculate();
            break;
          case '+':
            e.preventDefault();
            chooseOperator('add');
            break;
          case '-':
            e.preventDefault();
            chooseOperator('subtract');
            break;
          case '*':
            e.preventDefault();
            chooseOperator('multiply');
            break;
          case '/':
            e.preventDefault();
            chooseOperator('divide');
            break;
          case '^':
            e.preventDefault();
            chooseOperator('power');
            break;
          case 'r':
          case 'R':
            e.preventDefault();
            chooseOperator('sqrt');
            break;
          case 'Backspace':
            e.preventDefault();
            backspace();
            break;
          case 'Escape':
          case 'c':
          case 'C':
            e.preventDefault();
            clearAll();
            break;
        }
      });

      // Initialize
      updateDisplay();
    })();
  