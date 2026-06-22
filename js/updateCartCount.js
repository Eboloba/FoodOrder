
document.addEventListener('DOMContentLoaded', function () {
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
    window.addEventListener("storage", updateCartCount);
});