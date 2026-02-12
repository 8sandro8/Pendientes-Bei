document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('adminToken', data.token);
            window.location.href = '/admin.html';
        } else {
            errorMsg.textContent = 'Contraseña incorrecta';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.textContent = 'Error al conectar con el servidor';
    }
});
