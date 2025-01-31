const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  description: { type: String, required: true },
  area: { type: String, required: true },
  priority: { type: String, required: true },
  createdAt: { type: Date, required: true },
  status: { type: String, required: true },
  cost: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Esto establece la relación con el usuario
  completedAt: Date, 
  isDeleted: { type: Boolean, default: false } // Para manejar tareas eliminadas
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
