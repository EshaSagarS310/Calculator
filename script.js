    // ==================== ORIGINAL FUNCTIONALITY (unchanged) ====================
    const display = document.getElementById('display');
    const historyList = document.getElementById('historyList');
    const themeToggle = document.getElementById('themeToggle');

    // Append values
    function appendValue(value) {
        display.value += value;
        addDisplayGlow();
    }

    // Clear display
    function clearDisplay() {
        display.value = '';
        addDisplayGlow();
    }

    // Delete last character
    function deleteLast() {
        display.value = display.value.slice(0, -1);
        addDisplayGlow();
    }

    // Calculate result
    function calculate() {
        try {
            let expression = display.value;
            expression = expression.replace(/%/g, '/100');
            let result = eval(expression);
            if(result === Infinity || isNaN(result)) {
                display.value = 'Error';
                return;
            }
            saveHistory(display.value, result);
            display.value = result;
            addDisplayGlow();
        } catch (error) {
            display.value = 'Error';
        }
    }

    // Factorial Function (kept for completeness)
    function factorial(num) {
        if(num < 0) return NaN;
        if(num === 0) return 1;
        let result = 1;
        for(let i = 1; i <= num; i++) {
            result *= i;
        }
        return result;
    }

    // Save history
    function saveHistory(expression, result) {
        const history = JSON.parse(localStorage.getItem('calcHistory')) || [];
        history.unshift(`${expression} = ${result}`);
        localStorage.setItem('calcHistory', JSON.stringify(history));
        loadHistory();
    }

    // Load history
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('calcHistory')) || [];
        historyList.innerHTML = '';
        history.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('history-item');
            div.innerText = item;
            historyList.appendChild(div);
        });
    }

    // Clear history
    function clearHistory() {
        localStorage.removeItem('calcHistory');
        loadHistory();
    }

    // Theme toggle
    function toggleTheme() {
        document.body.classList.toggle('light-mode');
        if(document.body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }
    }

    // Load theme
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if(savedTheme === 'light') {
            document.body.classList.add('light-mode');
        }
    }

    // Keyboard Support (unchanged)
    window.addEventListener('keydown', (e) => {
        if((e.key >= 0 && e.key <= 9) || ['+', '-', '*', '/', '.', '%', '(', ')'].includes(e.key)) {
            appendValue(e.key);
        }
        else if(e.key === 'Enter') {
            e.preventDefault();
            calculate();
        }
        else if(e.key === 'Backspace') {
            deleteLast();
        }
        else if(e.key === 'Escape') {
            clearDisplay();
        }
    });

    // Prevent typing inside input directly
    display.addEventListener('keydown', (e) => {
        e.preventDefault();
    });

    // Theme button event
    themeToggle.addEventListener('click', toggleTheme);

    // ==================== ADDED ANIMATION HELPER ====================
    function addDisplayGlow() {
        display.classList.add('display-glow');
        setTimeout(() => {
            display.classList.remove('display-glow');
        }, 300);
    }

    // Initial load
    loadTheme();
    loadHistory();