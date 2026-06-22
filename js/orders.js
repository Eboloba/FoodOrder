document.addEventListener('DOMContentLoaded', function () {
    const ordersList = document.getElementById('orders-list');
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (!userData || !userData.UserID) {
        showToast("Вы не авторизованы.", 5000, 0);
        return;
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

            let data;
        try {
            data = await response.json();
        } catch (e) {
            console.warn("Ответ не в формате JSON");
            return;
        }

        if (!Array.isArray(data)) {
            console.error("Данные не являются массивом:", data);
            return;
        }

        renderOrders(data);
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

    loadOrders();
});