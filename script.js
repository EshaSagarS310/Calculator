    document.addEventListener("DOMContentLoaded", () => {
        const display = document.getElementById('display');
        const historyList = document.getElementById('historyList');
        const themeToggle = document.getElementById('themeToggle');
        const degRadToggle = document.getElementById('degRadToggle');
        const memoryStatus = document.getElementById('memoryStatus');
        const shiftStatus = document.getElementById('shiftStatus');
        const formulaPreview = document.getElementById('formulaPreview');
        const shiftBtn = document.getElementById('shiftBtn');
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');

        let isDegree = false;
        let isShiftActive = false;
        let memoryValue = 0;
        let lastAns = 0;

        // Theme logic
        const applyTheme = (isDark) => {
            if (isDark) {
                document.body.classList.add('dark-mode');
                themeToggle.innerHTML = '<i class="fa-regular fa-sun"></i>';
            } else {
                document.body.classList.remove('dark-mode');
                themeToggle.innerHTML = '<i class="fa-regular fa-moon"></i>';
            }
        };
        
        const initTheme = () => {
            const stored = localStorage.getItem('calc_theme');
            if (stored === 'dark') {
                applyTheme(true);
            } else {
                applyTheme(false);
            }
        };
        
        themeToggle.addEventListener('click', () => {
            const isDarkNow = document.body.classList.contains('dark-mode');
            if (isDarkNow) {
                applyTheme(false);
                localStorage.setItem('calc_theme', 'light');
            } else {
                applyTheme(true);
                localStorage.setItem('calc_theme', 'dark');
            }
        });

        // DEG/RAD toggle
        degRadToggle.addEventListener('click', () => {
            isDegree = !isDegree;
            degRadToggle.innerText = isDegree ? 'DEG' : 'RAD';
        });

        // SHIFT logic
        const toggleShiftMode = (forceState = null) => {
            isShiftActive = forceState !== null ? forceState : !isShiftActive;
            shiftBtn.classList.toggle('shift-active', isShiftActive);
            shiftStatus.innerText = isShiftActive ? '2nd' : '';
            document.querySelectorAll('.shiftswappable').forEach(btn => {
                const originalText = btn.dataset.val.replace('(', '');
                const shiftedText = btn.dataset.shiftval ? btn.dataset.shiftval.replace('(', '⁻¹') : originalText;
                btn.innerText = isShiftActive ? shiftedText : originalText;
            });
        };
        shiftBtn.addEventListener('click', () => toggleShiftMode());

        const updateMemoryIndicator = () => {
            memoryStatus.innerText = memoryValue !== 0 ? 'M' : '';
        };

        // ----------------- MATH ENGINE -----------------
        const parseMathInput = (expr) => {
            let processed = expr.replace(/Ans/g, `(${lastAns})`);
            processed = processed.replace(/ln\(/g, 'Math.log(').replace(/log\(/g, 'Math.log10(');
            processed = processed.replace(/sqrt\(/g, 'Math.sqrt(').replace(/exp\(/g, 'Math.exp(');
            processed = processed.replace(/sinh\(/g, 'Math.sinh(').replace(/cosh\(/g, 'Math.cosh(').replace(/tanh\(/g, 'Math.tanh(');
            processed = processed.replace(/\*\*2/g, '**2');
            processed = processed.replace(/\*\*/g, '**');
            processed = processed.replace(/10\*\*/g, '10**');
            processed = processed.replace(/%/g, '/100');
            
            if (isShiftActive) {
                processed = processed.replace(/asin\(/g, 'Math.asin(');
                processed = processed.replace(/acos\(/g, 'Math.acos(');
                processed = processed.replace(/atan\(/g, 'Math.atan(');
                processed = processed.replace(/asinh\(/g, 'Math.asinh(');
                processed = processed.replace(/acosh\(/g, 'Math.acosh(');
                processed = processed.replace(/atanh\(/g, 'Math.atanh(');
            } else {
                if (isDegree) {
                    processed = processed.replace(/sin\(([^)]+)\)/g, 'Math.sin(($1) * Math.PI / 180)');
                    processed = processed.replace(/cos\(([^)]+)\)/g, 'Math.cos(($1) * Math.PI / 180)');
                    processed = processed.replace(/tan\(([^)]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
                } else {
                    processed = processed.replace(/sin\(/g, 'Math.sin(');
                    processed = processed.replace(/cos\(/g, 'Math.cos(');
                    processed = processed.replace(/tan\(/g, 'Math.tan(');
                }
            }
            return new Function(`return (${processed})`)();
        };

        const runFactorial = (n) => {
            if (n < 0 || !Number.isInteger(n)) return NaN;
            let val = 1;
            for (let i = 2; i <= n; i++) val *= i;
            return val;
        };

        // History handling features
        const loadHistory = () => {
            const data = JSON.parse(localStorage.getItem('lumina_calc_hist')) || [];
            if (data.length === 0) {
                historyList.innerHTML = '<div class="no-history-msg">No logs recorded</div>';
            } else {
                historyList.innerHTML = data.map(entry => `<div class="history-item text-truncate">${entry}</div>`).join('');
            }
        };

        const appendHistoryRecord = (expression, result) => {
            const data = JSON.parse(localStorage.getItem('lumina_calc_hist')) || [];
            data.unshift(`${expression} = ${result}`);
            localStorage.setItem('lumina_calc_hist', JSON.stringify(data.slice(0, 15)));
            loadHistory();
        };

        // Action event listener to Clear button
        clearHistoryBtn.addEventListener('click', () => {
            localStorage.removeItem('lumina_calc_hist');
            loadHistory();
        });

        historyList.addEventListener('click', (e) => {
            const item = e.target.closest('.history-item');
            if (!item) return;
            const parts = item.innerText.split(' = ');
            if (parts[1]) {
                display.value = parts[1];
                formulaPreview.innerText = parts[0];
            }
        });

        // Core action router
        const routeAction = (action, staticVal) => {
            if (staticVal !== undefined) {
                if (staticVal === '1/') {
                    display.value = '1/(' + display.value + ')';
                } else if (staticVal === '**2') {
                    display.value = `(${display.value})**2`;
                } else if (staticVal === '10**') {
                    display.value = `10**(${display.value})`;
                } else {
                    display.value += staticVal;
                }
                return;
            }
            
            switch(action) {
                case 'clear':
                    display.value = '';
                    formulaPreview.innerText = '';
                    break;
                case 'delete':
                    display.value = display.value.slice(0, -1);
                    break;
                case 'random':
                    display.value += Math.random().toFixed(8);
                    break;
                case 'negate':
                    if(display.value.startsWith('-')) display.value = display.value.slice(1);
                    else display.value = '-' + display.value;
                    break;
                case 'factorial':
                    try {
                        let num = parseFloat(display.value);
                        if(isNaN(num)) throw new Error();
                        let factRes = runFactorial(num);
                        display.value = factRes;
                        lastAns = factRes;
                    } catch { display.value = 'Error'; }
                    break;
                case 'memAdd': 
                    memoryValue += parseFloat(display.value) || 0; 
                    updateMemoryIndicator();
                    break;
                case 'memSub': 
                    memoryValue -= parseFloat(display.value) || 0; 
                    updateMemoryIndicator();
                    break;
                case 'memClear': 
                    memoryValue = 0; 
                    updateMemoryIndicator();
                    break;
                case 'memRecall': 
                    display.value += memoryValue; 
                    break;
                case 'calculate':
                    try {
                        let rawExpr = display.value.trim();
                        if (!rawExpr) return;
                        let balanced = rawExpr;
                        const open = (balanced.match(/\(/g) || []).length;
                        const close = (balanced.match(/\)/g) || []).length;
                        if (open > close) balanced += ')'.repeat(open - close);
                        let result = parseMathInput(balanced);
                        result = Math.round(result * 1e12) / 1e12;
                        formulaPreview.innerText = rawExpr;
                        appendHistoryRecord(rawExpr, result);
                        display.value = result;
                        lastAns = result;
                    } catch(e) { display.value = 'Error'; }
                    break;
                default: break;
            }
        };

        // Attach event listeners to all buttons
        document.querySelectorAll('.grid-block').forEach(grid => {
            grid.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-calc');
                if (!btn || btn.id === 'shiftBtn') return;
                
                const isSwappable = btn.classList.contains('shiftswappable');
                let finalVal = (isShiftActive && isSwappable) ? btn.dataset.shiftval : btn.dataset.val;
                const action = btn.dataset.action;
                
                routeAction(action, finalVal);
                
                if (isShiftActive && (finalVal || action === 'calculate' || action === 'factorial')) {
                    toggleShiftMode(false);
                }
            });
        });

        // Keyboard support
        window.addEventListener('keydown', (e) => {
            const validKeys = ['0','1','2','3','4','5','6','7','8','9','+','-','*','/','.','%','(',')'];
            if (validKeys.includes(e.key)) {
                routeAction(null, e.key);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                routeAction('calculate');
            } else if (e.key === 'Backspace') {
                routeAction('delete');
            } else if (e.key === 'Escape') {
                routeAction('clear');
            }
        });

        initTheme();
        loadHistory();
        updateMemoryIndicator();
        shiftStatus.innerText = '';
    });