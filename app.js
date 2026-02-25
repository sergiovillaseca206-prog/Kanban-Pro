const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const hbs = require("hbs");


const app = express();
const PORT = 3000;

hbs.registerHelper("eq", function(a, b) {
  return a === b;
});

const rutaData = path.join(__dirname, 'data', 'data.json');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'mi_secreto',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));



// rutas get

app.get('/', (req, res) => {
    res.render('home', { usuario: req.session.usuario });
});

app.get('/register', (req, res) => {
    res.render('register', { usuario: req.session.usuario });
});

app.get('/login', (req, res) => {
    res.render('login', { usuario: req.session.usuario });
});

app.get('/dashboard', (req, res) => {

    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    const data = JSON.parse(fs.readFileSync(rutaData, 'utf-8'));

   res.render('dashboard', {
    usuario: req.session.usuario,
    tarjetas: data.tableros[0].tarjetas
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// rutas post register

app.post('/register', (req, res) => {

    const { nombre, email, password } = req.body;

    const data = JSON.parse(fs.readFileSync(rutaData, 'utf-8'));

    const usuarioExistente = data.usuarios.find(u => u.email === email);

    if (usuarioExistente) {
        return res.send("El correo ya está registrado");
    }

    data.usuarios.push({ nombre, email, password });

    fs.writeFileSync(rutaData, JSON.stringify(data, null, 2));

    res.redirect('/login');
});

// post login

app.post('/login', (req, res) => {

    const { email, password } = req.body;

    const data = JSON.parse(fs.readFileSync(rutaData, 'utf-8'));

    const usuario = data.usuarios.find(
        u => u.email === email && u.password === password
    );

    if (!usuario) {
        return res.send("Credenciales incorrectas");
    }

    req.session.usuario = usuario;

    res.redirect('/dashboard');
});

//post dashboard

app.post('/nueva-tarjeta', (req, res) => {

    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    const data = JSON.parse(fs.readFileSync(rutaData, 'utf-8'));

    const nuevaTarjeta = {
        id: Date.now(),
        titulo: req.body.titulo,
        descripcion: req.body.descripcion,
        estado: req.body.estado,
        fechaInicio: req.body.fechaInicio,
        fechaTermino: req.body.fechaTermino,
        responsable: req.body.responsable,
        mensaje: req.body.mensaje || ""
    };

    data.tableros[0].tarjetas.push(nuevaTarjeta);

    fs.writeFileSync(rutaData, JSON.stringify(data, null, 2));

    res.redirect('/dashboard');
});

//post cambiar estado

app.post("/actualizar-estado", (req, res) => {
  const { id, estado } = req.body;

  const data = JSON.parse(fs.readFileSync(rutaData, "utf-8"));
  const tarjetas = data.tableros[0].tarjetas;

  const tarjeta = tarjetas.find(t => t.id == id);

  if (tarjeta) {
    tarjeta.estado = estado;
    fs.writeFileSync(rutaData, JSON.stringify(data, null, 2));
  }

  res.json({ success: true });
});

// post eliminar tarjeta

app.post("/eliminar-tarjeta/:id", (req, res) => {
  const { id } = req.params;

  const data = JSON.parse(fs.readFileSync(rutaData, "utf-8"));
  const tarjetas = data.tableros[0].tarjetas;

  data.tableros[0].tarjetas = tarjetas.filter(t => t.id != id);

  fs.writeFileSync(rutaData, JSON.stringify(data, null, 2));

  res.redirect("/dashboard");
});

// ==========================

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
