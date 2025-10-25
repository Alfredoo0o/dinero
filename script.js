// --- INICIO DEL SCRIPT ---
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELECCIÓN DE ELEMENTOS DEL DOM ---
    // Generales
    const screenTitle = document.getElementById('screen-title');
    const modalBackdrop = document.getElementById('modal-backdrop');

    // Botones de Navegación
    const tabButtons = document.querySelectorAll('.tab-button');
    const screens = document.querySelectorAll('.screen');
    
    // Botones de Acciones Principales
    const addFloatingButton = document.getElementById('btn-add-floating');
    const themeToggleButton = document.getElementById('btn-theme-toggle');
    const settingsButton = document.getElementById('btn-settings');
    
    // Modales
    const allModals = document.querySelectorAll('.modal');
    const modalAddTransaction = document.getElementById('modal-add-transaction');
    const modalAddAccount = document.getElementById('modal-add-account');
    const modalAddGoal = document.getElementById('modal-add-goal');
    const modalAddDebt = document.getElementById('modal-add-debt');
    const modalAddSavings = document.getElementById('modal-add-savings');
    const modalPayDebt = document.getElementById('modal-pay-debt');
    const modalSettings = document.getElementById('modal-settings');
    // *** NUEVO: Modal de Edición ***
    const modalEditTransaction = document.getElementById('modal-edit-transaction');

    // Formularios
    const formAddTransaction = document.getElementById('form-add-transaction');
    const formAddAccount = document.getElementById('form-add-account');
    const formAddGoal = document.getElementById('form-add-goal');
    const formAddDebt = document.getElementById('form-add-debt');
    const formAddSavings = document.getElementById('form-add-savings');
    const formPayDebt = document.getElementById('form-pay-debt');
    const formAddCategory = document.getElementById('form-add-category');
    // *** NUEVO: Formulario de Edición ***
    const formEditTransaction = document.getElementById('form-edit-transaction');
    const btnDeleteTransaction = document.getElementById('btn-delete-transaction');
    const editTransactionIdInput = document.getElementById('edit-transaction-id');
    
    // Selectores de Transacción
    const btnToggleIngreso = document.getElementById('btn-toggle-ingreso');
    const btnToggleEgreso = document.getElementById('btn-toggle-egreso');
    const transactionTypeInput = document.getElementById('transaction-type');
    const transactionCategorySelect = document.getElementById('transaction-category');
    
    // Contenedores de Listas
    const summaryAccountsList = document.getElementById('summary-accounts-list');
    const summaryTransactionsList = document.getElementById('summary-transactions-list');
    const accountsList = document.getElementById('accounts-list');
    const goalsList = document.getElementById('goals-list');
    const debtsList = document.getElementById('debts-list');
    const categoryList = document.getElementById('category-list');
    const categoryAnalysisList = document.getElementById('category-analysis-list');
    
    // Gráfico
    const chartCanvas = document.getElementById('category-chart').getContext('2d');
    let categoryChart = null;


    // --- 2. BASE DE DATOS Y ESTADO DE LA APP ---
    
    let db = {
        accounts: [],
        transactions: [],
        goals: [],
        debts: [],
        settings: {
            theme: 'light',
            categories: {
                ingreso: ['Sueldo', 'Regalo', 'Otros'],
                egreso: ['Comida', 'Bencina', 'Transporte', 'Ocio', 'Cuentas', 'Ropa', 'Otros']
            }
        }
    };

    // Función para guardar en localStorage
    function saveDB() {
        localStorage.setItem('finanzasDB', JSON.stringify(db));
    }

    // Función para cargar desde localStorage
    function loadDB() {
        const localDB = localStorage.getItem('finanzasDB');
        if (localDB) {
            db = JSON.parse(localDB);
        }
    }

    // Función para generar IDs únicos
    function generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Función para formatear moneda (CLP)
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    }
    
    // Función para obtener fecha YYYY-MM-DD
    function getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    // --- 3. LÓGICA DE NAVEGACIÓN Y MODALES ---
    
    // Navegación principal (Tab Bar)
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreenId = button.dataset.screen;
            
            screens.forEach(s => s.classList.remove('active'));
            tabButtons.forEach(b => b.classList.remove('active'));
            
            document.getElementById(targetScreenId).classList.add('active');
            button.classList.add('active');
            
            screenTitle.textContent = button.querySelector('span').textContent;
            
            // Refrescar vistas al cambiar
            if (targetScreenId === 'screen-resumen') renderSummary();
            if (targetScreenId === 'screen-cuentas') renderAccountsScreen();
            if (targetScreenId === 'screen-analisis') renderAnalysisScreen();
            if (targetScreenId === 'screen-metas') renderGoalsScreen();
            if (targetScreenId === 'screen-deudas') renderDebtsScreen();
        });
    });

    // Abrir un modal
    function openModal(modal) {
        modalBackdrop.classList.add('active');
        modal.classList.add('active');
    }

    // Cerrar todos los modales
    function closeModal() {
        modalBackdrop.classList.remove('active');
        allModals.forEach(modal => modal.classList.remove('active'));
    }
    
    // Event Listeners para abrir modales
    addFloatingButton.addEventListener('click', () => {
        updateAccountDropdowns();
        updateCategoryDropdowns();
        document.getElementById('transaction-date').value = getTodayDate();
        formAddTransaction.reset();
        // Resetear toggle a egreso
        btnToggleEgreso.click();
        openModal(modalAddTransaction);
    });
    
    settingsButton.addEventListener('click', () => {
        renderCategoryList();
        openModal(modalSettings);
    });
    
    document.getElementById('btn-open-modal-account').addEventListener('click', () => {
        formAddAccount.reset();
        openModal(modalAddAccount);
    });
    
    document.getElementById('btn-open-modal-goal').addEventListener('click', () => {
        formAddGoal.reset();
        openModal(modalAddGoal);
    });
    
    document.getElementById('btn-open-modal-debt').addEventListener('click', () => {
        formAddDebt.reset();
        openModal(modalAddDebt);
    });

    // Event Listeners para cerrar modales
    modalBackdrop.addEventListener('click', closeModal);
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // --- 4. LÓGICA DE TEMAS (CLARO/OSCURO) ---
    
    const themeIcon = themeToggleButton.querySelector('i');
    
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.classList.remove('ph-sun');
            themeIcon.classList.add('ph-moon');
        } else {
            document.body.classList.remove('dark-mode');
            themeIcon.classList.remove('ph-moon');
            themeIcon.classList.add('ph-sun');
        }
        db.settings.theme = theme;
        saveDB();
        
        // Actualizar gráfico si existe (destruir y recrear)
        if (categoryChart) {
             renderAnalysisScreen();
        }
    }

    themeToggleButton.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // --- 5. LÓGICA DE DATOS (CUENTAS, TRANSACCIONES, ETC.) ---

    // --- Cuentas ---
    const accountIcons = [
        'ph-fill ph-bank', 'ph-fill ph-money', 'ph-fill ph-credit-card', 
        'ph-fill ph-wallet', 'ph-fill ph-sack', 'ph-fill ph-cash-coin',
        'ph-fill ph-piggy-bank'
    ];
    const accountColors = [
        'color-0', 'color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7', 'color-8'
    ];

    function addAccount(name, initialBalance) {
        const iconIndex = db.accounts.length % accountIcons.length;
        const colorIndex = db.accounts.length % accountColors.length;

        const newAccount = {
            id: generateId(),
            name: name,
            icon: accountIcons[iconIndex],
            colorClass: accountColors[colorIndex],
            initialBalance: parseFloat(initialBalance)
        };
        db.accounts.push(newAccount);
        saveDB();
        renderAll();
    }
    
    function getAccountBalance(accountId) {
        const account = db.accounts.find(a => a.id === accountId);
        if (!account) return 0;
        
        let balance = account.initialBalance;
        db.transactions.forEach(t => {
            if (t.accountId === accountId) {
                if (t.type === 'ingreso') {
                    balance += t.amount;
                } else {
                    balance -= t.amount;
                }
            }
        });
        return balance;
    }
    
    function getTotalBalance() {
        let total = 0;
        db.accounts.forEach(account => {
            total += getAccountBalance(account.id);
        });
        return total;
    }

    // --- Transacciones ---
    btnToggleEgreso.addEventListener('click', () => {
        transactionTypeInput.value = 'egreso';
        btnToggleEgreso.classList.add('active');
        btnToggleIngreso.classList.remove('active');
        updateCategoryDropdowns();
    });
    btnToggleIngreso.addEventListener('click', () => {
        transactionTypeInput.value = 'ingreso';
        btnToggleIngreso.classList.add('active');
        btnToggleEgreso.classList.remove('active');
        updateCategoryDropdowns();
    });

    function addTransaction(type, amount, category, accountId, date, notes) {
        const newTransaction = {
            id: generateId(),
            type: type,
            amount: parseFloat(amount),
            category: category,
            accountId: accountId,
            date: date,
            notes: notes,
            timestamp: new Date(date).getTime()
        };
        db.transactions.push(newTransaction);
        saveDB();
        renderAll();
    }

    // *** NUEVO: Abrir Modal de Edición ***
    function openEditModal(transactionId) {
        const transaction = db.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // Guardar el ID en el input oculto
        editTransactionIdInput.value = transactionId;

        // Poblar los campos del formulario
        document.getElementById('edit-transaction-type-display').textContent = transaction.type;
        document.getElementById('edit-transaction-amount').value = transaction.amount;
        document.getElementById('edit-transaction-date').value = transaction.date;
        document.getElementById('edit-transaction-notes').value = transaction.notes;

        // Poblar <select> de categorías (solo las del tipo de transacción)
        const categorySelect = document.getElementById('edit-transaction-category');
        categorySelect.innerHTML = '';
        db.settings.categories[transaction.type].forEach(cat => {
            categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
        categorySelect.value = transaction.category; // Seleccionar la correcta

        // Poblar <select> de cuentas
        const accountSelect = document.getElementById('edit-transaction-account');
        accountSelect.innerHTML = '';
        db.accounts.forEach(account => {
            accountSelect.innerHTML += `<option value="${account.id}">${account.name}</option>`;
        });
        accountSelect.value = transaction.accountId; // Seleccionar la correcta

        openModal(modalEditTransaction);
    }


    // --- Metas ---
    function addGoal(name, targetAmount) {
        const newGoal = {
            id: generateId(),
            name: name,
            targetAmount: parseFloat(targetAmount),
            savedAmount: 0 // Inicia en 0
        };
        db.goals.push(newGoal);
        saveDB();
        renderGoalsScreen();
    }
    
    function addSavingsToGoal(goalId, amount, fromAccountId) {
        const goal = db.goals.find(g => g.id === goalId);
        if (goal) {
            goal.savedAmount += parseFloat(amount);
            addTransaction('egreso', amount, 'Ahorro Meta', fromAccountId, getTodayDate(), `Abono a meta: ${goal.name}`);
        }
    }

    // --- Deudas ---
    function addDebt(name, totalAmount) {
        const newDebt = {
            id: generateId(),
            name: name,
            totalAmount: parseFloat(totalAmount),
            paidAmount: 0 // Inicia en 0
        };
        db.debts.push(newDebt);
        saveDB();
        renderDebtsScreen();
    }
    
    function addPaymentToDebt(debtId, amount, fromAccountId) {
        const debt = db.debts.find(d => d.id === debtId);
        if (debt) {
            debt.paidAmount += parseFloat(amount);
            addTransaction('egreso', amount, 'Pago Deuda', fromAccountId, getTodayDate(), `Pago de: ${debt.name}`);
        }
    }

    // --- Categorías ---
    function addCategory(name) {
        if (name && !db.settings.categories.egreso.includes(name) && !db.settings.categories.ingreso.includes(name)) {
            db.settings.categories.egreso.push(name); // Por defecto se añade a egreso
            saveDB();
            renderCategoryList();
            updateCategoryDropdowns(); // Actualizar dropdowns
        }
    }
    
    function deleteCategory(name) {
        const defaultCategories = ['Comida', 'Bencina', 'Transporte', 'Ocio', 'Cuentas', 'Ropa', 'Otros', 'Sueldo', 'Regalo', 'Pago Deuda', 'Ahorro Meta'];
        if (defaultCategories.includes(name)) {
            alert('No puedes eliminar una categoría predeterminada.');
            return;
        }
        
        const isInUse = db.transactions.some(t => t.category === name);
        if (isInUse) {
            alert('No puedes eliminar esta categoría porque está en uso en tus transacciones.');
            return;
        }

        db.settings.categories.egreso = db.settings.categories.egreso.filter(c => c !== name);
        db.settings.categories.ingreso = db.settings.categories.ingreso.filter(c => c !== name);
        saveDB();
        renderCategoryList();
        updateCategoryDropdowns();
    }

    // --- 6. FUNCIONES DE RENDERIZADO (Actualizar UI) ---
    
    function renderAll() {
        const activeScreen = document.querySelector('.screen.active');
        if (!activeScreen) {
             renderSummary(); // Default
        } else {
            switch (activeScreen.id) {
                case 'screen-resumen': renderSummary(); break;
                case 'screen-cuentas': renderAccountsScreen(); break;
                case 'screen-analisis': renderAnalysisScreen(); break;
                case 'screen-metas': renderGoalsScreen(); break;
                case 'screen-deudas': renderDebtsScreen(); break;
                case 'screen-settings': renderCategoryList(); break; 
            }
        }
        updateAccountDropdowns(); // Siempre refrescar dropdowns
        updateCategoryDropdowns(); 
    }

    // RENDER: Resumen
    function renderSummary() {
        document.getElementById('total-balance').textContent = formatCurrency(getTotalBalance());
        
        summaryAccountsList.innerHTML = '';
        if (db.accounts.length === 0) {
            summaryAccountsList.innerHTML = '<p class="empty-state">Añade tu primera cuenta para ver un resumen.</p>';
        } else {
            db.accounts.forEach(account => {
                const balance = getAccountBalance(account.id);
                summaryAccountsList.innerHTML += `
                    <div class="account-summary-card neumorphic-convex">
                        <div class="account-logo-icon ${account.colorClass}">
                            <i class="${account.icon}"></i>
                        </div>
                        <p>${account.name}</p>
                        <span>${formatCurrency(balance)}</span>
                    </div>
                `;
            });
        }
        
        summaryTransactionsList.innerHTML = '';
        const recentTransactions = [...db.transactions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
        
        if (recentTransactions.length === 0) {
            summaryTransactionsList.innerHTML = '<p class="empty-state">No hay transacciones recientes.</p>';
        } else {
            recentTransactions.forEach(t => {
                const icon = t.type === 'ingreso' ? 'ph-arrow-up-right' : 'ph-arrow-down-left';
                const sign = t.type === 'ingreso' ? '+' : '-';
                
                // *** MODIFICADO: Añadido data-id="${t.id}" ***
                summaryTransactionsList.innerHTML += `
                    <div class="transaction-item neumorphic-concave" data-id="${t.id}">
                        <div class="transaction-details">
                            <div class="transaction-icon ${t.type} neumorphic-convex">
                                <i class="ph ${icon}"></i>
                            </div>
                            <div class="transaction-info">
                                <p>${t.category}</p>
                                <span>${t.date} ${t.notes ? '| ' + t.notes : ''}</span>
                            </div>
                        </div>
                        <div class="transaction-amount ${t.type}">
                            ${sign}${formatCurrency(t.amount)}
                        </div>
                    </div>
                `;
            });
        }
    }

    // RENDER: Pantalla Cuentas
    function renderAccountsScreen() {
        accountsList.innerHTML = '';
        if (db.accounts.length === 0) {
            accountsList.innerHTML = '<p class="empty-state">No tienes cuentas. ¡Añade una!</p>';
        } else {
            db.accounts.forEach(account => {
                const balance = getAccountBalance(account.id);
                accountsList.innerHTML += `
                    <div class="account-card neumorphic-convex">
                        <div class="account-logo-icon ${account.colorClass}">
                            <i class="${account.icon}"></i>
                        </div>
                        <div class="account-card-info">
                            <p>${account.name}</p>
                            <span>Saldo Actual</span>
                        </div>
                        <p class="account-card-balance">${formatCurrency(balance)}</p>
                    </div>
                `;
            });
        }
    }

    // RENDER: Pantalla Metas
    function renderGoalsScreen() {
        goalsList.innerHTML = '';
        if (db.goals.length === 0) {
            goalsList.innerHTML = '<p class="empty-state">No tienes metas. ¡Crea una!</p>';
        } else {
            db.goals.forEach(goal => {
                const progress = (goal.savedAmount / goal.targetAmount) * 100;
                goalsList.innerHTML += `
                    <div class="goal-card neumorphic-convex">
                        <div class="goal-card-header">
                            <h3>${goal.name}</h3>
                            <button class="btn-add-savings neumorphic-convex" data-id="${goal.id}">Abonar</button>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${progress > 100 ? 100 : progress}%;"></div>
                        </div>
                        <p>${formatCurrency(goal.savedAmount)} / ${formatCurrency(goal.targetAmount)}</p>
                    </div>
                `;
            });
            document.querySelectorAll('.btn-add-savings').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const goalId = e.currentTarget.dataset.id;
                    document.getElementById('savings-goal-id').value = goalId;
                    updateAccountDropdowns('savings-account');
                    document.getElementById('savings-amount').value = ''; // Limpiar campo
                    openModal(modalAddSavings);
                });
            });
        }
    }

    // RENDER: Pantalla Deudas
    function renderDebtsScreen() {
        debtsList.innerHTML = '';
        if (db.debts.length === 0) {
            debtsList.innerHTML = '<p class="empty-state">¡Felicidades, no tienes deudas registradas!</p>';
        } else {
            db.debts.forEach(debt => {
                const remaining = debt.totalAmount - debt.paidAmount;
                const progress = (debt.paidAmount / debt.totalAmount) * 100;
                debtsList.innerHTML += `
                    <div class="debt-card neumorphic-convex">
                        <div class="debt-card-header">
                            <h3>${debt.name}</h3>
                            ${remaining > 0 ? `<button class="btn-pay-debt neumorphic-convex" data-id="${debt.id}">Pagar</button>` : ''}
                        </div>
                        ${remaining > 0 ? `
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${progress}%; background-color: var(--primary-color);"></div>
                        </div>
                        <p>Pagado: ${formatCurrency(debt.paidAmount)} / ${formatCurrency(debt.totalAmount)}</p>
                        <p style="font-weight: 600;">Resta: ${formatCurrency(remaining)}</p>
                        ` : `
                        <p style="color: var(--accent-color); font-weight: 600;">¡Deuda Pagada!</p>
                        <p>Total: ${formatCurrency(debt.totalAmount)}</p>
                        `}
                    </div>
                `;
            });
            document.querySelectorAll('.btn-pay-debt').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const debtId = e.currentTarget.dataset.id;
                    document.getElementById('payment-debt-id').value = debtId;
                    updateAccountDropdowns('payment-account');
                    document.getElementById('payment-amount').value = ''; // Limpiar campo
                    openModal(modalPayDebt);
                });
            });
        }
    }
    
    // RENDER: Pantalla Análisis
    function renderAnalysisScreen() {
        const thirtyDaysAgo = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);
        const recentExpenses = db.transactions.filter(t => t.type === 'egreso' && t.timestamp >= thirtyDaysAgo);
        
        const categoryData = {};
        
        recentExpenses.forEach(t => {
            if (!categoryData[t.category]) {
                categoryData[t.category] = 0;
            }
            categoryData[t.category] += t.amount;
        });
        
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        
        const textColor = db.settings.theme === 'dark' ? '#e0e5ec' : '#333a4f';

        if (categoryChart) {
            categoryChart.destroy(); // Destruir gráfico anterior para evitar conflictos
        }
        
        categoryAnalysisList.innerHTML = ''; // Limpiar lista
        
        if(labels.length > 0) {
            categoryChart = new Chart(chartCanvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            '#6C5CE7', '#00B894', '#FF7675', '#FFEAA7', '#74B9FF', 
                            '#FDCB6E', '#A29BFE', '#55E6C1', '#FAB1A0', '#C0FDFB', 
                            '#E2F7F2', '#DBECF5', '#F5DBE9', '#F5E2DB', '#ECF5DB'
                        ],
                        borderWidth: 0,
                        borderColor: db.settings.theme === 'dark' ? '#2c2f36' : '#e0e5ec'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // ¡IMPORTANTE para el bug fix!
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: textColor,
                                boxWidth: 15,
                                padding: 15
                            }
                        }
                    }
                }
            });
            
            // Llenar lista de desglose
            let totalExpenses = data.reduce((a, b) => a + b, 0);
            labels.forEach((label, index) => {
                const amount = data[index];
                const percentage = (amount / totalExpenses * 100).toFixed(1);
                categoryAnalysisList.innerHTML += `
                    <div class="transaction-item neumorphic-concave">
                        <div class="transaction-details">
                            <div class="transaction-info">
                                <p>${label}</p>
                                <span>${percentage}% del total</span>
                            </div>
                        </div>
                        <div class="transaction-amount egreso">
                            -${formatCurrency(amount)}
                        </div>
                    </div>
                `;
            });
            
        } else {
            categoryAnalysisList.innerHTML = '<p class="empty-state">No hay gastos en los últimos 30 días para analizar.</p>';
        }
    }
    
    // RENDER: Lista de Categorías (en Configuración)
    function renderCategoryList() {
        categoryList.innerHTML = '';
        const allCategories = [...new Set([...db.settings.categories.egreso, ...db.settings.categories.ingreso])];
        
        allCategories.forEach(cat => {
            const defaultCategories = ['Comida', 'Bencina', 'Transporte', 'Ocio', 'Cuentas', 'Ropa', 'Otros', 'Sueldo', 'Regalo', 'Pago Deuda', 'Ahorro Meta'];
            const isDefault = defaultCategories.includes(cat);
            categoryList.innerHTML += `
                <div class="category-item neumorphic-concave">
                    <span>${cat}</span>
                    ${!isDefault ? `<button class="btn-delete-category" data-name="${cat}"><i class="ph ph-trash"></i></button>` : ''}
                </div>
            `;
        });
        
        document.querySelectorAll('.btn-delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const catName = e.currentTarget.dataset.name;
                if (confirm(`¿Seguro que quieres eliminar la categoría "${catName}"?`)) {
                    deleteCategory(catName);
                }
            });
        });
    }

    // RENDER: Actualizar <select> de categorías
    function updateCategoryDropdowns() {
        const type = transactionTypeInput.value;
        const categories = db.settings.categories[type].filter(cat => !['Ahorro Meta', 'Pago Deuda'].includes(cat)); 
        
        transactionCategorySelect.innerHTML = '';
        categories.forEach(cat => {
            transactionCategorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
        
        if (categories.length === 0) {
            transactionCategorySelect.innerHTML = '<option value="" disabled selected>Añade categorías en Configuración</option>';
        }
    }

    // RENDER: Actualizar <select> de cuentas
    function updateAccountDropdowns(selectId = 'transaction-account') {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '';
        if (db.accounts.length === 0) {
            select.innerHTML = '<option value="" disabled selected>Crea una cuenta primero</option>';
        }
        db.accounts.forEach(account => {
            select.innerHTML += `<option value="${account.id}">${account.name}</option>`;
        });
        
        if (selectId === 'transaction-account') {
            updateAccountDropdowns('savings-account');
            updateAccountDropdowns('payment-account');
            updateAccountDropdowns('edit-transaction-account'); // Asegurarse de actualizar el de edición también
        }
    }

    // --- 7. EVENT LISTENERS DE FORMULARIOS ---
    
    // Form: Añadir Transacción
    formAddTransaction.addEventListener('submit', (e) => {
        e.preventDefault();
        const accountId = document.getElementById('transaction-account').value;
        if (!accountId) {
            alert('Por favor, crea una cuenta antes de añadir transacciones.');
            return;
        }
        addTransaction(
            transactionTypeInput.value,
            document.getElementById('transaction-amount').value,
            document.getElementById('transaction-category').value,
            accountId,
            document.getElementById('transaction-date').value,
            document.getElementById('transaction-notes').value
        );
        formAddTransaction.reset();
        closeModal();
    });

    // Form: Añadir Cuenta
    formAddAccount.addEventListener('submit', (e) => {
        e.preventDefault();
        addAccount(
            document.getElementById('account-name').value,
            document.getElementById('account-balance').value
        );
        formAddAccount.reset();
        closeModal();
    });
    
    // Forms: Metas y Deudas (sin cambios)
    formAddGoal.addEventListener('submit', (e) => { e.preventDefault(); addGoal(document.getElementById('goal-name').value, document.getElementById('goal-target').value); formAddGoal.reset(); closeModal(); });
    formAddDebt.addEventListener('submit', (e) => { e.preventDefault(); addDebt(document.getElementById('debt-name').value, document.getElementById('debt-total').value); formAddDebt.reset(); closeModal(); });
    formAddSavings.addEventListener('submit', (e) => { e.preventDefault(); const accountId = document.getElementById('savings-account').value; if (!accountId) { alert('Crea una cuenta primero'); return; } addSavingsToGoal(document.getElementById('savings-goal-id').value, document.getElementById('savings-amount').value, accountId); formAddSavings.reset(); closeModal(); });
    formPayDebt.addEventListener('submit', (e) => { e.preventDefault(); const accountId = document.getElementById('payment-account').value; if (!accountId) { alert('Crea una cuenta primero'); return; } addPaymentToDebt(document.getElementById('payment-debt-id').value, document.getElementById('payment-amount').value, accountId); formPayDebt.reset(); closeModal(); });
    
    // Form: Añadir Categoría
    formAddCategory.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('new-category-name');
        addCategory(input.value.trim());
        input.value = '';
    });
    
    // Botón: Resetear Datos
    document.getElementById('btn-reset-data').addEventListener('click', () => {
        if (confirm('¿ESTÁS SEGURO? Se borrarán TODOS tus datos...')) {
            localStorage.removeItem('finanzasDB');
            location.reload();
        }
    });

    // *** NUEVO: Listeners para el Modal de Edición ***

    // Listener para abrir el modal (Delegación de eventos)
    summaryTransactionsList.addEventListener('click', (e) => {
        // Encontrar el item de transacción más cercano al que se hizo clic
        const transactionItem = e.target.closest('.transaction-item');
        if (transactionItem) {
            const transactionId = transactionItem.dataset.id;
            openEditModal(transactionId);
        }
    });

    // Listener para el botón ACTUALIZAR
    formEditTransaction.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const transactionId = editTransactionIdInput.value;
        const transactionIndex = db.transactions.findIndex(t => t.id === transactionId);
        
        if (transactionIndex > -1) {
            // Actualizar el objeto de transacción en la base de datos
            db.transactions[transactionIndex] = {
                ...db.transactions[transactionIndex], // Mantener tipo, id, etc.
                amount: parseFloat(document.getElementById('edit-transaction-amount').value),
                category: document.getElementById('edit-transaction-category').value,
                accountId: document.getElementById('edit-transaction-account').value,
                date: document.getElementById('edit-transaction-date').value,
                notes: document.getElementById('edit-transaction-notes').value,
                timestamp: new Date(document.getElementById('edit-transaction-date').value).getTime() // Recalcular timestamp
            };
            
            saveDB();
            closeModal();
            renderAll(); // Refrescar toda la UI
        }
    });
    
    // Listener para el botón ELIMINAR
    btnDeleteTransaction.addEventListener('click', () => {
        const transactionId = editTransactionIdInput.value;
        
        if (confirm('¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer.')) {
            // Filtrar la base de datos para excluir esta transacción
            db.transactions = db.transactions.filter(t => t.id !== transactionId);
            
            saveDB();
            closeModal();
            renderAll(); // Refrescar toda la UI
        }
    });


    // --- 8. INICIALIZACIÓN DE LA APP ---
    
    function initApp() {
        loadDB();
        applyTheme(db.settings.theme); // Aplicar tema guardado
        renderAll(); // Renderizar la pantalla de resumen inicial
        // Asegurarse de que las categorías automáticas existan
        if (!db.settings.categories.egreso.includes('Ahorro Meta')) {
            db.settings.categories.egreso.push('Ahorro Meta');
        }
        if (!db.settings.categories.egreso.includes('Pago Deuda')) {
            db.settings.categories.egreso.push('Pago Deuda');
        }
        saveDB();
    }
    
    initApp();

}); // --- FIN DEL SCRIPT ---
