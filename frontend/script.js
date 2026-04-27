const API_URL = "http://127.0.0.1:8000";

const loginView = document.getElementById("login-view");
const appView = document.getElementById("app-view");
const loginMensaje = document.getElementById("login-mensaje");
const mensajeGeneral = document.getElementById("mensaje-general");
const bienvenida = document.getElementById("bienvenida");
const perfilUsuario = document.getElementById("perfil-usuario");

function mostrarVista(idVista) {
  document.querySelectorAll(".vista").forEach((vista) => {
    vista.classList.add("hidden");
  });

  document.getElementById(idVista).classList.remove("hidden");
}

function guardarSesion(usuario) {
  localStorage.setItem("usuarioLogueado", JSON.stringify(usuario));
}

function obtenerSesion() {
  return JSON.parse(localStorage.getItem("usuarioLogueado"));
}

function cerrarSesion() {
  localStorage.removeItem("usuarioLogueado");
  window.location.reload();
}

function cargarPerfil() {
  const usuario = obtenerSesion();
  if (!usuario) return;

  bienvenida.textContent = `Bienvenido, ${usuario.nombre} (${usuario.rol})`;
  perfilUsuario.innerHTML = `
    <div class="item"><strong>ID:</strong> ${usuario.id}</div>
    <div class="item"><strong>Nombre:</strong> ${usuario.nombre}</div>
    <div class="item"><strong>Correo:</strong> ${usuario.correo}</div>
    <div class="item"><strong>Rol:</strong> ${usuario.rol}</div>
  `;
}

function iniciarApp() {
  loginView.style.display = "none";
  appView.classList.remove("hidden");
  appView.style.display = "flex";
  mostrarVista("vista-perfil");
  cargarPerfil();
}

document.getElementById("form-registro").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    nombre: document.getElementById("reg-nombre").value.trim(),
    correo: document.getElementById("reg-correo").value.trim(),
    password: document.getElementById("reg-password").value.trim(),
    rol: document.getElementById("reg-rol").value,
  };

  try {
    const response = await fetch(`${API_URL}/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      loginMensaje.textContent = result.mensaje;
      e.target.reset();
    } else {
      loginMensaje.textContent = result.detail;
    }
  } catch (error) {
    console.error(error);
    loginMensaje.textContent = "Error de conexión";
  }
});

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    correo: document.getElementById("login-correo").value.trim(),
    password: document.getElementById("login-password").value.trim(),
  };

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      guardarSesion(result.usuario);
      alert("Login correcto");
      window.location.reload();
    } else {
      loginMensaje.textContent = result.detail;
    }
  } catch (error) {
    console.error(error);
    loginMensaje.textContent = "Error de conexión";
  }
});

document.getElementById("form-vehiculo").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = obtenerSesion();
  if (!usuario) return;

  const data = {
    usuario_id: usuario.id,
    placa: document.getElementById("placa").value.trim(),
    marca: document.getElementById("marca").value.trim(),
    modelo: document.getElementById("modelo").value.trim(),
    color: document.getElementById("color").value.trim(),
    anio: parseInt(document.getElementById("anio").value),
  };

  try {
    const response = await fetch(`${API_URL}/vehiculos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    mensajeGeneral.textContent = result.mensaje || result.detail;
    e.target.reset();
  } catch (error) {
    console.error(error);
    mensajeGeneral.textContent = "Error al registrar vehículo";
  }
});

document.getElementById("btn-cargar-vehiculos").addEventListener("click", async () => {
  try {
    const response = await fetch(`${API_URL}/vehiculos`);
    const data = await response.json();

    const lista = document.getElementById("lista-vehiculos");
    lista.innerHTML = "";

    data.forEach((vehiculo) => {
      lista.innerHTML += `
        <div class="item">
          <strong>Placa:</strong> ${vehiculo.placa}<br>
          <strong>Marca:</strong> ${vehiculo.marca}<br>
          <strong>Modelo:</strong> ${vehiculo.modelo}<br>
          <strong>Año:</strong> ${vehiculo.anio}<br>
          <strong>Color:</strong> ${vehiculo.color}<br>
          <strong>Usuario:</strong> ${vehiculo.usuario}
        </div>
      `;
    });
  } catch (error) {
    console.error(error);
    mensajeGeneral.textContent = "Error al cargar vehículos";
  }
});

