const joyasList = document.getElementById('joyasList');
const addJoyaBtn = document.getElementById('addJoyaBtn');
const addJoyaForm = document.getElementById('addJoyaForm');
const joyaForm = document.getElementById('joyaForm');
const closeBtn = document.getElementById('closeBtn');
const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');


// Mostrar las joyas desde la API
async function loadJoyas() {
  try {
    const response = await fetch('/joyas');
    const joyas = await response.json();

    joyasList.innerHTML = ''; // Limpiar la lista antes de agregar nuevos elementos
    // Crear y agregar cada joya a la lista
    joyas.forEach(joya => {
      const div = document.createElement('div');
      div.className = 'joya';
      div.innerHTML = `
        <h3>${joya.nombre}</h3>
        <p>${joya.descripcion}</p>
        <p>Precio: $${joya.precio}</p>
        <p>Material: ${joya.material}</p>
        <p>Categoría: ${joya.categoria}</p>
        <p>En Stock: ${joya.en_stock ? 'Sí' : 'No'}</p>
        ${joya.imagen ? `<img src="${joya.imagen}" alt="${joya.nombre}" />` : ''} <!-- Mostrar la imagen si existe -->
      `;
      joyasList.appendChild(div);
    });
  } catch (error) {
    console.error("Error al cargar las joyas:", error);
  }
}

// Mostrar formulario para agregar una nueva joya
addJoyaBtn.addEventListener('click', () => {
  addJoyaForm.style.display = 'flex';
});

// Cerrar el formulario al hacer clic en la "X"
closeBtn.addEventListener('click', () => {
  addJoyaForm.style.display = 'none';
});

// Enviar el formulario para agregar una nueva joya
joyaForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Obtener datos del formulario
  const nombre = document.getElementById('nombre').value;
  const descripcion = document.getElementById('descripcion').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const material = document.getElementById('material').value;
  const enStock = document.getElementById('en_stock').checked;
  const categoria = document.getElementById('categoria').value;
  const imagen = document.getElementById('imagen').files[0];

  // Validar los campos
  if (!nombre || !descripcion || isNaN(precio) || precio <= 0 || !material || !categoria) {
   alert("Por favor, completa todos los campos con valores válidos.");
    return;
  }

  // Crear FormData con los datos del formulario
  const formData = new FormData();
  formData.append('nombre', nombre);
  formData.append('descripcion', descripcion);
  formData.append('precio', precio);
  formData.append('material', material);
  formData.append('en_stock', enStock);
  formData.append('categoria', categoria);
  if (imagen) {
    formData.append('imagen', imagen);
  }

  try {
    // Enviar la nueva joya a la API
    const response = await fetch('api/joyas', {
      method: 'POST',
      body: formData,
    });
    // Verificar si la respuesta es correcta
    if (!response.ok) {
      throw new Error('Error al guardar la joya');
    }

    loadJoyas(); // Recargar la lista de joyas
   addJoyaForm.style.display = 'none'; // Ocultar formulario
  } catch (error) {
    console.error("Error al guardar la joya:", error);
  }
});

// Cerrar el formulario cuando se hace clic fuera de él
addJoyaForm.addEventListener('click', (e) => {
  if (e.target === addJoyaForm) {
    addJoyaForm.style.display = 'none';
  }
});

// Manejo del inicio de sesión
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();

  if (result.success) {
    // Ocultar la sección de inicio de sesión
    document.getElementById('loginSection').style.display = 'none';

    // Mostrar la sección del catálogo de joyas
    document.getElementById('catalogSection').style.display = 'block';

    // Cargar las joyas si el login fue exitoso
    loadJoyas();
  } else {
    message.textContent = 'Usuario o contraseña incorrectos.';
    alert('Usuario o contraseña incorrectos.');
  }
});

// Cargar las joyas solo si el usuario ha iniciado sesión
async function checkLogin() {
  const response = await fetch('/joyas');
  if (response.status === 401) {
    message.textContent = 'Por favor, inicia sesión para acceder al contenido.';
    addJoyaBtn.style.display = 'none'; // Ocultar el botón para agregar joyas si no está logueado
  }
}
document.getElementById('logoutBtn').addEventListener('click', function() {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('catalogSection').style.display = 'none';
});
// Iniciar la comprobación de sesión y cargar joyas si está logueado
checkLogin();
