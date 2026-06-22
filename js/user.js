// user.js
document.addEventListener('DOMContentLoaded', function() {
    // Функция для отображения данных пользователя
    function displayUserData() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const usernameDisplay = document.getElementById('username-display');

        if (userData && usernameDisplay) {
            // Безопасное отображение имени или email
            if (userData.FullName) {
                usernameDisplay.textContent = userData.FullName;
            } 
        }
    }
    
    // Вызываем при загрузке страницы
    displayUserData();
    
    // Обработка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('userData');
            window.location.href = 'main.html';
        });
    }

const categoryCards = document.querySelectorAll('.category-card');

    if (categoryCards){
        categoryCards.forEach(card => {
            card.addEventListener('click', function(e) {
                e.preventDefault();
            
                // Получаем категорию из data-атрибута
                const category = this.getAttribute('data-category');
            
                // Сохраняем выбранную категорию в localStorage
                localStorage.setItem('categoryQuery', category);
                localStorage.removeItem('searchQuery'); // Очищаем поисковый запрос
            
                // Перенаправляем на страницу поиска
                window.location.href = 'search.html';
            });
        });
    }

    // Поиск переход
    const searchButton = document.querySelector('.search-button');
    const searchInput = document.querySelector('.search-input');
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function() {
            const searchQuery = searchInput.value.trim();
            localStorage.removeItem('categoryQuery');
            // Сохраняем поисковый запрос в localStorage
            localStorage.setItem('searchQuery', searchQuery);
            // Переходим на страницу поиска
            window.location.href = 'search.html';
        });
        
        // Добавляем обработчик нажатия Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchButton.click();
            }
        });
    }
});