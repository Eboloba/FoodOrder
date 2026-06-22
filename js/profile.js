document.addEventListener('DOMContentLoaded', function() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    const ordersList = document.getElementById('orders-list');    
    function loadUserProfile() {

        document.getElementById('user-fullname').textContent = userData.FullName || 'Не указано';
        document.getElementById('user-phone').textContent = userData.PhoneNumber || 'Не указано';
        document.getElementById('user-email').textContent = userData.Email || 'Не указано';
        const usernameDisplay = document.getElementById('username-display');
        if (userData.FullName) {
                usernameDisplay.textContent = userData.FullName;
            } 
        }
    

// Открытие модального окна
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
  }
}

// закрытие модального окна
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Закрытие по клику 
window.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    closeModal('change-password-modal');
  }
});

// Сменить парольь
if (document.querySelector('.change-password-btn')) {
    document.querySelector('.change-password-btn').addEventListener('click', function () {
        openModal('change-password-modal');
    });
}

// Редактировать профил
document.querySelector('.edit-profile-btn').addEventListener('click', function () {
    openModal('edit-profile-modal');
});

if (document.querySelector('#edit-profile-modal .close')) {
    document.querySelector('#edit-profile-modal .close').addEventListener('click', function () {
        closeModal('edit-profile-modal');
    });
}

document.getElementById('edit-profile-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const fullnameInput = document.getElementById('edit-fullname');
    const phoneInput = document.getElementById('edit-phone');

    const fullnameError = document.getElementById('fullname-error');
    const phoneError = document.getElementById('phone-error');

    fullnameError.style.display = 'none';
    phoneError.style.display = 'none';

    let valid = true;

    const fullname = fullnameInput.value.trim();
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']+/u;
    if (!nameRegex.test(fullname)) {
        fullnameError.textContent = 'Введите корректное имя (только буквы, пробелы, дефисы)';
        fullnameError.style.display = 'block';
        valid = false;
    }

    const phone = phoneInput.value.trim();
    const phoneRegex = /^\d+$/;
    if (phone && !phoneRegex.test(phone)) {
        phoneError.textContent = 'Телефон должен содержать только цифры';
        phoneError.style.display = 'block';
        valid = false;
    }

    if (phone.length > 0 && (phone.length < 10 || phone.length > 15)) {
        phoneError.textContent = 'Номер телефона должен быть от 10 до 15 цифр';
        phoneError.style.display = 'block';
        valid = false;
    }

    if (!valid) return;

    const userData = JSON.parse(localStorage.getItem('userData')) || {};

    try {
        const response = await fetch('http://localhost:5233/api/Profile/UpdateProfile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Email: userData.Email,
                FullName: fullname,
                PhoneNumber: '+' + phone
            })
        });

        if (!response.ok) {
            throw new Error('Ошибка при обновлении профиля');
        }

        userData.FullName = fullname;
        userData.PhoneNumber = '+' + phone;
        localStorage.setItem('userData', JSON.stringify(userData));

        loadUserProfile();
        loadOrders();

        showToast('Профиль успешно обновлён!', 5000, 1);
        closeModal('edit-profile-modal');
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Не удалось обновить профиль. Попробуйте позже.', 5000, 0);
    }
});

document.getElementById('edit-fullname').addEventListener('input', function () {
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']+/u;
    const value = this.value;
    const error = document.getElementById('fullname-error');
    if (!nameRegex.test(value)) {
        error.textContent = 'Допустимы только буквы, пробелы, дефисы и апострофы';
        error.style.display = 'block';
    } else {
        error.style.display = 'none';
    }
});

document.getElementById('edit-phone').addEventListener('input', function () {
    const value = this.value;
    const error = document.getElementById('phone-error');
    const phoneRegex = /^\d*$/;

    if (!phoneRegex.test(value)) {
        error.textContent = 'Телефон должен содержать только цифры';
        error.style.display = 'block';
    } else {
        error.style.display = 'none';
    }
});

