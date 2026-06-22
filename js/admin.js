document.addEventListener('DOMContentLoaded', function () {
    const addDishForm = document.getElementById('add-dish-form');
    const dishesList = document.getElementById('dishes-list');

    // Отображение данных пользователя
    function displayUserData() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const usernameDisplay = document.getElementById('username-display');
        if (userData && usernameDisplay) {
            if (userData.FullName) {
                usernameDisplay.textContent = userData.FullName;
            }
        }
    }

    displayUserData();

    // Обработка выхода из системы
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('userData');
            window.location.href = 'main.html';
        });
    }

    // Загрузка блюд
    async function loadDishes() {
        try {
            const response = await fetch('http://localhost:5233/api/ProductsView/GetProduct');
            if (!response.ok) {
                throw new Error(`Ошибка при загрузке блюд: ${response.status}`);
            }

            const dishes = await response.json();
            dishesList.innerHTML = '';

            if (!Array.isArray(dishes) || dishes.length === 0) {
                dishesList.innerHTML = '<p>Нет доступных блюд.</p>';
                return;
            }

            dishes.forEach(dish => {
                const dishCard = document.createElement('div');
                dishCard.className = 'dish-card';

                dishCard.innerHTML = `
                    <img src="images/food/${dish.image}" alt="${dish.name}">
                    <h3>${dish.name}</h3>
                    <p><strong>Цена:</strong> ${dish.price} ₽</p>
                    <p><strong>Описание:</strong> ${dish.description}</p>
                    <p><strong>Ресторан:</strong> ${dish.restaurant}</p>
                    <p><strong>Категория:</strong> ${dish.category}</p>
                    <p><strong>Время доставки:</strong> ${dish.deliveryTime} мин</p>
                    <button class="edit-btn" data-id="${dish.id}">Редактировать</button>
                    <button class="delete-btn" data-id="${dish.id}">Удалить</button>
                `;

                // Обработчик удаления
                dishCard.querySelector('.delete-btn').addEventListener('click', async function () {
                    const productId = this.dataset.id;

                    if (confirm('Вы уверены, что хотите удалить это блюдо?')) {
                        try {
                            const response = await fetch(`http://localhost:5233/api/ProductsView/DeleteDish/${productId}`, {
                                method: 'DELETE'
                            });

                            if (!response.ok) {
                                throw new Error(`Ошибка удаления: ${response.status}`);
                            }

                            showToast('Блюдо успешно удалено!', 5000, 1);
                            loadDishes(); // Перезагружаем список
                        } catch (error) {
                            console.error('Ошибка:', error);
                            showToast('Не удалось удалить блюдо.', 5000, 0);
                        }
                    }
                });

                // Обработчик редактирования
                dishCard.querySelector('.edit-btn').addEventListener('click', function () {
                    const productId = this.dataset.id;
                    openEditModal(productId);
                });

                dishesList.appendChild(dishCard);
            });
        } catch (error) {
            console.error('Ошибка при загрузке блюд:', error);
            alert('Не удалось загрузить список блюд.');
        }
    }

    // Открытие модального окна редактирования
    async function openEditModal(productId) {
        try {
            const modal = document.getElementById('edit-dish-modal');
            if (!modal) {
                console.error("Модальное окно не найдено");
                return;
            }

            modal.style.display = 'block'; // ← ВАЖНО: показываем модальное окно

            const response = await fetch(`http://localhost:5233/api/ProductsView/GetProduct/${productId}`);
            if (!response.ok) {
                throw new Error("Не удалось получить данные о блюде");
            }

            const dish = await response.json();

            // Заполняем форму
            document.getElementById('edit-dish-id').value = dish.id;
            document.getElementById('edit-dish-name').value = dish.name;
            document.getElementById('edit-dish-price').value = dish.price;
            document.getElementById('edit-dish-description').value = dish.description;
            document.getElementById('edit-dish-image').value = dish.image;
            document.getElementById('edit-dish-delivery-time').value = dish.deliveryTime;

            // Загружаем категории и рестораны
            await loadCategoriesInEditForm();
            await loadRestaurantsInEditForm();

            // Выбираем текущие значения
            const categorySelect = document.getElementById('edit-dish-category');
            const restaurantSelect = document.getElementById('edit-dish-restaurant');

            const categoryOption = Array.from(categorySelect.options).find(
                option => option.text === dish.category
            );
            if (categoryOption) categoryOption.selected = true;

            const restaurantOption = Array.from(restaurantSelect.options).find(
                option => option.text === dish.restaurant
            );
            if (restaurantOption) restaurantOption.selected = true;
        } catch (error) {
            console.error(error);
            showToast("Не удалось загрузить данные для редактирования", 5000, 0);
        }
    }

    // Обработка формы добавления нового блюда
    addDishForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('dish-name').value.trim();
        const price = parseFloat(document.getElementById('dish-price').value);
        const description = document.getElementById('dish-description').value.trim();
        const image = document.getElementById('dish-image').value.trim();
        const categoryId = parseInt(document.getElementById('dish-category').value);
        const restaurantInn = document.getElementById('dish-restaurant').value;
        const deliveryTime = parseInt(document.getElementById('delivery-time').value);

        if (!name || isNaN(price) || !description || !image || isNaN(categoryId) || !restaurantInn || isNaN(deliveryTime)) {
            showToast('Пожалуйста, заполните все поля корректно.', 5000, 0);
            return;
        }

        try {
            const response = await fetch('http://localhost:5233/api/ProductsView/AddDish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Name: name,
                    Price: price,
                    Description: description,
                    Image: image,
                    Category: categoryId,
                    RestorantInn: restaurantInn,
                    DeliveryTime: deliveryTime
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка при добавлении блюда: ${response.status}`);
            }

            showToast('Блюдо успешно добавлено!', 5000, 1);
            addDishForm.reset();
            loadDishes(); // Перезагружаем список
        } catch (error) {
            console.error('Ошибка:', error);
            showToast('Не удалось добавить блюдо.', 5000, 0);
        }
    });

    // Обработка формы редактирования
    document.getElementById('edit-dish-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const productId = parseInt(document.getElementById('edit-dish-id').value);
        const name = document.getElementById('edit-dish-name').value.trim();
        const price = parseFloat(document.getElementById('edit-dish-price').value);
        const description = document.getElementById('edit-dish-description').value.trim();
        const image = document.getElementById('edit-dish-image').value.trim();
        const categoryId = parseInt(document.getElementById('edit-dish-category').value);
        const restaurantInn = document.getElementById('edit-dish-restaurant').value;
        const deliveryTime = parseInt(document.getElementById('edit-dish-delivery-time').value);

        if (!name || isNaN(price) || !description || !image || isNaN(categoryId) || !restaurantInn || isNaN(deliveryTime)) {
            showToast('Пожалуйста, заполните все поля корректно.', 5000, 0);
            return;
        }

        try {
            const response = await fetch(`http://localhost:5233/api/ProductsView/EditDish/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Name: name,
                    Price: price,
                    Description: description,
                    Image: image,
                    Category: categoryId,
                    RestorantInn: restaurantInn,
                    DeliveryTime: deliveryTime
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка при редактировании: ${response.status}`);
            }

            showToast('Блюдо успешно обновлено!', 5000, 1);
            closeModal('edit-dish-modal');
            loadDishes(); // Перезагружаем список
        } catch (error) {
            console.error('Ошибка:', error);
            showToast('Не удалось обновить блюдо.', 5000, 0);
        }
    });

    // Загрузка категорий
    async function loadCategoriesInEditForm() {
        try {
            const response = await fetch('http://localhost:5233/api/ProductsView/GetAllCategories');
            if (!response.ok) throw new Error('Не удалось получить категории');
            const categories = await response.json();

            const categorySelect = document.getElementById('edit-dish-category');
            categorySelect.innerHTML = ''; // Очищаем предыдущие опции

            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.categoryId;
                option.textContent = cat.categoryName;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Ошибка при загрузке категорий:', error);
            showToast('Не удалось загрузить категории.', 5000, 0);
        }
    }

    // Загрузка ресторанов
    async function loadRestaurantsInEditForm() {
        try {
            const response = await fetch('http://localhost:5233/api/ProductsView/GetAllRestaurants');
            if (!response.ok) throw new Error('Не удалось получить рестораны');
            const restaurants = await response.json();

            const restaurantSelect = document.getElementById('edit-dish-restaurant');
            restaurantSelect.innerHTML = ''; // Очищаем предыдущие опции

            restaurants.forEach(restaurant => {
                const option = document.createElement('option');
                option.value = restaurant.inn;
                option.textContent = restaurant.name;
                restaurantSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Ошибка при загрузке ресторанов:', error);
            showToast('Не удалось загрузить рестораны.', 5000, 0);
        }
    }

    async function loadCategories() {
    try {
        const response = await fetch('http://localhost:5233/api/ProductsView/GetAllCategories');
        if (!response.ok) throw new Error('Не удалось получить категории');
        const categories = await response.json();

        const categorySelect = document.getElementById('dish-category');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.categoryId;
            option.textContent = cat.categoryName;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        alert('Ошибка при загрузке категорий.');
    }
}

async function loadRestaurants() {
    try {
        const response = await fetch('http://localhost:5233/api/ProductsView/GetAllRestaurants');
        if (!response.ok) throw new Error('Не удалось получить рестораны');
        const restaurants = await response.json();

        const restaurantSelect = document.getElementById('dish-restaurant');
        restaurants.forEach(restaurant => {
            const option = document.createElement('option');
            option.value = restaurant.inn;
            option.textContent = restaurant.name;
            restaurantSelect.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        alert('Ошибка при загрузке ресторанов.');
    }
}

    
async function loadOrders() {
    try {
        const response = await fetch('http://localhost:5233/api/ProductsView/GetAllOrders');
        if (!response.ok) throw new Error(`Ошибка при загрузке заказов: ${response.status}`);
        const orders = await response.json();

        const ordersList = document.getElementById('orders-list');
        ordersList.innerHTML = '';

        if (!Array.isArray(orders) || orders.length === 0) {
            ordersList.innerHTML = '<p>Нет доступных заказов.</p>';
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';

            orderCard.innerHTML = `
                <h3>Заказ #${order.orderId}</h3>
                <p><strong>Пользователь:</strong> ${order.fullName} (${order.email})</p>
                <p><strong>Дата:</strong> ${order.orderDate}</p>
                <p><strong>Адрес:</strong> ${order.address}</p>
                <p><strong>Сумма:</strong> ${order.totalAmount} ₽</p>
                <p><strong>Статус:</strong> 
                    <select class="status-select" data-id="${order.orderId}">
                        <option value="Оформлен" ${order.status === "Оформлен" ? "selected" : ""}>Новый</option>
                        <option value="В работе" ${order.status === "В работе" ? "selected" : ""}>В работе</option>
                        <option value="Выполнен" ${order.status === "Выполнен" ? "selected" : ""}>Выполнен</option>
                        <option value="Отменён" ${order.status === "Отменён" ? "selected" : ""}>Отменён</option>
                    </select>
                </p>
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

            // Обработчик изменения статуса
            const statusSelect = orderCard.querySelector('.status-select');
            statusSelect.addEventListener('change', async () => {
                const orderId = statusSelect.dataset.id;
                const newStatus = statusSelect.value;

                const response = await fetch(`http://localhost:5233/api/ProductsView/UpdateOrderStatus/${orderId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ NewStatus: newStatus })
                });

                if (!response.ok) {
                    showToast("Не удалось обновить статус заказа", 5000, 1);
                    return;
                }

                showToast("Статус заказа успешно обновлён!", 5000, 1);
                loadOrders(); // Перезагружаем список заказов
            });

            ordersList.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Ошибка при загрузке заказов:', error);
        showToast('Не удалось загрузить список заказов.', 5000, 0);
    }
}




    // Закрытие модальных окон
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function () {
            closeModal('edit-dish-modal');
        });
    });

    window.addEventListener('click', function (e) {
        const modal = document.getElementById('edit-dish-modal');
        if (e.target.classList.contains('modal') && modal.style.display === 'block') {
            closeModal('edit-dish-modal');
        }
    });

    // Закрывает модальное окно
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
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


    // Инициализация
    loadDishes();
    loadOrders();
    loadRestaurants();
    loadCategories();
});