let tasks = [];

document.addEventListener('DOMContentLoaded', function () {
  // Verificación de rol al cargar la página
  const userRole = localStorage.getItem('role');  // Suponiendo que el rol se guarda en el localStorage
  const allowedRoles = ['admin', 'gerencia', 'mantenimiento'];  // Todos los roles tienen acceso a la página

  // Si el usuario no tiene el rol adecuado, redirige a login
  if (!allowedRoles.includes(userRole)) {
    alert('No tienes permiso para acceder a esta sección.');
    window.location.href = '/src/login.html';  // Redirige al login si no tiene el rol adecuado
  }

  // Bloquear el uso del botón "Atrás"
  history.pushState(null, '', location.href);  // Añadir una nueva entrada al historial
  window.onpopstate = function () {
    history.go(1);  // Impide ir atrás en el historial
  };

  // Verifica si el rol del usuario es adecuado para mostrar el botón
  const buttonToRemove = document.getElementById('specialButton');  // Suponiendo que el botón tiene el ID 'specialButton'

  if (buttonToRemove && userRole === 'mantenimiento') {
    buttonToRemove.style.display = 'none';  // Oculta el botón si el rol es 'mantenimiento'
  } else if (buttonToRemove) {
    // Agregar el evento de clic al botón especial
    buttonToRemove.addEventListener('click', function () {
      window.location.href = '/src/client.html';  // Redirige a client.html al hacer clic
    });
  }

  loadTasks();  // Cargar las tareas al inicio

  // Asignar el evento de clic al botón de cerrar sesión
  const logoutButton = document.getElementById('logoutButton');
  logoutButton.addEventListener('click', function () {
    logoutUser();
  });

  // Asignar el evento para agregar una nueva tarea
  document.getElementById('taskForm').addEventListener('submit', function (event) {
    event.preventDefault();
    addTask();
  });
});

// Función para cerrar sesión
function logoutUser() {
  // Eliminar los datos del usuario en localStorage
  localStorage.removeItem('username');
  localStorage.removeItem('token');  // Si tienes un token JWT en localStorage

  // Redirigir al usuario a la página de inicio de sesión
  window.location.href = '/src/login.html';
}

document.addEventListener('DOMContentLoaded', function () {
  // Verificar si el token existe al cargar la página
  if (!localStorage.getItem('token')) {
    // Si no existe el token, redirige al usuario a la página de login
    window.location.href = '/src/login.html';
  }

  // Si el token está presente, continúa con el código de carga normal
  loadTasks();  // o cualquier otra función de carga de contenido
});


// Función para cargar las tareas desde el backend
function loadTasks() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No se encontró el token');
    return;
  }

  fetch('http://localhost:3000/api/tasks/all', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          console.error('Error al obtener tareas:', text);
          throw new Error('Error al cargar las tareas');
        });
      }
      return response.json();
    })
    .then(tasksData => {
      tasks = tasksData;
      const tasksToRender = tasks.filter(task => task.isDeleted !== true);

      // Aquí, agregamos el signo '$' a cada tarea en el campo "cost"
      tasksToRender.forEach(task => {
        task.cost = `$${task.cost.toFixed(2)}`; // Formateamos el costo con el signo pesos
      });

      renderTasks(tasksToRender);  // Solo mostrar las tareas no eliminadas
    })
    .catch(error => {
      console.error('Error al cargar las tareas:', error);
      alert('Error al cargar las tareas.');
    });
}

// Función para agregar una nueva tarea
function addTask() {
  const descripcion = document.getElementById('descripcion').value;
  const area = document.getElementById('area').value;
  const prioridad = document.getElementById('prioridad').value;

  if (!descripcion || !area || !prioridad) {
    alert('Todos los campos son requeridos');
    return;
  }

  const createdAt = new Date().toISOString();
  const status = 'Pendiente';
  const cost = 0;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('No se encontró el token de usuario. Por favor inicie sesión.');
    return;
  }

  const decodedToken = jwt_decode(token);
  const user = decodedToken.username;

  const taskData = {
    description: descripcion,
    area: area,
    priority: prioridad,
    createdAt: createdAt,
    status: status,
    cost: cost,
    user: user
  };

  fetch('http://localhost:3000/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(taskData)
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          console.error('Error al agregar la tarea:', text);
          throw new Error('Error al agregar la tarea');
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Tarea agregada:', data);
      loadTasks();  // Recargar todas las tareas después de agregar una nueva

      // Limpiar el formulario después de agregar la tarea
      document.getElementById('taskForm').reset();  // Resetear todos los campos del formulario
    })
    .catch(error => {
      console.error('Error al agregar la tarea:', error);
      alert(error.message);
    });
}

