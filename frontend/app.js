// 1. Стан застосунку (Масив для зберігання записів у пам'яті)
let requests = [];

// Знаходження основних елементів DOM
const form = document.getElementById('createForm');
const tbody = document.getElementById('itemsTableBody');

// 2. Обробка події відправки форми
form.addEventListener('submit', (event) => {
    // Скасування перезавантаження сторінки 
    event.preventDefault();

    // Крок 1: Зчитування даних 
    const dto = readForm();

    // Крок 2: Валідація 
    if (!validate(dto)) return;

    // Крок 3: Оновлення даних (Додавання в масив з ID) 
    const newItem = {
        ...dto,
        id: Date.now() // Простий спосіб генерації унікального ID
    };
    requests.push(newItem);

    // Крок 4: Рендеринг (Відображення в таблиці)
    renderTable();

    // Очищення форми та помилок після успіху 
    form.reset();
    clearErrors();
});

// Функція зчитування даних 
function readForm() {
    return {
        itemCode: document.getElementById('itemCodeInput').value.trim(),
        userName: document.getElementById('userInput').value.trim(),
        dateFrom: document.getElementById('dateFromInput').value,
        dateTo: document.getElementById('dateToInput').value,
        comment: document.getElementById('commentInput').value.trim(),
        status: document.getElementById('statusSelect').value
    };
}

// Функція валідації (Адресне виведення помилок) 
function validate(dto) {
    clearErrors();
    let isValid = true;

    if (dto.itemCode === "") {
        showError('itemCodeInput', 'itemCodeError', 'Вкажіть код обладнання');
        isValid = false;
    }

    if (dto.userName.length < 3) {
        showError('userInput', 'userError', 'Ім’я має бути не менше 3 символів');
        isValid = false;
    }

    if (dto.dateFrom === "" || dto.dateTo === "") {
        if (dto.dateFrom === "") showError('dateFromInput', 'dateFromError', 'Вкажіть дату');
        if (dto.dateTo === "") showError('dateToInput', 'dateToError', 'Вкажіть дату');
        isValid = false;
    }

    if (dto.status === "") {
        showError('statusSelect', 'statusError', 'Оберіть статус');
        isValid = false;
    }

    return isValid;
}

// Функція видалення запису 
function deleteItem(id) {
    requests = requests.filter(item => item.id !== id);
    renderTable();
}

// Функція рендерингу таблиці 
function renderTable() {
    // Очищення та заповнення таблиці через innerHTML 
    tbody.innerHTML = requests.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.itemCode}</td>
            <td>${item.userName}</td>
            <td>${item.dateFrom} — ${item.dateTo}</td>
            <td>${item.status}</td>
            <td>${item.comment}</td>
            <td>
                <button type="button" onclick="deleteItem(${item.id})">Видалити</button>
            </td>
        </tr>
    `).join('');
}

// Допоміжні функції для UI (Помилки та класи) [cite: 1063, 1320]
function showError(inputId, errorId, message) {
    document.getElementById(inputId).classList.add('invalid');
    document.getElementById(errorId).innerHTML = message;
}

function clearErrors() {
    const inputs = form.querySelectorAll('input, select, textarea');
    const errors = form.querySelectorAll('.error-text');
    inputs.forEach(input => input.classList.remove('invalid'));
    errors.forEach(error => error.innerHTML = '');
}