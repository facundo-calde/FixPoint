document.addEventListener('DOMContentLoaded', function () {
  // Verificar el rol del usuario antes de permitirle acceder a la página
  const userRole = localStorage.getItem('role');  // Obtener el rol del usuario desde localStorage
  const allowedRoles = ['usuario', 'mantenimiento', 'gerencia', 'admin'];  // Roles permitidos

  if (!userRole || !allowedRoles.includes(userRole)) {
    alert('No tienes permiso para acceder a esta sección.');
    window.location.href = '/src/login.html';  // Redirigir al login si el rol no es válido
    return;  // Detener la ejecución del código si no tiene el rol adecuado
  }

  const form = document.getElementById('taskForm');
  const logoutBtn = document.getElementById('logoutBtn');  // Obtener el botón de cerrar sesión

  // Event listener para el formulario de agregar tarea
  form.addEventListener('submit', function (event) {
    event.preventDefault();  // Evitar que el formulario se envíe de forma predeterminada

    // Obtener los valores del formulario
    const descripcion = document.getElementById('descripcion').value;
    const area = document.getElementById('area').value;
    const prioridad = document.getElementById('prioridad').value;

    // Verificar si los campos requeridos están vacíos
    if (!descripcion || !area || !prioridad) {
      alert('Todos los campos son requeridos');
      return; // Si falta algún campo, evitar el envío
    }

    // Obtener la fecha y hora actual en formato de 24 horas (HH:MM:SS)
    const fecha = new Date();
    const createdAt = fecha.toISOString();  // Esto devuelve la fecha y hora en formato ISO 8601

    // Estado por defecto: Pendiente
    const status = 'Pendiente';

    // Costo por defecto: 0
    const cost = 0;

    // Obtener el token desde el almacenamiento local (si lo tienes almacenado allí)
    const token = localStorage.getItem('token');

    // Decodificar el token para obtener el usuario
    if (token) {
      const decodedToken = jwt_decode(token);  // Usamos jwt_decode para decodificar el token
      const username = decodedToken.username;  // Ahora username estará disponible

      // Definir taskData con los valores del formulario y los valores automáticos
      const taskData = {
        description: descripcion,
        area: area,
        priority: prioridad,
        createdAt: createdAt,
        status: status,
        cost: cost,
      };

      console.log('taskData a enviar:', taskData);  // Asegúrate de que los datos no están vacíos

      // Realizar el POST para agregar la nueva tarea
      fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // Incluimos el token en el encabezado
        },
        body: JSON.stringify(taskData)
      })
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              console.error('Respuesta de error del servidor:', text); // Log de error
              throw new Error(`Error al agregar la tarea: ${text}`);
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Tarea agregada:', data);
          // Aquí, en lugar de recargar las tareas, solo añadimos la tarea nueva
          addTaskToTable(data);  // Agregar la nueva tarea a la tabla sin recargar

          // Limpiar los campos del formulario después de agregar la tarea
          form.reset();
        })
        .catch(error => {
          console.error('Error al agregar la tarea:', error);
          alert(error.message);
        });
    } else {
      alert('No se encontró el token de usuario. Por favor inicie sesión.');
    }
  });


  // Cargar las tareas al inicio
  loadTasks();  // Esto asegura que las tareas se carguen cuando la página se carga

  // Event listener para el botón de cerrar sesión
  logoutBtn.addEventListener('click', function () {
    logoutUser();  // Llamar a la función logoutUser cuando el botón sea presionado
  });
});

// Función para cargar las tareas desde el servidor y mostrarlas
function loadTasks() {
  const token = localStorage.getItem('token'); // Obtener el token desde el almacenamiento local
  if (!token) {
    console.error('No se encontró el token');
    return;
  }

  fetch('http://localhost:3000/api/tasks/all', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // Asegúrate de enviar el token en el encabezado Authorization
    }
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          console.error('Error al obtener tareas:', text);  // Log de error
          throw new Error('Error al cargar las tareas');
        });
      }
      return response.json();
    })
    .then(tasks => {
      const tasksTableBody = document.querySelector('#tasksTable tbody');
      tasksTableBody.innerHTML = '';  // Limpiar la tabla antes de agregar las nuevas filas

      // Aquí nos aseguramos de que solo las tareas activas se agreguen a la tabla
      tasks.forEach(task => {
        if (task.status !== 'completada' && !task.isDeleted) {  // Filtrar tareas completadas y eliminadas
          addTaskToTable(task);  // Llamamos a la función para agregar la tarea a la tabla
        }
      });
    })
    .catch(error => {
      console.error('Error al cargar las tareas:', error);
      alert('Hubo un error al cargar las tareas.');
    });
}

// Función para agregar una tarea a la tabla sin recargarla
function addTaskToTable(task) {
  const tasksTableBody = document.querySelector('#tasksTable tbody');

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${task.description}</td>
    <td>${task.priority}</td>
    <td>${task.area}</td>
    <td>${new Date(task.createdAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</td>
    <td>${task.status}</td>
    <td>${task.cost}</td>
    <td>${task.user ? task.user.username : 'No asignado'}</td>  <!-- Verifica si el campo 'user' existe -->
  `;

  tasksTableBody.appendChild(row);  // Agregar la fila a la tabla
}


// Función para cerrar sesión
function logoutUser() {
  // Eliminar los datos del usuario en localStorage
  localStorage.removeItem('username');
  localStorage.removeItem('token');  // Si tienes un token JWT en localStorage

  // Redirigir al usuario a la página de inicio de sesión
  window.location.href = '/src/login.html';  // Asegúrate de tener la página de login en tu proyecto
}















