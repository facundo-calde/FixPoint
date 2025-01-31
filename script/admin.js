document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const registerButton = document.getElementById("registerButton");
  const logoutButton = document.getElementById("logoutButton");

  // Verificar si el usuario tiene el rol 'admin'
  function checkAdminRole() {
    const userRole = localStorage.getItem("role");  // Obtén el rol del usuario desde localStorage

    if (userRole !== "admin") {
      // Si el usuario no es admin, redirigir al login
      window.location.replace("login.html"); // Ajusta la ruta según tu estructura
    }
  }

  // Llamar la función para verificar el rol al cargar la página
  checkAdminRole();

  // Función para registrar un usuario
  function registerUser() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    // Validar campos vacíos
    if (!username || !password || !role) {
      alert("Por favor, ingresa todos los campos");
      return;
    }

    const userData = {
      username: username,
      password: password, // No encriptar la contraseña en el frontend
      role: role
    };

    // Enviar los datos al servidor para registrar el usuario
    fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("Usuario registrado exitosamente");
          // Limpiar el formulario después de registrar
          registerForm.reset();
        } else {
          alert("Error al registrar el usuario: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error al registrar el usuario:", error);
        alert("Hubo un error al registrar el usuario");
      });
  }

  // Vincular el botón de registro con la función
  registerButton.addEventListener("click", function (event) {
    event.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    console.log("Registro de usuario"); // Asegúrate de que este mensaje se imprime
    registerUser(); // Llamar la función para registrar el usuario
  });

  // Función de cerrar sesión
  logoutButton.addEventListener("click", function () {
    console.log("Cerrando sesión...");

    // Eliminar el token y cualquier dato relacionado
    localStorage.removeItem("token");
    localStorage.removeItem("role");  // Si estás guardando el rol en localStorage también, elimínalo.

    // Forzar redirección al login después de borrar los datos del localStorage
    window.location.replace("login.html");  // Ajusta la ruta según tu estructura
  });
});




