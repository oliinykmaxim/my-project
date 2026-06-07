import { getRequests, createRequest, deleteRequest } from "./apiClient.js";
// Пошук елементів DOM із приведенням типів (виправляє помилки "possibly null")
const form = document.getElementById('createForm');
const tbody = document.getElementById('itemsTableBody');
// Тимчасовий контейнер під відображення станів (loading/error)
let statusContainer = document.getElementById('listStatus');
if (!statusContainer) {
    statusContainer = document.createElement('div');
    statusContainer.id = 'listStatus';
    statusContainer.style.margin = '15px 0';
    statusContainer.style.fontWeight = 'bold';
    const listSection = document.getElementById('list-section');
    if (listSection && tbody) {
        listSection.insertBefore(statusContainer, listSection.querySelector('table'));
    }
}
// Функція рендерингу станів інтерфейсу (loading / empty / error / success) - ЗАХИЩЕНА ВІД XSS
function renderStatus(status, msg) {
    if (!statusContainer)
        return;
    // Очищаємо контейнер перед кожним рендером
    statusContainer.innerHTML = '';
    if (status === 'loading') {
        statusContainer.innerHTML = `<span style="color: #c90;">⏳ Завантаження даних з сервера...</span>`;
    }
    else if (status === 'empty') {
        statusContainer.innerHTML = `<span style="color: #666;">📭 Немає активних заявок в реєстрі.</span>`;
    }
    else if (status === 'error') {
        // SCENARIO B (XSS Mitigation): Замість innerHTML використовуємо безпечне створення елементу та textContent
        const errorSpan = document.createElement('span');
        errorSpan.style.color = '#c00';
        errorSpan.textContent = `❌ Помилка: ${msg || ''}`; // Текст ніколи не перетвориться на HTML-тег
        statusContainer.appendChild(errorSpan);
    }
}
// Захист від подвійного кліку: блокування форми під час виконання запиту
function setFormEnabled(enabled) {
    if (!form)
        return;
    const elements = form.querySelectorAll('input, select, textarea, button');
    elements.forEach(el => {
        el.disabled = !enabled; //
    });
}
// Головна функція завантаження списку через API (Підхід А: Refetch)
async function loadTable() {
    if (!tbody)
        return;
    renderStatus('loading');
    try {
        const responseData = await getRequests();
        // Дістаємо масив з ключа items, який повертає твій бекенд
        const requests = responseData && Array.isArray(responseData.items)
            ? responseData.items
            : [];
        if (requests.length === 0) {
            tbody.innerHTML = '';
            renderStatus('empty');
            return;
        }
        renderTable(requests);
        renderStatus('success');
    }
    catch (error) {
        tbody.innerHTML = '';
        const apiErr = error;
        renderStatus('error', `${apiErr.message} (${apiErr.details || ''})`);
    }
}
// Малювання таблиці з типізованими даними
// Малювання таблиці з типізованими даними
// Малювання таблиці з типізованими даними
function renderTable(items) {
    if (!tbody)
        return;
    tbody.innerHTML = items.map((item, index) => {
        const dateFrom = item.dateFrom ? item.dateFrom.split('T')[0] : '—';
        const dateTo = item.dateTo ? item.dateTo.split('T')[0] : '';
        const period = dateTo ? `${dateFrom} — ${dateTo}` : `${dateFrom}`;
        const commentText = item.comment || '—';
        // Перевіряємо, чи є в пам'яті точний статус, який обирав користувач
        const savedStatus = localStorage.getItem(`status_${item.itemCode}`);
        let displayStatus = 'New';
        if (savedStatus) {
            displayStatus = savedStatus; // Виводимо ТОЧНО те, що ти обрав (Closed, Rejected і т.д.)
        }
        else {
            // Дефолтний переклад для старих сідів бази
            if (item.status === 'active')
                displayStatus = 'Approved';
            else if (item.status === 'maintenance')
                displayStatus = 'Maintenance';
        }
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${item.itemCode || '—'}</strong></td>
                <td>${item.userName || '—'}</td>
                <td><small>${period}</small></td>
                <td>${displayStatus}</td>
                <td>${commentText}</td>
                <td>
                    <button type="button" class="delete-btn" onclick="window.handleDelete(${item.id})">Видалити</button>
                </td>
            </tr>
        `;
    }).join('');
}
// Навішуємо івенти на кнопки видалення динамічно
function setupDeleteListeners() {
    if (!tbody)
        return;
    tbody.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const target = e.target;
            const id = target.getAttribute('data-id');
            if (id && confirm('Ви дійсно хочете видалити цю заявку?')) {
                try {
                    // Викликаємо метод видалення з нашого apiClient
                    await deleteRequest(Number(id));
                    // Після успішного видалення просто перевантажуємо таблицю
                    await loadTable();
                }
                catch (error) {
                    alert('Не вдалося видалити запис');
                }
            }
        });
    });
}
// Читання форми
function readForm() {
    const statusSelect = document.getElementById('statusSelect').value;
    const itemCode = document.getElementById('itemCodeInput').value.trim();
    // Зберігаємо (New, Approved, Rejected, Closed) в браузер
    if (itemCode) {
        localStorage.setItem(`status_${itemCode}`, statusSelect);
    }
    // Перекладаємо для сервера
    let backendStatus = 'active';
    if (statusSelect === 'Maintenance' || statusSelect === 'Closed' || statusSelect === 'Rejected') {
        backendStatus = 'maintenance';
    }
    return {
        itemCode: itemCode,
        userName: document.getElementById('userInput').value.trim(),
        dateFrom: document.getElementById('dateFromInput').value,
        dateTo: document.getElementById('dateToInput').value,
        comment: document.getElementById('commentInput').value.trim(),
        status: backendStatus // Сервер щасливий
    };
}
// Валідація
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
    if (dto.dateFrom === "") {
        showError('dateFromInput', 'dateFromError', 'Вкажіть дату');
        isValid = false;
    }
    return isValid;
}
function showError(inputId, errorId, message) {
    document.getElementById(inputId)?.classList.add('invalid');
    const errEl = document.getElementById(errorId);
    if (errEl)
        errEl.innerHTML = message;
}
function clearErrors() {
    if (!form)
        return;
    const inputs = form.querySelectorAll('input, select, textarea');
    const errors = form.querySelectorAll('.error-text');
    inputs.forEach(input => input.classList.remove('invalid'));
    errors.forEach(error => { error.innerHTML = ''; });
}
// Обробка відправки форми
if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dto = readForm();
        if (!validate(dto))
            return;
        setFormEnabled(false); // Вимикаємо інтерфейс на час запиту
        try {
            await createRequest(dto);
            form.reset();
            clearErrors();
            await loadTable(); // Оновлюємо дані
        }
        catch (error) {
            alert(`Не вдалося створити запис: ${error.message}`);
        }
        finally {
            setFormEnabled(true); // Повертаємо доступність форми
        }
    });
    document.getElementById('resetBtn')?.addEventListener('click', () => {
        form.reset();
        clearErrors();
    });
}
// Глобальна функція для видалення запису (викликається прямо з HTML кнопки)
window.handleDelete = async function (id) {
    if (confirm('Ви дійсно хочете видалити цю заявку?')) {
        try {
            // Викликаємо метод видалення з нашого apiClient
            await deleteRequest(id);
            // Перевантажуємо таблицю з сервера
            await loadTable();
        }
        catch (error) {
            alert('Не вдалося видалити запис із сервера');
        }
    }
};
// Старт програми
loadTable();
