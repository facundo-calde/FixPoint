const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Task = require('./models/task'); // Importa el modelo de tareas
const app = express();
const port = 3000;
const path = require('path');
require('dotenv').config();  // Asegúrate de que dotenv esté configurado

// Servir los archivos estáticos
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/script', express.static(path.join(__dirname, 'script')));
app.use('/assets/img', express.static(path.join(__dirname, 'assets', 'img')));

// Rutas para servir las páginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html')); // Página principal
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'login.html'));  // Ruta para login.html
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'dashboard.html'));
});

app.get('/tasks.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'tasks.html'));
});

app.get('/client.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'client.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'admin.html'));
});

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/Mi_base_de_datos')
  .then(() => {
    console.log('Conectado a MongoDB');
  })
  .catch((err) => {
    console.error('Error de conexión a MongoDB:', err);
  });

// Habilitar CORS para permitir solicitudes de otras fuentes
app.use(cors());

// Middleware para parsear el body de las solicitudes en formato JSON
app.use(express.json());  // Asegúrate de que esto esté antes de las rutas
const router = express.Router();

app.use('/api', router);

// Definición del esquema de usuario
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['usuario', 'mantenimiento', 'gerencia', 'admin'], required: true },
});

const User = mongoose.model('User', userSchema);  // Este es el modelo de usuario

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Obtener el token del header Authorization

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    // Cambié 'mi_secreto' por process.env.JWT_SECRET
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedToken.id;  // Guardamos el ID del usuario en la solicitud
    next();  // Continuar con la siguiente función de la ruta
  } catch (error) {
    res.status(401).json({ message: 'Token no válido o expirado' });
  }
};

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
  console.log("Petición recibida en /login", req.body);  // Verifica qué datos llegan al servidor

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Faltan campos de credenciales' });
    }

    // Verificar que el usuario existe
    const user = await User.findOne({ username });
    console.log("Usuario encontrado:", user);  // Verifica que el usuario se encuentra

    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Verificar la contraseña
    const match = await bcrypt.compare(password, user.password);
    console.log("Contraseña coincide:", match);  // Verifica si la contraseña es correcta

    if (!match) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Crear un token (si es necesario)
    const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log("Token generado: ", token);  // Verifica que el token se genera correctamente

    // Responder con éxito
    res.json({
      success: true,
      token: token,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para agregar una nueva tarea
app.post('/api/tasks', verifyToken, async (req, res) => {
  const { description, area, priority, createdAt, status, cost } = req.body;

  // Verificación de campos obligatorios
  if (!description || !area || !priority || !createdAt || !status || cost === undefined) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  try {
    const newTask = new Task({
      description,
      area,
      priority,
      createdAt,
      status,
      cost,
      user: req.userId  // Aquí estamos usando el userId proveniente del token
    });

    await newTask.save(); // Guardamos la nueva tarea
    res.status(201).json(newTask);  // Enviamos la tarea recién creada
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar la tarea', error });
  }
});

// Ruta para registrar un usuario
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Hasheamos la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ success: true, message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ success: false, message: 'Hubo un error al registrar el usuario' });
  }
});

// Ruta para obtener tareas no eliminadas (isDeleted: false)
app.get('/api/tasks', verifyToken, async (req, res) => {
  try {
    // Filtra las tareas para obtener solo aquellas que no estén marcadas como eliminadas
    const tasks = await Task.find({ isDeleted: { $ne: true } })  // $ne significa "not equal"
      .populate('user', 'username');  // Esto debería llenar el campo 'user' con el username del usuario

    res.json(tasks);  // Devolver las tareas filtradas
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las tareas no eliminadas', error });
  }
});

// Ruta para obtener todas las tareas (sin importar si están eliminadas)
app.get('/api/tasks/all', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({}).populate('user', 'username');  // Esto debería llenar el campo 'user' con el username del usuario
    res.json(tasks);  // Devolver todas las tareas
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener todas las tareas', error });
  }
});

// Ruta para actualizar el estado de una tarea (completar tarea)
app.put('/api/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  const { status, cost, completedAt } = req.body; // Obtener el campo completedAt y cost del cuerpo

  try {
    // Actualizar la tarea
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        status: status,
        cost: cost,  // Aquí no se modifica el valor de cost para el simbolo "$"
        completedAt: completedAt,  // Asegúrate de incluir completedAt aquí
      },
      { new: true } // Devuelve la tarea actualizada
    );

    // Responder con la tarea actualizada
    res.json(updatedTask);
  } catch (error) {
    console.error('Error al actualizar la tarea:', error);
    res.status(500).json({ message: 'Error al actualizar la tarea' });
  }
});

// Ruta para marcar una tarea como eliminada
app.put('/api/tasks/:id/deleted', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { isDeleted } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de tarea no válido' });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    task.isDeleted = isDeleted;  // Actualiza el valor de 'isDeleted'
    await task.save();  // Guarda la tarea actualizada

    res.json(task);  // Devuelve la tarea actualizada
  } catch (error) {
    console.error('Error al actualizar la tarea:', error);
    res.status(500).json({ message: 'Error al marcar la tarea como eliminada', error });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});






