from pydantic import BaseModel


class UsuarioRegistro(BaseModel):
    nombre: str
    correo: str
    password: str
    rol: str


class LoginRequest(BaseModel):
    correo: str
    password: str


class Vehiculo(BaseModel):
    usuario_id: int
    placa: str
    marca: str
    modelo: str
    color: str
    anio: int


class Taller(BaseModel):
    nombre: str
    direccion: str
    telefono: str
    capacidad: int
    latitud: float
    longitud: float
    radio: int
    usuario_id: int


class Incidente(BaseModel):
    descripcion: str
    ubicacion: str
    tipo: str
    prioridad: str


class AsignacionTaller(BaseModel):
    taller: str


class ActualizarEstado(BaseModel):
    estado: str


class TextoIA(BaseModel):
    texto: str


class AsignarTecnico(BaseModel):
    tecnico_id: int

class TecnicoRegistro(BaseModel):
    nombre: str
    telefono: str
    especialidad: str
    disponibilidad: bool
    latitud: float
    longitud: float
    id_taller: int


class DisponibilidadTecnico(BaseModel):
    disponibilidad: bool