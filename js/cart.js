document.addEventListener('DOMContentLoaded', function () {
    const cartItemsContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('total-price');
    const cartCount = document.getElementById('cart-count');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const userData = JSON.parse(localStorage.getItem('userData'));
    let cartData = [];
    let total = 0;

    async function loadCart() {
        try {
            if (!userData || !userData.UserID) {
                cartItemsContainer.innerHTML = '<p class="empty-cart">Ваша корзина пуста.</p>';
                totalElement.textContent = '0 ₽';
                cartCount.textContent = '0';
                return;
            }

            const userDataString = JSON.stringify({
                UserId: userData.UserID,
                Email: userData.Email,
                FullName: userData.FullName
            });

            const encodedUserData = btoa(unescape(encodeURIComponent(userDataString)));

            const response = await fetch('http://localhost:5233/api/Cart/GetCartItems', {
            method: 'GET',
            headers: {
                'userData': encodedUserData
            }
            });

            if (!response.ok) {
                const errorData = await response.json(); // Попытка получить данные об ошибке от сервера
                const errorMessage = errorData?.message || `Ошибка загрузки корзины. Код: ${response.status}`;
                throw new Error(errorMessage);
            }

            cartData = await response.json();
            renderCart();
        } catch (error) {
            console.error('Ошибка при загрузке корзины:', error);
            showToast(`Ошибка при загрузке корзины: ${error.message}`, 5000, 0); // Выводим подробное сообщение об ошибке
        }
    }

    function renderCart() {
        cartItemsContainer.innerHTML = '';
        if (cartData.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Ваша корзина пуста.</p>';
            totalElement.textContent = '0 ₽';
            cartCount.textContent = '0';
            return;
        }

        total = 0;

        for (const item of cartData) {
            const product = item.product;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';

            itemDiv.innerHTML = `
                <div class="item-info">
                    <h3>${product.name || "Неизвестный товар"}</h3>
                    <p>${product.price} ₽ x <span class="quantity">${item.quantity}</span></p>
                </div>
                <div class="item-controls">
                    <button class="minus-btn" data-sku="${product.id}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="plus-btn" data-sku="${product.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="remove-btn" data-sku="${product.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;

            cartItemsContainer.appendChild(itemDiv);
            total += product.price * item.quantity;
        }

        totalElement.textContent = `${total} ₽`;
        cartCount.textContent = cartData.length;
    }

    // Обработка кликов на кнопки +/- и удаления
    cartItemsContainer.addEventListener('click', async function (e) {
        const button = e.target.closest('[data-sku]');
        if (!button) return;

        const productSku = button.dataset.sku;

        try {
            let quantityChange = 0;
            if (e.target.classList.contains('minus-btn')) {
                quantityChange = -1;
            } else if (e.target.classList.contains('plus-btn')) {
                quantityChange = +1;
            } else if (e.target.classList.contains('remove-btn')) {
                quantityChange = -1000; // специальный код для удаления
            }

            if (quantityChange !== 0) {
                const response = await fetch('http://localhost:5233/api/Cart/UpdateCartItem', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        UserId: userData.UserID,
                        ProductSku: parseInt(productSku),
                        Quantity: quantityChange
                    })
                });

                if (!response.ok) {
                    throw new Error('Ошибка при обновлении количества');
                }

                await loadCart();
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showToast('Не удалось обновить корзину.', 5000, 0);
        }
    });

    // Обработка оформления заказа
    checkoutBtn.addEventListener('click', function () {
        if (cartData.length === 0) {
            showToast('Ваша корзина пуста.', 5000, 0);
            return;
        }

        openModal('checkout-modal');
    });

    // Функция открытия модального окна
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Функция закрытия модального окна
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Модальное окно оформления заказа
    const checkoutModal = document.getElementById('checkout-modal');
    const closeModalBtn = document.querySelector('#checkout-modal .close');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeModal('checkout-modal'));
    }

    window.addEventListener('click', function (e) {
        if (e.target === checkoutModal) {
            closeModal('checkout-modal');
        }
    });

    // Отправка заказа
    if (checkoutModal) {
        checkoutModal.addEventListener('submit', async function (e) {
            e.preventDefault();

            const addressSelect = document.getElementById('address-select');
            const selectedAddress = addressSelect.value.trim();

            if (!selectedAddress) {
                showToast('Выберите адрес пункта выдачи.', 5000, 0);
                return;
            }

            try {
                showLoader();

                const response = await fetch('http://localhost:5233/api/Cart/PlaceOrder', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        UserId: userData.UserID,
                        TotalAmount: total,
                        Address: selectedAddress,
                        Items: cartData 
                    })
                });

                if (!response.ok) {
                    throw new Error('Ошибка при оформлении заказа');
                }

                await loadCart();
                showToast('Заказ оформлен успешно!', 5000, 1);
                closeModal('checkout-modal');
            } catch (error) {
                showToast('Ошибка: ' + error.message, 5000, 0);
            } finally {
                hideLoader();
            }
        });
    }

    // Вспомогательные функции
    function showToast(message, duration, info) {
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

        toast.querySelector(".toast-progress").style.animationDuration = `${duration / 1000}s`;

        let existingToast = document.body.querySelector(".toast");
        if (existingToast) {
            existingToast.remove();
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    function showLoader() {
        document.body.classList.add('loading');
    }

    function hideLoader() {
        document.body.classList.remove('loading');
    }

    loadCart();
});
