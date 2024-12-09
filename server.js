require('dotenv').config(); // Cargar las variables de entorno desde .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const path = require('path');
const multer = require('multer');
const session = require('express-session'); // Para gestionar la sesión
const MongoStore = require('connect-mongo'); // Usar MongoDB para almacenar las sesiones

const app = express();
const port = process.env.PORT || 3000; // Usar el puerto desde .env o 3000 por defecto

// Configuración de multer para almacenar las imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nombre único para la imagen
  },
});

const upload = multer({ storage: storage });

// Configuración de middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Configuración de la sesión usando MongoStore
app.use(session({
  secret: 'hay', 
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // URI de MongoDB desde el archivo .env
  }),
}));

// Conexión a MongoDB (sin opciones obsoletas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.log('Error al conectar con MongoDB:', err));

// Esquema de usuario
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model('User', userSchema, 'usuarios');

// Esquema de la joya en MongoDB
const joyaSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  precio: Number,
  material: String,
  en_stock: Boolean,
  categoria: String,
  imagen: String, // Guardamos la URL de la imagen
});
const Joya = mongoose.model('Joya', joyaSchema);

// Ruta para manejar el inicio de sesión
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      // Iniciar sesión
      req.session.user = user;
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Ruta para verificar si el usuario está autenticado y mostrar las joyas
app.get('/joyas', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'No estás autenticado' });
  }

  try {
    const joyas = await Joya.find();
    res.json(joyas);
  } catch (err) {
    console.log('Error al obtener las joyas:', err);
    res.status(500).send('Error al obtener las joyas');
  }
});

// Ruta principal (solo si está autenticado)
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Por favor, inicia sesión primero');
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para agregar una nueva joya con imagen
app.post('/joyas', upload.single('imagen'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Por favor, inicia sesión primero');
  }

  const { nombre, descripcion, precio, material, en_stock, categoria } = req.body;
  const imagenUrl = req.file ? `public/uploads/${req.file.filename}` : null;

  const nuevaJoya = new Joya({
    nombre,
    descripcion,
    precio,
    material,
    en_stock,
    categoria,
    imagen: imagenUrl,
  });

  try {
    const result = await nuevaJoya.save();
    console.log('Joya agregada:', result);
    res.status(201).send('Joya agregada con éxito');
  } catch (err) {
    console.log('Error al agregar la joya:', err);
    res.status(500).send('Error al agregar la joya');
  }
});

// Servidor escuchando
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Para insertar usuarios en la base de datos (solo para pruebas)
(async () => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('123', saltRounds);
  const newUser = new User({ username: 'usuario2', password: hashedPassword });
  await newUser.save();
  console.log('Usuario creado con éxito.');
})();

