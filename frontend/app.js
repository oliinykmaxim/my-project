// 1. Стан застосунку 

let requests = JSON.parse(localStorage.getItem('checkoutRequests')) || [];

// Знаходження основних елементів DOM
const form = document.getElementById('createForm');
const tbody = document.getElementById('itemsTableBody');

//  Відразу після завантаження сторінки малюємо таблицю з тими даними, що вже є в пам'яті
renderTable();

// 2. Обробка події відправки форми
form.addEventListener('submit', (event) => {
    event.preventDefault();

    const dto = readForm();

    if (!validate(dto)) return;

    const newItem = {
        ...dto,
        id: Date.now()
    };
    requests.push(newItem);

    //  Після додавання в масив — зберігаємо його в localStorage
    saveData();

    renderTable();

    form.reset();
    clearErrors();
});

// Зберігає поточний стан масиву в пам'ять браузера
function saveData() {
    localStorage.setItem('checkoutRequests', JSON.stringify(requests));
}

// Функція видалення запису 
function deleteItem(id) {
    requests = requests.filter(item => item.id !== id);

    //  Після видалення з масиву — оновлюємо localStorage
    saveData();

    renderTable();
}

// 

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
// Функція валідації
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
function renderTable() {
    tbody.innerHTML = requests.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.itemCode}</td>
            <td>${item.userName}</td>
            <td>${item.dateFrom} — ${item.dateTo}</td>
            <td>${item.status}</td>
            <td>${item.comment || ''}</td>
            <td>
                <button type="button" onclick="deleteItem(${item.id})">Видалити</button>
            </td>
        </tr>
    `).join('');
}
// Допоміжні функції для UI (Помилки та класи)
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