document.getElementById("form-taller").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = obtenerSesion();
  if (!usuario) return;

  const data = {
    nombre: document.getElementById("taller-nombre").value.trim(),
    direccion: document.getElementById("taller-direccion").value.trim(),
    telefono: document.getElementById("taller-telefono").value.trim(),
    capacidad: parseInt(document.getElementById("taller-capacidad").value),
    latitud: parseFloat(document.getElementById("taller-latitud").value),
    longitud: parseFloat(document.getElementById("taller-longitud").value),
    radio: parseInt(document.getElementById("taller-radio").value),
    usuario_id: usuario.id,
  };

  try {
    const response = await fetch(`${API_URL}/talleres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    mensajeGeneral.textContent = result.mensaje || result.detail;
    e.target.reset();
  } catch (error) {
    console.error(error);
    mensajeGeneral.textContent = "Error al registrar taller";
  }
});

document.getElementById("btn-cargar-talleres").addEventListener("click", async () => {
  try {
    const response = await fetch(`${API_URL}/talleres`);
    const data = await response.json();

    const lista = document.getElementById("lista-talleres");
    lista.innerHTML = "";

    data.forEach((taller) => {
      lista.innerHTML += `
        <div class="item">
          <strong>ID:</strong> ${taller.id}<br>
          <strong>Nombre:</strong> ${taller.nombre}<br>
          <strong>Dirección:</strong> ${taller.direccion}<br>
          <strong>Teléfono:</strong> ${taller.telefono}<br>
          <strong>Capacidad:</strong> ${taller.capacidad}<br>
          <strong>Radio:</strong> ${taller.radio}<br>
          <strong>Usuario:</strong> ${taller.usuario}
        </div>
      `;
    });
  } catch (error) {
    console.error(error);
    mensajeGeneral.textContent = "Error al cargar talleres";
  }
});

document.getElementById("form-incidente").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    descripcion: document.getElementById("descripcion").value.trim(),
    ubicacion: document.getElementById("ubicacion").value.trim(),
    tipo: document.getElementById("tipo").value.trim(),
    prioridad: document.getElementById("prioridad").value.trim(),
  };

  try {
    const response = await fetch(`${API_URL}/incidentes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    mensajeGeneral.textContent = result.mensaje || result.detail;
    e.target.reset();
  } catch (error) {
    console.error(error);
    mensajeGeneral.textContent = "Error al registrar incidente";
  }
});

document.getElementById("form-estado").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("id-estado").value;
  const data = {
    estado: document.getElementById("nuevo-estado").value.trim(),
  };

  try {
    const response = await fetch(`${API_URL}/incidentes/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    mensajeGeneral.textContent = result.mensaje || result.detail;
    e.target.reset();
  } catch (error) {
    console.error(error);
    mensajeGeneral.textContent = "Error al actualizar estado";
  }
});

document.getElementById("btn-cargar-incidentes").addEventListener("click", async () => {
  try {
    const response = await fetch(`${API_URL}/incidentes`);
    const data = await response.json();

    const lista = document.getElementById("lista-incidentes");
    lista.innerHTML = "";

    data.forEach((incidente) => {
      lista.innerHTML += `
        <div class="item">
          <strong>ID:</strong> ${incidente.id}<br>
          <strong>Fecha:</strong> ${incidente.fecha_hora}<br>
          <strong>Descripción:</strong> ${incidente.descripcion}<br>
          <strong>Categoría:</strong> ${incidente.categoria}<br>
          <strong>Prioridad:</strong> ${incidente.prioridad}<br>
          <strong>Estado:</strong> ${incidente.estado}<br>
          <strong>Placa:</strong> ${incidente.placa_vehiculo}<br>
          <strong>Usuario ID:</strong> ${incidente.usuario_id}
        </div>
      `;
    });
  } catch (error) {
    console.error(error);
    mensajeGeneral.textContent = "Error al cargar incidentes";
  }
});

window.onload = () => {
  const usuario = obtenerSesion();
  if (usuario) {
    iniciarApp();
  }
};