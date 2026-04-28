import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {
  usuario = JSON.parse(localStorage.getItem('usuarioLogueado') || '{}');
  vistaActual = 'perfil';
  mensaje = '';

  vehiculos: any[] = [];
  talleres: any[] = [];
  tecnicos: any[] = [];
  incidentes: any[] = [];
  incidentesTecnico: any[] = [];
  // ===== CHAT IA =====
  chatAbierto = false;
mensajeIA = '';
mensajeIAUsuario = '';
respuestaIA = '';
iaCategoria = '';
iaPrioridad = '';

  placa = '';
  marca = '';
  modelo = '';
  color = '';
  anio: number | null = null;

  tallerNombre = '';
  tallerDireccion = '';
  tallerTelefono = '';
  tallerCapacidad: number | null = null;
  tallerLatitud: number | null = null;
  tallerLongitud: number | null = null;
  tallerRadio: number | null = null;

  tecnicoNombre = '';
  tecnicoTelefono = '';
  tecnicoEspecialidad = '';
  tecnicoDisponibilidad = true;
  tecnicoLatitud: number | null = -17.7833;
  tecnicoLongitud: number | null = -63.1821;
  tecnicoTallerId: number | null = null;

  descripcion = '';
  ubicacion = '';
  categoria = '';
  prioridad = '';

  categoriasDisponibles = [
    'Mecánica general',
    'Sistema electrico',
    'Neumáticos y auxilio',
    'Choque',
    'Remolque y grua'
  ];

  prioridadesDisponibles = ['Alta', 'Media', 'Crítica'];

  estadosDisponibles = [
    'Pendiente',
    'Aceptado',
    'Rechazado',
    'En Camino',
    'En Proceso',
    'Finalizado'
  ];

  especialidadesDisponibles = [
    'Mecánica',
    'Electricista',
    'Auxilio vial / Grúa',
    'Llantero'
  ];

  estadoPorIncidente: { [key: number]: string } = {};
  tecnicoPorIncidente: { [key: number]: number | null } = {};

  mensajeChat = '';
  cargandoIA = false;

  mensajesChat: any[] = [
    {
      tipo: 'bot',
      texto: 'Hola, soy tu asistente de emergencias vehiculares. Describe qué le pasa a tu auto y te ayudaré.'
    }
  ];

  constructor(private router: Router, private http: HttpClient) {}

  rolNormalizado(): string {
    return (this.usuario.rol || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  esCliente(): boolean {
    return this.rolNormalizado() === 'cliente';
  }

  esTecnico(): boolean {
    return this.rolNormalizado() === 'tecnico';
  }

  esTaller(): boolean {
    return this.rolNormalizado() === 'taller';
  }

  esAdministrador(): boolean {
    return this.rolNormalizado() === 'administrador';
  }

  puedeVerVehiculos(): boolean {
    return this.esCliente() || this.esAdministrador();
  }

  puedeVerTalleres(): boolean {
    return this.esTaller() || this.esAdministrador();
  }

  puedeVerTecnicos(): boolean {
    return this.esTaller() || this.esAdministrador();
  }

  puedeVerPanelTecnico(): boolean {
    return this.esTecnico() || this.esTaller() || this.esAdministrador();
  }

  puedeActualizarEstado(): boolean {
    return this.esTecnico() || this.esTaller() || this.esAdministrador();
  }

  cambiarVista(vista: string) {
    this.mensaje = '';
    this.vistaActual = vista;

    if (vista === 'vehiculos') this.cargarVehiculos();
    if (vista === 'talleres') this.cargarTalleres();
    if (vista === 'incidentes') this.cargarIncidentes();

    if (vista === 'tecnicos') {
      this.cargarTalleres();
      this.cargarTecnicos();
    }

    if (vista === 'tecnico') {
      this.cargarTalleres();
      this.cargarTecnicos();
      this.cargarPanelTecnico();
    }
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    this.router.navigate(['/']);
  }

  cargarTalleres() {
    this.http.get<any[]>('https://parcial-1-produccion.onrender.com/talleres').subscribe({
      next: (data) => {
        this.talleres = data;

        if (!this.tecnicoTallerId && this.talleres.length > 0) {
          this.tecnicoTallerId = this.talleres[0].id;
        }
      },
      error: () => {
        this.mensaje = 'Error al cargar talleres';
      }
    });
  }

  cargarTecnicos() {
    this.http.get<any[]>('https://parcial-1-produccion.onrender.com/tecnicos').subscribe({
      next: (data) => {
        this.tecnicos = data;
      },
      error: () => {
        this.mensaje = 'Error al cargar técnicos';
      }
    });
  }

  registrarTecnico() {
    const data = {
      nombre: this.tecnicoNombre,
      telefono: this.tecnicoTelefono,
      especialidad: this.tecnicoEspecialidad,
      disponibilidad: this.tecnicoDisponibilidad,
      latitud: this.tecnicoLatitud,
      longitud: this.tecnicoLongitud,
      id_taller: this.tecnicoTallerId
    };

    this.http.post('https://parcial-1-produccion.onrender.com/tecnicos', data).subscribe({
      next: () => {
        this.mensaje = 'Técnico registrado correctamente';
        this.tecnicoNombre = '';
        this.tecnicoTelefono = '';
        this.tecnicoEspecialidad = '';
        this.tecnicoDisponibilidad = true;
        this.tecnicoLatitud = -17.7833;
        this.tecnicoLongitud = -63.1821;
        this.cargarTecnicos();
      },
      error: (err) => {
        this.mensaje = err?.error?.detail || 'Error al registrar técnico';
      }
    });
  }

  cambiarDisponibilidadTecnico(id: number, disponibilidad: boolean) {
    this.http.put(`https://parcial-1-produccion.onrender.com/tecnicos/${id}/disponibilidad`, {
      disponibilidad
    }).subscribe({
      next: () => {
        this.mensaje = 'Disponibilidad actualizada correctamente';
        this.cargarTecnicos();
      },
      error: () => {
        this.mensaje = 'Error al actualizar disponibilidad';
      }
    });
  }

  cargarVehiculos() {
    this.http.get<any[]>('https://parcial-1-produccion.onrender.com/vehiculos').subscribe({
      next: (data) => {
        this.vehiculos = this.esAdministrador()
          ? data
          : data.filter(v => Number(v.usuario_id) === Number(this.usuario.id));
      },
      error: () => {
        this.mensaje = 'Error al cargar vehículos';
      }
    });
  }

  registrarVehiculo() {
    const data = {
      usuario_id: this.usuario.id,
      placa: this.placa,
      marca: this.marca,
      modelo: this.modelo,
      color: this.color,
      anio: this.anio
    };

    this.http.post('https://parcial-1-produccion.onrender.com/vehiculos', data).subscribe({
      next: () => {
        this.mensaje = 'Vehículo registrado correctamente';
        this.placa = '';
        this.marca = '';
        this.modelo = '';
        this.color = '';
        this.anio = null;
        this.cargarVehiculos();
      },
      error: () => {
        this.mensaje = 'Error al registrar vehículo';
      }
    });
  }

  registrarTaller() {
    const data = {
      nombre: this.tallerNombre,
      direccion: this.tallerDireccion,
      telefono: this.tallerTelefono,
      capacidad: this.tallerCapacidad,
      latitud: this.tallerLatitud,
      longitud: this.tallerLongitud,
      radio: this.tallerRadio,
      usuario_id: this.usuario.id
    };

    this.http.post('https://parcial-1-produccion.onrender.com/talleres', data).subscribe({
      next: () => {
        this.mensaje = 'Taller registrado correctamente';
        this.tallerNombre = '';
        this.tallerDireccion = '';
        this.tallerTelefono = '';
        this.tallerCapacidad = null;
        this.tallerLatitud = null;
        this.tallerLongitud = null;
        this.tallerRadio = null;
        this.cargarTalleres();
      },
      error: () => {
        this.mensaje = 'Error al registrar taller';
      }
    });
  }

  cargarIncidentes() {
    this.http.get<any[]>('https://parcial-1-produccion.onrender.com/incidentes').subscribe({
      next: (data) => {
        this.incidentes = this.esCliente()
          ? data.filter(i => Number(i.usuario_id) === Number(this.usuario.id))
          : data;
      },
      error: () => {
        this.mensaje = 'Error al cargar incidentes';
      }
    });
  }

  cargarPanelTecnico() {
    this.http.get<any[]>('https://parcial-1-produccion.onrender.com/incidentes').subscribe({
      next: (data) => {
        this.incidentesTecnico = data.filter(i => {
          const estado = String(i.estado).toLowerCase();
          return !estado.includes('finalizado') && !estado.includes('rechazado');
        });
      },
      error: () => {
        this.mensaje = 'Error al cargar panel técnico';
      }
    });
  }

  crearIncidente() {
    const data = {
      descripcion: this.descripcion,
      ubicacion: this.ubicacion,
      tipo: this.categoria,
      prioridad: this.prioridad
    };

    this.http.post('https://parcial-1-produccion.onrender.com/incidentes', data).subscribe({
      next: (res: any) => {
        this.mensaje = res.notificacion
          ? `Incidente creado correctamente. ${res.notificacion}`
          : 'Incidente creado correctamente';

        this.descripcion = '';
        this.ubicacion = '';
        this.categoria = '';
        this.prioridad = '';
        this.cargarIncidentes();
      },
      error: () => {
        this.mensaje = 'Error al crear incidente';
      }
    });
  }

  aceptarIncidente(id: number) {
    this.http.put(`https://parcial-1-produccion.onrender.com/incidentes/${id}/aceptar`, {}).subscribe({
      next: () => {
        this.mensaje = 'Solicitud aceptada correctamente';
        this.cargarPanelTecnico();
      }
    });
  }

  rechazarIncidente(id: number) {
    this.http.put(`https://parcial-1-produccion.onrender.com/incidentes/${id}/rechazar`, {}).subscribe({
      next: () => {
        this.mensaje = 'Solicitud rechazada correctamente';
        this.cargarPanelTecnico();
      }
    });
  }

  asignarTecnico(idIncidente: number) {
    const tecnicoId = this.tecnicoPorIncidente[idIncidente];

    if (!tecnicoId) {
      this.mensaje = 'Debes seleccionar un técnico';
      return;
    }

    this.http.put(`https://parcial-1-produccion.onrender.com/incidentes/${idIncidente}/asignar-tecnico`, {
      tecnico_id: Number(tecnicoId)
    }).subscribe({
      next: () => {
        this.mensaje = 'Técnico asignado correctamente';
        this.tecnicoPorIncidente[idIncidente] = null;
        this.cargarPanelTecnico();
      },
      error: (err) => {
        this.mensaje = err?.error?.detail || 'Error al asignar técnico';
      }
    });
  }

  iniciarAtencion(idIncidente: number) {
    this.http.put(`https://parcial-1-produccion.onrender.com/incidentes/${idIncidente}/iniciar-atencion`, {}).subscribe({
      next: () => {
        this.mensaje = 'Atención técnica iniciada correctamente';
        this.cargarPanelTecnico();
      }
    });
  }

  cambiarEstadoManual(id: number) {
    const estado = this.estadoPorIncidente[id];

    if (!estado) {
      this.mensaje = 'Debes seleccionar un estado';
      return;
    }

    this.cambiarEstadoIncidente(id, estado);
  }

  tomarIncidente(id: number) {
    this.cambiarEstadoIncidente(id, 'En Camino');
  }

  finalizarIncidente(id: number) {
    this.cambiarEstadoIncidente(id, 'Finalizado');
  }

  cambiarEstadoIncidente(id: number, estado: string) {
    this.http.put(`https://parcial-1-produccion.onrender.com/incidentes/${id}/estado`, { estado }).subscribe({
      next: () => {
        this.mensaje = `Incidente actualizado a: ${estado}`;
        this.estadoPorIncidente[id] = '';

        if (this.vistaActual === 'tecnico') {
          this.cargarPanelTecnico();
        } else {
          this.cargarIncidentes();
        }
      }
    });
  }

  abrirMapa(latitud: number, longitud: number) {
    if (!latitud || !longitud) {
      this.mensaje = 'No hay coordenadas disponibles';
      return;
    }

    const url = `https://www.google.com/maps?q=${latitud},${longitud}`;
    window.open(url, '_blank');
  }

  alternarChat() {
    this.chatAbierto = !this.chatAbierto;
  }

  enviarMensajeChat() {
    const texto = this.mensajeChat.trim();

    if (!texto) return;

    this.mensajesChat.push({ tipo: 'usuario', texto });
    this.mensajeChat = '';
    this.cargandoIA = true;

    setTimeout(() => {
      const analisis = this.analizarTextoLocal(texto);

      this.mensajesChat.push({
        tipo: 'bot',
        texto:
          `Según tu descripción, la categoría sugerida es "${analisis.categoria}", ` +
          `la prioridad es "${analisis.prioridad}". ${analisis.recomendacion}`,
        categoria: analisis.categoria,
        prioridad: analisis.prioridad,
        textoOriginal: texto
      });

      this.cargandoIA = false;
    }, 300);
  }

  analizarTextoLocal(texto: string) {
    const t = texto.toLowerCase();

    if (t.includes('choque') || t.includes('accidente') || t.includes('herido')) {
      return {
        categoria: 'Choque',
        prioridad: 'Crítica',
        recomendacion: 'Mantén la calma, verifica si hay personas heridas y solicita asistencia inmediata.'
      };
    }

    if (t.includes('llanta') || t.includes('pinchada') || t.includes('neumático')) {
      return {
        categoria: 'Neumáticos y auxilio',
        prioridad: 'Media',
        recomendacion: 'Evita mover el vehículo y espera asistencia para el cambio o reparación de la llanta.'
      };
    }

    if (t.includes('batería') || t.includes('bateria') || t.includes('no enciende')) {
      return {
        categoria: 'Sistema electrico',
        prioridad: 'Media',
        recomendacion: 'Puede tratarse de una falla eléctrica o batería descargada. Solicita revisión técnica.'
      };
    }

    if (t.includes('motor') || t.includes('humo') || t.includes('calentó') || t.includes('apagó') || t.includes('apago')) {
      return {
        categoria: 'Mecánica general',
        prioridad: 'Alta',
        recomendacion: 'Apaga el vehículo y evita seguir conduciendo hasta recibir asistencia.'
      };
    }

    if (t.includes('grúa') || t.includes('grua') || t.includes('remolque')) {
      return {
        categoria: 'Remolque y grua',
        prioridad: 'Alta',
        recomendacion: 'Solicita servicio de remolque para trasladar el vehículo de forma segura.'
      };
    }

    return {
      categoria: 'Mecánica general',
      prioridad: 'Media',
      recomendacion: 'Describe con más detalle la falla para mejorar el diagnóstico.'
    };
  }

  usarRespuestaComoIncidente(msg: any) {
    this.descripcion = msg.textoOriginal;
    this.ubicacion = '';
    this.categoria = msg.categoria;
    this.prioridad = msg.prioridad;
    this.vistaActual = 'incidentes';
    this.chatAbierto = false;
  }

  generarResumenIncidente(inc: any): string {
  const tecnico = inc.tecnico_nombre
    ? `${inc.tecnico_nombre} (${inc.tecnico_especialidad})`
    : 'sin técnico asignado';

  return `Incidente ${inc.id}: ${inc.descripcion}. Categoría: ${inc.categoria}. Prioridad: ${inc.prioridad}. Estado actual: ${inc.estado}. Técnico: ${tecnico}. Vehículo: ${inc.placa_vehiculo}.`;
}

incidenteIncompleto(inc: any): boolean {
  return !inc.descripcion || !inc.categoria || !inc.prioridad || !inc.placa_vehiculo || !inc.latitud || !inc.longitud;
}

advertenciaIncidente(inc: any): string {
  const faltantes: string[] = [];

  if (!inc.descripcion) faltantes.push('descripción');
  if (!inc.categoria) faltantes.push('categoría');
  if (!inc.prioridad) faltantes.push('prioridad');
  if (!inc.placa_vehiculo) faltantes.push('placa');
  if (!inc.latitud || !inc.longitud) faltantes.push('ubicación');

  return `Faltan datos: ${faltantes.join(', ')}`;
  }

  obtenerMetricas() {
  const total = this.incidentes.length;

  const pendientes = this.incidentes.filter(i =>
    i.estado?.toLowerCase().includes('pendiente')
  ).length;

  const proceso = this.incidentes.filter(i =>
    i.estado?.toLowerCase().includes('proceso') ||
    i.estado?.toLowerCase().includes('camino')
  ).length;

  const finalizados = this.incidentes.filter(i =>
    i.estado?.toLowerCase().includes('finalizado')
  ).length;

  const rechazados = this.incidentes.filter(i =>
    i.estado?.toLowerCase().includes('rechazado')
  ).length;

  return { total, pendientes, proceso, finalizados, rechazados };
}

descargarReporteHTML() {
  const metricas = this.obtenerMetricas();

  const filas = this.incidentes.map(inc => `
    <tr>
      <td>${inc.id}</td>
      <td>${inc.descripcion}</td>
      <td>${inc.categoria}</td>
      <td>${inc.prioridad}</td>
      <td>${inc.estado}</td>
      <td>${inc.tecnico_nombre || 'Sin asignar'}</td>
      <td>${inc.placa_vehiculo}</td>
    </tr>
  `).join('');

  const contenido = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Incidentes</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; }
        h1 { color: #1f2937; }
        .metricas { background: #e0f2fe; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #1f2937; color: white; }
      </style>
    </head>
    <body>
      <h1>Reporte de Incidentes Vehiculares</h1>

      <div class="metricas">
        <h2>Métricas del sistema</h2>
        <p>Total: ${metricas.total}</p>
        <p>Pendientes: ${metricas.pendientes}</p>
        <p>En proceso: ${metricas.proceso}</p>
        <p>Finalizados: ${metricas.finalizados}</p>
        <p>Rechazados: ${metricas.rechazados}</p>
      </div>

      <h2>Detalle de incidentes</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Descripción</th>
            <th>Categoría</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Técnico</th>
            <th>Placa</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([contenido], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'reporte_incidentes.html';
  a.click();

  window.URL.revokeObjectURL(url);
}
toastMensaje = '';
toastTipo: 'success' | 'error' | 'info' = 'info';

mostrarToast(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info') {
  this.toastMensaje = mensaje;
  this.toastTipo = tipo;

  setTimeout(() => {
    this.toastMensaje = '';
  }, 3000);
}

analizarIncidenteIA() {
  if (!this.mensajeIA.trim()) return;

  this.mensajeIAUsuario = this.mensajeIA;

  const texto = this.mensajeIA.toLowerCase();
  let categoria = 'Mecánica general';
  let prioridad = 'Media';
  let recomendacion = 'Describe con más detalle la falla para mejorar el diagnóstico.';

  if (texto.includes('llanta') || texto.includes('pinch') || texto.includes('neumático')) {
    categoria = 'Neumáticos y auxilio';
    prioridad = 'Media';
    recomendacion = 'Evita mover el vehículo y solicita asistencia para revisar o cambiar la llanta.';
  } else if (texto.includes('no enciende') || texto.includes('batería') || texto.includes('bateria')) {
    categoria = 'Sistema electrico';
    prioridad = 'Alta';
    recomendacion = 'Puede ser batería descargada o falla eléctrica. Solicita revisión técnica.';
  } else if (texto.includes('choque') || texto.includes('accidente')) {
    categoria = 'Choque';
    prioridad = 'Crítica';
    recomendacion = 'Mantén la calma y solicita asistencia inmediata.';
  } else if (texto.includes('motor') || texto.includes('humo') || texto.includes('apagó') || texto.includes('apago')) {
    categoria = 'Mecánica general';
    prioridad = 'Alta';
    recomendacion = 'Apaga el vehículo y evita seguir conduciendo.';
  } else if (texto.includes('grúa') || texto.includes('grua') || texto.includes('remolque')) {
    categoria = 'Remolque y grua';
    prioridad = 'Alta';
    recomendacion = 'Solicita remolque para trasladar el vehículo de forma segura.';
  }

  this.respuestaIA = `Categoría sugerida: ${categoria}. Prioridad: ${prioridad}. ${recomendacion}`;

  this.mensajeIA = '';
}
crearIncidenteDesdeIA() {
  if (!this.mensajeIAUsuario) return;

  const nuevoIncidente = {
    descripcion: this.mensajeIAUsuario,
    categoria: 'Sugerida por IA',
    prioridad: 'Media',
    estado: 'Pendiente',
    latitud: -17.7833,
    longitud: -63.1821
  };

  // AQUÍ puedes luego mandar al backend
  this.incidentes.push(nuevoIncidente);

  this.respuestaIA = '✅ Incidente creado correctamente';
}
eliminarTecnico(id: number) {
  if (!confirm('¿Seguro que quieres eliminar este técnico?')) return;

  this.http.delete(`http://localhost:8000/tecnicos/${id}`)
    .subscribe({
      next: () => {
        this.mostrarToast('Técnico eliminado', 'success');
        this.cargarTecnicos();
      },
      error: () => {
        this.mostrarToast('Error al eliminar técnico', 'error');
      }
    });
}
}