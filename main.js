document.addEventListener('DOMContentLoaded', function () {
    const loginBtn = document.getElementById('login-btn');
    const welcomeContainer = document.getElementById('welcome-container');
    const loginContainer = document.getElementById('login-container');
  
    // Cuando se hace clic en el botón de iniciar sesión, se muestra el formulario de login
    loginBtn.addEventListener('click', function () {
      welcomeContainer.style.display = 'none'; // Ocultar la vista de bienvenida
      loginContainer.style.display = 'flex';   // Mostrar la vista de login
    });
  
    // Manejar el formulario de login (simplemente mostrar alerta por ahora)
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      alert(`Iniciando sesión con:\nCorreo: ${email}\nContraseña: ${password}`);
    });
  });
  