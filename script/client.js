document.addEventListener("DOMContentLoaded", function () {
  // Asegúrate de que el usuario esté autenticado con un rol adecuado
  const userRole = localStorage.getItem('role');  // Obtener el rol del usuario desde localStorage
  const allowedRoles = ['admin', 'gerencia'];  // Roles permitidos

  // Verificación del rol para permitir el acceso
  if (!userRole || !allowedRoles.includes(userRole)) {
    alert('No tienes permiso para acceder a esta sección.');
    window.location.href = '../src/login.html';  // Redirigir al login si no tiene el rol adecuado
  }

  // Continuar con el resto del código que ya tienes
  const taskTableBodyCompleted = document.getElementById("taskTable").querySelector("tbody");
  const filterButton = document.getElementById("filterButton");
  const totalCostElement = document.getElementById("totalCost");
  const taskCountElement = document.getElementById("taskCount");
  const logoutButton = document.getElementById("logoutButton");
  const printButton = document.getElementById("printButton");

  // Agregar evento para redirigir al hacer clic en el botón de tareas
  const tasksButton = document.getElementById("tasksButton");
  if (tasksButton) {
    tasksButton.addEventListener("click", function () {
      window.location.href = "tasks.html"; // Redirige a tasks.html
    });
  }

  if (!taskTableBodyCompleted) {
    console.error("No se encontró la tabla de tareas completadas en el DOM.");
    return; // Detener ejecución si la tabla no está en el DOM
  }

  // Función para filtrar tareas completadas o pendientes por fecha en UTC
  function filterCompletedTasks() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const showPending = document.getElementById("showPendingTasks").checked; // Obtener si el checkbox está marcado
    const token = localStorage.getItem('token');

    if (!startDate || !endDate) {
      alert("Por favor, ingrese ambas fechas.");
      return;
    }

    // Convertir las fechas a objetos Date, asegurándote de que estén en formato UTC
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalizar las fechas a medianoche (00:00:00) UTC
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999); // Poner la hora final al final del día (23:59:59.999) UTC

    fetch("http://localhost:3000/api/tasks/all", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(tasks => {
        if (!Array.isArray(tasks)) {
          throw new Error('La respuesta no es un array de tareas');
        }

        // Filtrar tareas completadas dentro del rango de fechas en UTC
        const filteredCompletedTasks = tasks.filter((task) => {
          const taskDate = new Date(task.createdAt);
          taskDate.setUTCHours(0, 0, 0, 0); // Asegurarse de que la fecha de la tarea esté en UTC

          return taskDate >= start && taskDate <= end && task.status === "completada";
        });

        // Filtrar tareas pendientes (si el checkbox está marcado)
        const filteredPendingTasks = tasks.filter((task) => {
          const taskDate = new Date(task.createdAt);
          taskDate.setUTCHours(0, 0, 0, 0); // Asegurarse de que la fecha de la tarea esté en UTC

          return taskDate >= start && taskDate <= end && task.status === "Pendiente";
        });

        // Si el checkbox de pendientes está marcado, mostramos tanto las completadas como las pendientes
        const tasksToRender = showPending ? [...filteredPendingTasks] : filteredCompletedTasks;

        // Calcular el total de costo
        const totalCost = tasksToRender.reduce((total, task) => total + task.cost, 0);

        // Formatear el total con el símbolo de pesos y el separador de miles
        const formattedTotalCost = `$${totalCost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Calcular la cantidad de tareas
        const taskCount = tasksToRender.length;

        // Actualizar los valores en el DOM
        totalCostElement.textContent = `Total de Costo: ${formattedTotalCost}`;
        taskCountElement.textContent = `Cantidad de tareas: ${taskCount}`;

        // Renderizar las tareas en la tabla
        renderTasks(tasksToRender);
      })
      .catch(error => {
        console.error("Error al obtener las tareas:", error);
        alert("Hubo un problema al obtener las tareas.");
      });
  }

  // Función para renderizar las tareas en la tabla
  function renderTasks(tasks) {
    const tableBody = document.getElementById("taskTable").querySelector("tbody");

    if (!tableBody) {
      console.error("No se encontró el contenedor <tbody> en la tabla.");
      return; // Si no se encuentra el tbody, detenemos la ejecución
    }

    tableBody.innerHTML = ""; // Limpiar la tabla antes de agregar nuevas tareas

    tasks.forEach((task) => {
      const row = document.createElement("tr");

      // Convertir la fecha de creación (UTC) a Buenos Aires y formato 24 horas
      const taskDate = new Date(task.createdAt);
      const taskDateBuenosAires = taskDate.toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour12: false, // Forzar formato 24 horas
        weekday: 'short', // Opcional: nombre del día (Lun, Mar, etc.)
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Calcular la duración en horas y minutos (mantener las fechas en UTC para este cálculo)
      const completedAt = new Date(task.completedAt); // Suponiendo que 'completedAt' está en UTC
      const durationInMillis = completedAt - taskDate; // Diferencia entre las fechas en milisegundos

      // Convertir milisegundos a horas y minutos
      const durationHours = Math.floor(durationInMillis / (1000 * 60 * 60)); // Horas
      const durationMinutes = Math.floor((durationInMillis % (1000 * 60 * 60)) / (1000 * 60)); // Minutos

      const durationString = `${durationHours}h ${durationMinutes}m`;

      // Agregar la fila a la tabla
      row.innerHTML = `
        <td>${task.description}</td>
        <td>${task.priority}</td>
        <td>${task.area}</td>
        <td>${taskDateBuenosAires}</td> <!-- Fecha de creación convertida a Buenos Aires con formato 24 horas -->
        <td>${task.status}</td>
        <td>${durationString}</td> <!-- Duración calculada -->
        <td>$${task.cost}</td>
        <td>${task.user ? task.user.username : 'Desconocido'}</td>
      `;

      tableBody.appendChild(row); // Agregar la fila de tarea a la tabla
    });
  }

  // Agregar evento al filtro de tareas
  filterButton.addEventListener("click", filterCompletedTasks); // Asegúrate de usar el nombre correcto de la función

  // Función para imprimir el total de las tareas
  function printTasks() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const printContent = document.getElementById('taskTable').outerHTML;
    const totalCost = totalCostElement.textContent;
    const taskCount = taskCountElement.textContent;

    // Asegúrate de que ambas fechas estén seleccionadas
    if (!startDate || !endDate) {
      alert("Por favor, ingrese ambas fechas.");
      return;
    }

    // Formatear el costo total para mostrar el símbolo de pesos sin duplicarlo
    const totalCostValue = parseFloat(totalCost.replace('Total de Costo: $', '').trim().replace('.', '').replace(',', '.'));
    const formattedTotalCostFormatted = totalCostValue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

    // Formatear la cantidad de tareas
    const formattedTaskCount = taskCount.replace('Cantidad de tareas: ', '').trim();
    const formattedTaskCountNumber = parseInt(formattedTaskCount);
    const formattedTaskCountFormatted = formattedTaskCountNumber.toLocaleString();

    // Crear la ventana de impresión
    const printWindow = window.open('', '', 'height=500, width=800');

    // Cambiar el título de la página a incluir las fechas seleccionadas
    printWindow.document.write('<html><head><title>Reporte de Mantenimiento (' + startDate + ' - ' + endDate + ')</title><style>');

    // CSS para imprimir en formato A4 y ajustar la tabla
    printWindow.document.write('body { font-family: Arial, sans-serif; margin: 10px; font-size: 10pt; }');
    printWindow.document.write('h2 { text-align: center; font-size: 16pt; margin-bottom: 10px; }');
    printWindow.document.write('table { border-collapse: collapse; width: 100%; table-layout: fixed; }');
    printWindow.document.write('td, th { border: 1px solid black; padding: 6px; text-align: left; font-size: 10pt; word-wrap: break-word; }');
    printWindow.document.write('table, th, td { border: 1px solid black; }');

    // Evitar desbordamientos y asegurar que todo se ajuste a una página
    printWindow.document.write('@page { size: A4; margin: 20mm; }');

    printWindow.document.write('</style></head><body>');

    // Título con las fechas y los totales
    printWindow.document.write('<h2>Reporte de Tareas Completadas (' + startDate + ' - ' + endDate + ')</h2>');
    printWindow.document.write('<p><strong>Total de Costo:</strong> ' + formattedTotalCostFormatted + '</p>');
    printWindow.document.write('<p><strong>Cantidad de tareas:</strong> ' + formattedTaskCountFormatted + '</p>');

    // Agregar la tabla de tareas
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  }

  printButton.addEventListener("click", printTasks);


  // Función de cierre de sesión
  logoutButton.addEventListener("click", function () {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "login.html";
  });

});

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
        document.getElementById("registerForm").reset();
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
  registerUser(); // Llamar la función para registrar el usuario
});






