// смена пароля
document.getElementById('change-password-form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const userData = JSON.parse(localStorage.getItem('userData')) || {};

  const oldPassword = document.getElementById('old-password').value.trim();
  const newPassword = document.getElementById('new-password').value.trim();
  const confirmPassword = document.getElementById('confirm-password').value.trim();

  // Валидация
  if (!oldPassword || !newPassword || !confirmPassword) {
    showToast('Пожалуйста, заполните все поля.', 5000, 0);
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('Новые пароли не совпадают.', 5000, 0);
    return;
  }

  if (newPassword.length < 6) {
    showToast('Пароль должен быть не менее 6 символов.', 5000, 0);
    return;
  }

  try {

    const response = await fetch('http://localhost:5233/api/Auth_Regis/ChangePasswordProfile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        EmailCurrent: userData.Email,
        OldPassword: oldPassword,
        NewPassword: newPassword
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Ошибка при смене пароля');
    }

    showToast('Пароль успешно изменён!', 5000, 1);
    closeModal('change-password-modal');
  } catch (error) {
    showToast('Ошибка: ' + error.message, 5000, 0);
  } finally {

  }
});


if (document.querySelector('#change-password-modal .close')) {
    document.querySelector('#change-password-modal .close').addEventListener('click', function () {
        closeModal('change-password-modal');
    });
}

function showToast(
  message = "Успешное действие",
  duration = 5000,
  info = 1
) {
  const iconSuccess =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
  const iconDanger = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
    `;
  let toast = document.createElement("div");
  if (info == 1) {
    toast.classList.add("toast", "toast-success");
    toast.innerHTML = `
        <div class="toast-content-wrapper">
            <div class="toast-icon">${iconSuccess}</div>
            <div class="toast-message">${message}</div>
            <div class="toast-progress"></div>
        </div>
    `;
  } else {
    toast.classList.add("toast", "toast-danger");
    toast.innerHTML = `
        <div class="toast-content-wrapper">
            <div class="toast-icon">${iconDanger}</div>
            <div class="toast-message">${message}</div>
            <div class="toast-progress"></div>
        </div>
    `;
  }

  toast.querySelector(".toast-progress").style.animationDuration = `${
    duration / 1000
  }s`;

  let existingToast = document.body.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

    async function loadOrders() {
        try {
            const userDataString = JSON.stringify({
                UserId: userData.UserID,
                Email: userData.Email,
                FullName: userData.FullName
            });

            const encodedUserData = btoa(unescape(encodeURIComponent(userDataString)));

            const response = await fetch('http://localhost:5233/api/Orders/GetUserOrders', {
                method: 'GET',
                headers: {
                    'userData': encodedUserData
                }
            });

            if (!response.ok) {
                throw new Error(`Ошибка загрузки заказов. Код: ${response.status}`);
            }

            const ordersData = await response.json();

            renderOrders(ordersData);
        } catch (error) {
            console.error('Ошибка при загрузке заказов:', error);
            showToast(`Ошибка при загрузке заказов: ${error.message}`, 5000, 0);
        }
    }

    function renderOrders(orders) {
    ordersList.innerHTML = '';
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-shopping-bag"></i>
                <p>У вас пока нет заказов</p>
                <a href="search.html" class="order-now-btn">Заказать сейчас</a>
            </div>
        `;
        return;
    }

    for (const order of orders) {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-item';

        orderDiv.innerHTML = `
            <div class="order-header">
                <h3>Заказ #${order.orderId}</h3>
                <p>${new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div class="order-details">
                <p><strong>Статус:</strong> ${order.status}</p>
                <p><strong>Адрес:</strong> ${order.address}</p>
                <p><strong>Сумма:</strong> ${order.totalAmount} ₽</p>
            </div>
            <div class="order-items">
                ${order.orderItems ? order.orderItems.map(item => `
                    <div class="order-product">
                        <div class="product-image-small" style="background-image: url('images/food/${item.image}')"></div>
                        <div class="product-info">
                            <p>${item.quantity} x ${item.name}</p>
                            <p>${item.price * item.quantity} ₽</p>
                        </div>
                    </div>
                `).join('') : '<p>Нет товаров в этом заказе.</p>'}
            </div>
        `;

        ordersList.appendChild(orderDiv);
    }
}


    loadUserProfile();
    loadOrders();
});