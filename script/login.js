document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');

  if (form) {  // Verifica que el formulario existe
    form.addEventListener('submit', function (event) {
      event.preventDefault(); // Evita el envío del formulario

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      // Verificar que ambos campos no estén vacíos
      if (!username || !password) {
        alert('Por favor, ingresa tus credenciales');
        return;
      }

      const loginData = { username, password };
      console.log('Datos de login:', loginData); // Verifica los datos antes de enviarlos

      // Realiza la petición al backend
      fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),  // Asegúrate de que loginData esté correctamente formado
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
          }
          return response.json();
        })
        .then(data => {
          console.log('Respuesta del servidor:', data); // Verifica la respuesta
          if (data.success) {
            // Guardamos el token y el rol en localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);

            // Redirigir según el rol
            redirectBasedOnRole(data.role);
          } else {
            alert('Credenciales incorrectas');
          }
        })
        .catch(error => {
          console.error('Error en el login:', error);
          alert('Hubo un error al iniciar sesión');
        });
    });
  } else {
    console.error('Formulario no encontrado');
  }
});

// Función para redirigir según el rol
function redirectBasedOnRole(role) {
  if (role === 'usuario') {
    window.location.href = 'dashboard.html';
  } else if (role === 'mantenimiento') {
    window.location.href = 'tasks.html';
  } else if (role === 'gerencia') {
    window.location.href = 'client.html';
  } else if (role === 'admin') {
    window.location.href = 'admin.html'; // Redirige al admin.html si el rol es admin
  } else {
    alert('Rol no reconocido');
  }
}







