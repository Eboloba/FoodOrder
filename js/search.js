document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:5233/api/ProductsView';
    const searchQuery = localStorage.getItem('searchQuery') || '';
    const categoryQuery = localStorage.getItem('categoryQuery') || '';
    const resultsGrid = document.getElementById('results-grid');
    const noResults = document.getElementById('no-results');
    const searchQueryDisplay = document.getElementById('search-query-display');
    const sortSelect = document.getElementById('sort-select');
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    
    // Отображаем поисковый запрос
    searchQueryDisplay.textContent = categoryQuery || searchQuery || 'Все товары';

    // Загрузка продуктов
    async function loadProducts() {
        try {
            const params = new URLSearchParams();
            if (searchQuery) 
                params.append('search', searchQuery);
            if (categoryQuery) 
                params.append('category', categoryQuery);
            params.append('sortBy', sortSelect.value);
            
            const response = await fetch(`${API_BASE_URL}/GetProduct?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const products = await response.json();

            return Array.isArray(products) ? products : [];
        } catch (error) {
            console.error('Ошибка при загрузке продуктов:', error);
            showError('Не удалось загрузить продукты');
            return [];
        }
    }

    function displayResults(products) {
        if (!resultsGrid) return;
    
    resultsGrid.innerHTML = '';
    
    if (!Array.isArray(products) || products.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'restaurant-card';
        
        const safeProduct = {
            id: product.id ?? 0,
            name: product.name ?? 'Без названия',
            restaurant: product.restaurant ?? 'Ресторан не указан',
            price: product.price ?? null,
            imageUrl: product.image ? 
                `images/food/${product.image}` : 
                'images/default-food.jpg',
            description: product.description ?? '',
            rating: product.rating ?? 0,
            deliveryTime: product.deliveryTime ?? 0
        };

        const priceFormatted = safeProduct.price ? 
            `${safeProduct.price.toFixed(2)} ₽` : 'Цена не указана';
        
        const ratingFormatted = safeProduct.rating > 0 ? 
            `<span class="rating"><i class="fas fa-star"></i> ${safeProduct.rating.toFixed(1)}</span>` : '';
        
        const deliveryTimeFormatted = safeProduct.deliveryTime > 0 ? 
            `<span class="delivery-time"><i class="fas fa-clock"></i> ${safeProduct.deliveryTime} мин</span>` : '';

        productElement.innerHTML = `
            <div class="restaurant-image" style="background-image: url('${safeProduct.imageUrl}')"></div>
            <div class="restaurant-info">
                <h3>${safeProduct.name}</h3>
                <p class="restaurant-name">${safeProduct.restaurant}</p>
                <div class="restaurant-meta">
                    <span class="price">${priceFormatted}</span>
                    ${ratingFormatted}
                    ${deliveryTimeFormatted}
                </div>
                <h4>Состав:</h4>
                <div class="product-description">${safeProduct.description}</div>
                <div class="restaurant-footer">
                    <button class="add-to-cart-btn" data-id="${safeProduct.id}">
                        <i class="fas fa-plus"></i> В корзину
                    </button>
                </div>
            </div>
        `;
        
        resultsGrid.appendChild(productElement);
    });

    // Обработчики для кнопок
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            if (productId) addToCart(productId);
        });
    });
}

    function addToCart(productId) {
        console.log(`Добавлен продукт с ID: ${productId}`);
        alert('Товар добавлен в корзину');
    }

    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'alert error';
        errorElement.textContent = message;
        document.querySelector('.search-results-section')?.prepend(errorElement);
    }

    // Основная функция поиска
    async function performSearch() {
        try {
            if (categoryQuery) {
                // Обновляем отображение запроса для категорий
                const categoryNames = {
                    'pizza': 'Пицца',
                    'sushi': 'Суши',
                    'burger': 'Бургеры',
                    'salad': 'Салаты',
                    'dessert': 'Десерты',
                    'drink': 'Напитки'
                };
    
                if (categoryNames[categoryQuery]) {
                    searchQueryDisplay.textContent = categoryNames[categoryQuery];
                }
            }
            const products = await loadProducts();
            displayResults(products);

            // Подсветка активной категории
            document.querySelectorAll('.category-card').forEach(card => {
                card.classList.remove('active');
                if (card.getAttribute('data-category') === categoryQuery) {
                    card.classList.add('active');
                }
            });
        } catch (error) {
            console.error('Ошибка при выполнении поиска:', error);
            showError('Произошла ошибка при выполнении поиска');
        }
    }

    // Инициализация
    sortSelect?.addEventListener('change', performSearch);
    performSearch();

    async function getMockProductData(productId) {
    try {
        const response = await fetch(`http://localhost:5233/api/ProductsView/GetProduct/${productId}`);

        if (!response.ok) {
            throw new Error('Не удалось получить данные о товаре');
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        showToast('Ошибка при получении информации о товаре.', 5000, 0);
        return null;
    }

}

async function addToCart(productId) {
    const modal = document.getElementById('add-to-cart-modal');
    if (modal) {
        modal.style.display = 'block';
    }
    let selectedProductId = productId;

    document.getElementById('quantity-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const quantity = parseInt(document.getElementById('quantity').value);
        if (isNaN(quantity) || quantity < 1) {
            alert('Пожалуйста, введите корректное количество.');
            return;
        }

        const productData = await getMockProductData(selectedProductId);
        if (!productData) {
            alert('Не удалось получить информацию о товаре.');
            closeModal('add-to-cart-modal');
            return;
        }

        const UserID = userData.UserID;
        if (!UserID) {
            showToast('Вы должны быть авторизованы для добавления товаров в корзину.', 5000, 0);
            closeModal('add-to-cart-modal');
            return;
        }

        try{
            const response = await fetch('http://localhost:5233/api/Cart/AddItem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'userData': btoa(JSON.stringify({ UserID }))
            },
            body: JSON.stringify({
                ProductSku: productData.sku || productData.id,
                Quantity: quantity
            })
        });

        await response.json();

        if (!response.ok) {
            throw new Error('Не удалось получить данные о товаре');
        }

        showToast('Товар добавлен в корзину!', 5000, 1);
        closeModal('add-to-cart-modal');

       document.getElementById('quantity').value = 1;
       const cartCountElement = document.getElementById('cart-count');

    async function updateCartCount() {
        const userData = JSON.parse(localStorage.getItem('userData'));

        if (!userData || !userData.UserID) {
            cartCountElement.textContent = '0';
            return;
        }

        const userDataString = JSON.stringify({
            UserId: userData.UserID,
            Email: userData.Email,
            FullName: userData.FullName
        });

        try {
            const encodedUserData = btoa(unescape(encodeURIComponent(userDataString)));

            const response = await fetch('http://localhost:5233/api/Cart/GetCartItemCount', {
                method: 'GET',
                headers: {
                    'userData': encodedUserData
                }
            });

            if (!response.ok) {
                throw new Error(`Ошибка загрузки количества товаров. Код: ${response.status}`);
            }

            const result = await response.json();
            const count = result.count;

            cartCountElement.textContent = String(count);
        } catch (error) {
            console.error('Ошибка при загрузке количества товаров:', error);
            cartCountElement.textContent = '0';
        }
    }

    updateCartCount();

        } catch (error) {
            console.error(error);
            showToast('Ошибка при добавлении информации о товаре.', 5000, 0);
            return null;
        }
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

// Вспомогательные функции
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal('add-to-cart-modal');
    }
});

document.querySelector('#add-to-cart-modal .close')?.addEventListener('click', function() {
    closeModal('add-to-cart-modal');
});

window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal('add-to-cart-modal');
    }
});

document.querySelector('#add-to-cart-modal .close')?.addEventListener('click', function() {
    closeModal('add-to-cart-modal');
});

    localStorage.removeItem('categoryQuery');
    localStorage.removeItem('searchQuery');
});