document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'http://localhost:5233/api/Auth_Regis';
    const authCard = document.querySelector('.auth-card');

    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordLink = document.getElementById('forgot-password');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const closeModalBtn = forgotPasswordModal?.querySelector('.close');
    const resetEmailInput = document.getElementById('reset-email');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    

    if (loginTab && registerTab) {
        loginTab.addEventListener('click', () => switchTab('login'));
        registerTab.addEventListener('click', () => switchTab('register'));
    }

    // Отк "Восстановление пароля"
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(forgotPasswordModal);
        });
    }

    // Закрытие модального окна
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeModal(forgotPasswordModal));
    }

    window.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) closeModal(forgotPasswordModal);
    });

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailReset = document.getElementById('reset-email').value.trim();

        if (!emailReset || !isValidEmail(emailReset)) {
            showNotification('Пожалуйста, введите корректный email.', 'error');
            return;
        }

        try {
            showLoader();

            const response = await fetch(`${API_BASE_URL}/ResetPassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    Email: emailReset
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Ошибка от сервера:", errorText);

                if (response.status === 404) {
                    showNotification('Этот email не найден.', 'error');
                } else {
                    showNotification(`Ошибка: ${errorText}`, 'error');
                }

                return;
            }

            const result = await response.json();
            showNotification(result.message, 'success');
            closeModal(forgotPasswordForm);

        } catch (error) {
            console.error("Ошибка:", error);
            showNotification(`Произошла ошибка: ${error.message}`, 'error');
        } finally {
            hideLoader();
        }
    });
}
    

    // Вход
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showError('Пожалуйста, заполните все поля');
                return;
            }

            try {
                showLoader();

                const response = await fetch(`${API_BASE_URL}/Auth`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        Email: email,
                        PasswordHash: password
                    })
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Неверный email или пароль');
                    }
                    throw new Error('Ошибка сервера');
                }

                const userData = await response.json();

                localStorage.setItem('userData', JSON.stringify({
                    UserID: userData.id || userData.Id,
                    Email: userData.email || userData.Email, 
                    PhoneNumber: userData.PhoneNumber || userData.phone,
                    FullName: userData.fullName || userData.FullName
                }));

                if (userData.roleId <= 1)
                    window.location.href = 'restorants.html';
                else
                    window.location.href = 'admin.html';
            } catch (error) {
                showError(error.message);
            } finally {
                hideLoader();
            }
        });
    }

    // Регистрация
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const fullName = document.getElementById('register-name').value;
            const phone = document.getElementById('register-phone').value;

            if (!email || !password || !confirmPassword || !fullName || !phone) {
                showError('Пожалуйста, заполните все поля');
                return;
            }

            if (password !== confirmPassword) {
                showError('Пароли не совпадают');
                return;
            }

            if (!document.getElementById('agree-terms').checked) {
                showError('Необходимо согласиться с условиями использования');
                return;
            }

            if (!isValidEmail(email)) {
                showError('Некорректный адрес электронной почты');
                return;
            }

            try {
                showLoader();

                const userData = {
                    Email: email,
                    PasswordHash: password,
                    FullName: fullName,
                    PhoneNumber: phone
                };

                const response = await fetch(`${API_BASE_URL}/Regis`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || `HTTP error! status: ${response.status}`);
                }

                let result = {};
                const responseText = await response.text();
                if (responseText) {
                    try {
                        result = JSON.parse(responseText);
                    } catch (e) {
                        console.warn('Ответ не в JSON формате:', responseText);
                    }
                }

                showSuccess(result.message || 'Регистрация успешна! Теперь вы можете войти.');
                registerForm.reset();
                setTimeout(() => switchTab('login'), 1500);

            } catch (error) {
                showError(error.message || 'Произошла ошибка при регистрации');
            } finally {
                hideLoader();
            }
        });
    }

    

    function showLoader() {
        document.body.classList.add('loading');
    }

    function hideLoader() {
        document.body.classList.remove('loading');
    }

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function openModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        resetEmailInput.value = '';
    }

    function showError(message) {
        clearAlerts();
        const errorElement = document.createElement('div');
        errorElement.className = 'alert error';
        errorElement.textContent = message;
        if (authCard) {
            authCard.prepend(errorElement);
        } else {
            alert(message);
        }
    }

    function showSuccess(message) {
        clearAlerts();
        const successElement = document.createElement('div');
        successElement.className = 'alert success';
        successElement.textContent = message;
        if (authCard) {
            authCard.prepend(successElement);
        } else {
            alert(message);
        }
    }

    function showNotification(message, type = 'info') {
        clearAlerts();
        const alertBox = document.createElement('div');
        alertBox.className = `alert ${type}`;
        alertBox.textContent = message;
        if (authCard) {
            authCard.prepend(alertBox);
        } else {
            alert(message);
        }
    }

    function clearAlerts() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }

    function switchTab(tabName) {
        if (tabName === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }

        clearAlerts();
    }
});