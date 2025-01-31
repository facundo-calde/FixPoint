const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // Utilizado para encriptar las contraseñas

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['usuario', 'mantenimiento', 'gerencia', 'admin'], required: true },
});

// Método para verificar la contraseña del usuario
userSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// Encriptar la contraseña antes de guardar el usuario
userSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    this.password = bcrypt.hashSync(this.password, 10);  // Encriptamos la contraseña
  }
  next();
});
const User = mongoose.model('User', userSchema);
// Exportar el modelo de usuario
module.exports = User;

