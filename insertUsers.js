const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config(); // Cargar variables de entorno

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI no está definido en el archivo .env');
  process.exit(1); // Salir si no hay URI
}

(async () => {
  try {
    // Conexión a la base de datos AirTecs3
    const connection = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'AirTecs3', // Especificamos el nombre exacto de la base de datos
    });
    console.log('Conexión exitosa a MongoDB (Base de datos: AirTecs3)');

    // Esquema y modelo de la colección `usuarios`
    const userSchema = new mongoose.Schema({
      nombre_usuario: String,
      email: String,
      password: String,
    });

    const User = connection.model('usuarios', userSchema); // Aseguramos que la colección sea `usuarios`

    // Función para insertar usuarios
    async function insertUsers() {
      const users = [];
      for (let i = 0; i < 10000; i++) {
        const nombre_usuario =
          faker.internet.username() + Math.floor(Math.random() * 900 + 100); // Generar un nombre único
        const email = faker.internet.email();
        const password = faker.internet.password(8); // Contraseña con longitud mínima de 8 caracteres

        users.push({ nombre_usuario, email, password });
      }

      await User.insertMany(users);
      console.log('10,000 usuarios insertados en la base de datos AirTecs3, colección usuarios.');
    }

    await insertUsers();
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