// Función para agregar una tarea a la tabla
function renderTasks(tasks) {
  const tableBody = document.getElementById('tasksTable').getElementsByTagName('tbody')[0];

  if (!tableBody) {
    console.error('No se encontró el contenedor de la tabla.');
    return;
  }

  tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar las nuevas filas

  tasks.forEach(task => {
    const row = document.createElement('tr');
    const priorityClass = task.priority && typeof task.priority === 'string' ? task.priority.toLowerCase() : 'default';

    row.setAttribute('data-id', task._id);

    // Convertir la fecha creada a la hora local antes de mostrarla
    const localCreatedAt = new Date(task.createdAt).toLocaleString();

    row.innerHTML = `
      <td>${task.description || 'No description'}</td>
      <td class="prioridad ${priorityClass}">${task.priority || 'No priority'}</td>
      <td>${task.area || 'No area'}</td>
      <td>${localCreatedAt || 'No date'}</td>  <!-- Mostramos la fecha convertida a la hora local -->
      <td>${task.status || 'No status'}</td>
      <td class="cost">${task.cost || 'No cost'}</td>
      <td>${task.user ? task.user.username : 'No user'}</td> <!-- Accede al username del usuario -->
      <td>
        <button class="btn-save complete-btn" data-id="${task._id}">Marcar Completada</button>
        <button class="btn-delete delete-btn" data-id="${task._id}">Eliminar</button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Asignar eventos de clic a los botones de completar y eliminar
  addTaskEventListeners();
}

// Función para completar una tarea
function completeTask(taskId) {
  const newCost = prompt('Ingrese el costo de la tarea completada:');
  const parsedCost = parseFloat(newCost);

  if (newCost && !isNaN(parsedCost) && parsedCost >= 0) {
    const completedAt = new Date().toISOString();  // Fecha y hora de cuando se completa la tarea

    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'completada',
        cost: parsedCost,  // Guardamos el número tal como es
        completedAt: completedAt  // Agregar la fecha y hora de finalización
      })
    })
      .then(response => response.json())
      .then((data) => {
        console.log('Tarea completada con costo y fecha:', data);

        // Formatear el costo para mostrarlo con el signo de pesos en el frontend
        const formattedCost = '$' + data.cost.toFixed(2); // Formateamos el número con el signo de pesos y dos decimales

        console.log('Costo en pesos argentinos:', formattedCost);

        // Ahora, puedes mostrar el costo en el UI, por ejemplo, puedes actualizar el contenido de un campo
        const costElement = document.getElementById(`cost-${taskId}`);
        if (costElement) {
          costElement.innerHTML = formattedCost;  // Actualizamos el elemento con el formato adecuado
        }

        loadTasks();  // Recargamos las tareas después de completar una
      })
      .catch((error) => {
        console.error('Error al completar la tarea:', error);
        alert('Hubo un error al completar la tarea');
      });
  } else {
    alert('Por favor ingrese un costo válido.');
  }
}

// Función para asignar los eventos de clic a los botones de tarea
function addTaskEventListeners() {
  // Botones para marcar tareas como completadas
  const completeButtons = document.querySelectorAll('.complete-btn');
  completeButtons.forEach(button => {
    button.addEventListener('click', function () {
      const taskId = button.getAttribute('data-id');
      completeTask(taskId);
    });
  });

  // Botones para eliminar tareas
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function () {
      const taskId = button.getAttribute('data-id');
      deleteTask(taskId);
    });
  });
}

// Función para eliminar una tarea
function deleteTask(taskId) {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('No se encontró el token de usuario. Por favor inicie sesión.');
    return;
  }

  const confirmDelete = confirm('¿Estás seguro de que quieres eliminar esta tarea?');

  if (confirmDelete) {
    fetch(`http://localhost:3000/api/tasks/${taskId}/deleted`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isDeleted: true })  // Marcamos la tarea como eliminada
    })
      .then(response => response.json())
      .then((data) => {
        console.log('Tarea eliminada:', data);
        loadTasks();  // Recargamos las tareas después de eliminar una
      })
      .catch((error) => {
        console.error('Error al eliminar la tarea:', error);
        alert('Hubo un error al eliminar la tarea');
      });
  }
}




















