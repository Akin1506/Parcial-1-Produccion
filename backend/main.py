from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from db import get_connection

from models import (
    UsuarioRegistro,
    LoginRequest,
    Vehiculo,
    Taller,
    Incidente,
    ActualizarEstado,
    TextoIA,
    AsignarTecnico,
    TecnicoRegistro,
    DisponibilidadTecnico,
)

from ia_service import analizar_incidente_texto


app = FastAPI(title="API de Emergencias Vehiculares")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://parcial-frontend-seven.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def buscar_id_catalogo(cur, tabla: str, texto: str):
    cur.execute(
        f"""
        SELECT id, nombre
        FROM {tabla}
        WHERE LOWER(nombre) LIKE LOWER(%s)
        LIMIT 1
        """,
        (f"%{texto}%",)
    )
    return cur.fetchone() or (None, None)


@app.get("/")
def inicio():
    return {"mensaje": "API de Emergencias Vehiculares funcionando"}


@app.get("/usuarios")
def listar_usuarios():
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT u.id, u.nombre, u.email, u.password, u.telefono, u.activo, r.nombre AS rol
            FROM usuario u
            JOIN rol r ON u.id_rol = r.id
            ORDER BY u.id
            """
        )

        usuarios = []

        for fila in cur.fetchall():
            usuarios.append({
                "id": fila[0],
                "nombre": fila[1],
                "correo": fila[2],
                "password": fila[3],
                "telefono": fila[4],
                "activo": fila[5],
                "rol": fila[6],
            })

        return usuarios

    finally:
        cur.close()
        conn.close()


@app.post("/login")
def login(datos: LoginRequest):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT u.id, u.nombre, u.email, u.password, r.nombre AS rol
            FROM usuario u
            JOIN rol r ON u.id_rol = r.id
            WHERE u.email = %s AND u.activo = TRUE
            """,
            (datos.correo,)
        )

        usuario = cur.fetchone()

        if not usuario:
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

        password_bd = str(usuario[3]).strip()
        password_ingresado = str(datos.password).strip()

        if password_bd != password_ingresado:
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

        return {
            "mensaje": "Inicio de sesión exitoso",
            "usuario": {
                "id": usuario[0],
                "nombre": usuario[1],
                "correo": usuario[2],
                "rol": usuario[4],
            }
        }

    finally:
        cur.close()
        conn.close()


@app.post("/registro")
def registrar_usuario(datos: UsuarioRegistro):
    conn = get_connection()
    cur = conn.cursor()

    try:
        id_rol, nombre_rol = buscar_id_catalogo(cur, "rol", datos.rol)

        if not id_rol:
            raise HTTPException(status_code=400, detail="Rol no encontrado")

        cur.execute(
            """
            INSERT INTO usuario (nombre, email, password, telefono, activo, id_rol)
            VALUES (%s, %s, %s, %s, TRUE, %s)
            RETURNING id
            """,
            (datos.nombre, datos.correo, datos.password, "70000000", id_rol)
        )

        nuevo_id = cur.fetchone()[0]
        conn.commit()

        return {
            "mensaje": "Usuario registrado correctamente",
            "id": nuevo_id,
            "rol": nombre_rol
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cur.close()
        conn.close()


@app.get("/vehiculos")
def listar_vehiculos():
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT v.placa, v.marca, v.modelo, v.anio, v.kilometraje,
                   v.tipo_combustible, v.color, v.id_usuario, u.nombre
            FROM vehiculo v
            JOIN usuario u ON v.id_usuario = u.id
            ORDER BY v.placa
            """
        )

        vehiculos = []

        for fila in cur.fetchall():
            vehiculos.append({
                "placa": fila[0],
                "marca": fila[1],
                "modelo": fila[2],
                "anio": fila[3],
                "kilometraje": fila[4],
                "tipo_combustible": fila[5],
                "color": fila[6],
                "usuario_id": fila[7],
                "usuario": fila[8],
            })

        return vehiculos

    finally:
        cur.close()
        conn.close()


@app.post("/vehiculos")
def registrar_vehiculo(datos: Vehiculo):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO vehiculo (placa, marca, modelo, anio, kilometraje, tipo_combustible, color, id_usuario)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                datos.placa,
                datos.marca,
                datos.modelo,
                datos.anio,
                0,
                "Gasolina",
                datos.color,
                datos.usuario_id,
            )
        )

        conn.commit()

        return {"mensaje": "Vehículo registrado correctamente"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cur.close()
        conn.close()


@app.get("/talleres")
def listar_talleres():
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT t.id, t.nombre, t.direccion, t.telefono, t.capacidad_vehiculos,
                   t.fecha_registro, t.latitud, t.longitud, t.radio_cobertura,
                   t.activo, t.id_usuario, u.nombre
            FROM taller t
            JOIN usuario u ON t.id_usuario = u.id
            ORDER BY t.id
            """
        )

        talleres = []

        for fila in cur.fetchall():
            talleres.append({
                "id": fila[0],
                "nombre": fila[1],
                "direccion": fila[2],
                "telefono": fila[3],
                "capacidad": fila[4],
                "fecha_registro": str(fila[5]) if fila[5] else None,
                "latitud": float(fila[6]) if fila[6] is not None else None,
                "longitud": float(fila[7]) if fila[7] is not None else None,
                "radio": fila[8],
                "activo": fila[9],
                "usuario_id": fila[10],
                "usuario": fila[11],
            })

        return talleres

    finally:
        cur.close()
        conn.close()


@app.post("/talleres")
def registrar_taller(datos: Taller):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO taller
            (nombre, direccion, telefono, capacidad_vehiculos, fecha_registro,
             latitud, longitud, radio_cobertura, activo, id_usuario)
            VALUES (%s, %s, %s, %s, CURRENT_DATE, %s, %s, %s, TRUE, %s)
            """,
            (
                datos.nombre,
                datos.direccion,
                datos.telefono,
                datos.capacidad,
                datos.latitud,
                datos.longitud,
                datos.radio,
                datos.usuario_id,
            )
        )

        conn.commit()

        return {"mensaje": "Taller registrado correctamente"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cur.close()
        conn.close()


@app.get("/incidentes")
def obtener_incidentes():
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT s.id, s.fecha_hora, s.descripcion,
                   s.ubicacion_latitud, s.ubicacion_longitud,
                   p.nombre AS prioridad,
                   c.nombre AS categoria,
                   e.nombre AS estado,
                   s.id_tecnico,
                   te.nombre AS tecnico_nombre,
                   te.especialidad AS tecnico_especialidad,
                   s.id_usuario,
                   s.placa_vehiculo
            FROM solicitud_emergencia s
            JOIN prioridad p ON s.id_prioridad = p.id
            JOIN categoria c ON s.id_categoria = c.id
            JOIN estado_incidente e ON s.id_estado = e.id
            LEFT JOIN tecnico te ON s.id_tecnico = te.id
            ORDER BY s.id
            """
        )

        incidentes = []

        for fila in cur.fetchall():
            incidentes.append({
                "id": fila[0],
                "fecha_hora": str(fila[1]),
                "descripcion": fila[2],
                "latitud": float(fila[3]),
                "longitud": float(fila[4]),
                "prioridad": fila[5],
                "categoria": fila[6],
                "estado": fila[7],
                "tecnico_id": fila[8],
                "tecnico_nombre": fila[9],
                "tecnico_especialidad": fila[10],
                "usuario_id": fila[11],
                "placa_vehiculo": fila[12],
            })

        return incidentes

    finally:
        cur.close()
        conn.close()

def buscar_tecnico_automatico(cur, categoria: str):
    categoria = categoria.lower()

    if "choque" in categoria or "grua" in categoria or "remolque" in categoria:
        especialidad = "Grúa"
    elif "electrico" in categoria or "eléctrico" in categoria:
        especialidad = "Electricista"
    elif "neumático" in categoria or "llanta" in categoria:
        especialidad = "Llantero"
    else:
        especialidad = "Mecánica"

    cur.execute(
        """
        SELECT id, especialidad
        FROM tecnico
        WHERE disponibilidad = TRUE
        AND LOWER(especialidad) LIKE LOWER(%s)
        LIMIT 1
        """,
        (f"%{especialidad}%",)
    )

    tecnico = cur.fetchone()

    if tecnico:
        return tecnico

    cur.execute(
        """
        SELECT id, especialidad
        FROM tecnico
        WHERE disponibilidad = TRUE
        LIMIT 1
        """
    )

    return cur.fetchone()

@app.post("/incidentes")
def crear_incidente(datos: Incidente):
    conn = get_connection()
    cur = conn.cursor()

    try:
        id_prioridad, nombre_prioridad = buscar_id_catalogo(cur, "prioridad", datos.prioridad)
        id_categoria, nombre_categoria = buscar_id_catalogo(cur, "categoria", datos.tipo)
        id_estado, nombre_estado = buscar_id_catalogo(cur, "estado_incidente", "Pendiente")

        if not id_prioridad:
            id_prioridad = 3
            nombre_prioridad = "Media"

        if not id_categoria:
            id_categoria = 1
            nombre_categoria = "Mecánica general"

        if not id_estado:
            id_estado = 1
            nombre_estado = "Pendiente"

        cur.execute(
            """
            SELECT placa
            FROM vehiculo
            ORDER BY placa
            LIMIT 1
            """
        )

        vehiculo = cur.fetchone()

        if not vehiculo:
            raise HTTPException(status_code=400, detail="No existe ningún vehículo registrado")

        tecnico = buscar_tecnico_automatico(cur, nombre_categoria or datos.tipo)

        tecnico_id = tecnico[0] if tecnico else None
        tecnico_especialidad = tecnico[1] if tecnico else None

        cur.execute(
            """
            INSERT INTO solicitud_emergencia
            (fecha_hora, descripcion, ubicacion_latitud, ubicacion_longitud,
             id_prioridad, id_categoria, id_estado, id_tecnico, id_usuario, placa_vehiculo)
            VALUES (NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                datos.descripcion,
                -17.7833,
                -63.1821,
                id_prioridad,
                id_categoria,
                id_estado,
                tecnico_id,
                1,
                vehiculo[0],
            )
        )

        nuevo_id = cur.fetchone()[0]

        if tecnico_id:
            cur.execute(
                """
                UPDATE tecnico
                SET disponibilidad = FALSE
                WHERE id = %s
                """,
                (tecnico_id,)
            )

        conn.commit()

        return {
            "mensaje": "Incidente creado correctamente",
            "id": nuevo_id,
            "estado": nombre_estado,
            "tecnico_asignado": tecnico_id,
            "especialidad_tecnico": tecnico_especialidad,
            "notificacion": "Técnico asignado automáticamente" if tecnico_id else "No hay técnicos disponibles"
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cur.close()
        conn.close()

@app.put("/incidentes/{id}/estado")
def actualizar_estado(id: int, datos: ActualizarEstado):
    conn = get_connection()
    cur = conn.cursor()

    try:
        id_estado, nombre_estado = buscar_id_catalogo(cur, "estado_incidente", datos.estado)

        if not id_estado:
            raise HTTPException(status_code=400, detail="Estado no encontrado")

        cur.execute(
            """
            SELECT id_tecnico
            FROM solicitud_emergencia
            WHERE id = %s
            """,
            (id,)
        )

        incidente = cur.fetchone()

        if not incidente:
            raise HTTPException(status_code=404, detail="Incidente no encontrado")

        tecnico_id = incidente[0]

        cur.execute(
            """
            UPDATE solicitud_emergencia
            SET id_estado = %s
            WHERE id = %s
            """,
            (id_estado, id)
        )

        if "finalizado" in nombre_estado.lower() and tecnico_id:
            cur.execute(
                """
                UPDATE tecnico
                SET disponibilidad = TRUE
                WHERE id = %s
                """,
                (tecnico_id,)
            )

        conn.commit()

        return {
            "mensaje": "Estado actualizado correctamente",
            "incidente_id": id,
            "nuevo_estado": nombre_estado
        }

    finally:
        cur.close()
        conn.close()

@app.put("/incidentes/{id}/aceptar")
def aceptar_incidente(id: int):
    conn = get_connection()
    cur = conn.cursor()

    try:
        id_estado, nombre_estado = buscar_id_catalogo(cur, "estado_incidente", "Aceptado")

        if not id_estado:
            raise HTTPException(status_code=400, detail="No existe el estado Aceptado por taller")

        cur.execute(
            """
            UPDATE solicitud_emergencia
            SET id_estado = %s
            WHERE id = %s
            """,
            (id_estado, id)
        )

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Incidente no encontrado")

        conn.commit()

        return {
            "mensaje": "Solicitud aceptada correctamente",
            "incidente_id": id,
            "nuevo_estado": nombre_estado
        }

    finally:
        cur.close()
        conn.close()


@app.put("/incidentes/{id}/rechazar")
def rechazar_incidente(id: int):
    conn = get_connection()
    cur = conn.cursor()

    try:
        id_estado, nombre_estado = buscar_id_catalogo(cur, "estado_incidente", "Rechazado")

        if not id_estado:
            raise HTTPException(status_code=400, detail="No existe el estado Rechazado por taller")

        cur.execute(
            """
            UPDATE solicitud_emergencia
            SET id_estado = %s
            WHERE id = %s
            """,
            (id_estado, id)
        )

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Incidente no encontrado")

        conn.commit()

        return {
            "mensaje": "Solicitud rechazada correctamente",
            "incidente_id": id,
            "nuevo_estado": nombre_estado
        }

    finally:
        cur.close()
        conn.close()


@app.get("/tecnicos")
def listar_tecnicos():
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT te.id, te.nombre, te.telefono, te.especialidad, te.disponibilidad,
                   te.latitud_actual, te.longitud_actual,
                   te.id_taller, ta.nombre
            FROM tecnico te
            JOIN taller ta ON te.id_taller = ta.id
            ORDER BY te.id
            """
        )

        tecnicos = []

        for fila in cur.fetchall():
            tecnicos.append({
                "id": fila[0],
                "nombre": fila[1],
                "telefono": fila[2],
                "especialidad": fila[3],
                "disponibilidad": fila[4],
                "latitud": float(fila[5]) if fila[5] is not None else None,
                "longitud": float(fila[6]) if fila[6] is not None else None,
                "taller_id": fila[7],
                "taller": fila[8],
            })

        return tecnicos

    finally:
        cur.close()
        conn.close()

@app.post("/tecnicos")
def registrar_tecnico(datos: TecnicoRegistro):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO tecnico
            (nombre, telefono, especialidad, disponibilidad, latitud_actual, longitud_actual, id_taller)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                datos.nombre,
                datos.telefono,
                datos.especialidad,
                datos.disponibilidad,
                datos.latitud,
                datos.longitud,
                datos.id_taller,
            )
        )

        nuevo_id = cur.fetchone()[0]
        conn.commit()

        return {
            "mensaje": "Técnico registrado correctamente",
            "id": nuevo_id
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cur.close()
        conn.close()


@app.put("/tecnicos/{id}/disponibilidad")
def actualizar_disponibilidad_tecnico(id: int, datos: DisponibilidadTecnico):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            UPDATE tecnico
            SET disponibilidad = %s
            WHERE id = %s
            """,
            (datos.disponibilidad, id)
        )

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Técnico no encontrado")

        conn.commit()

        return {
            "mensaje": "Disponibilidad actualizada correctamente",
            "tecnico_id": id,
            "disponibilidad": datos.disponibilidad
        }

    finally:
        cur.close()
        conn.close()

@app.put("/incidentes/{id}/asignar-tecnico")
def asignar_tecnico_incidente(id: int, datos: AsignarTecnico):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT id, especialidad, disponibilidad
            FROM tecnico
            WHERE id = %s
            """,
            (datos.tecnico_id,)
        )

        tecnico = cur.fetchone()

        if not tecnico:
            raise HTTPException(status_code=404, detail="Técnico no encontrado")

        if tecnico[2] is False:
            raise HTTPException(status_code=400, detail="El técnico no está disponible")

        cur.execute(
            """
            UPDATE solicitud_emergencia
            SET id_tecnico = %s
            WHERE id = %s
            """,
            (datos.tecnico_id, id)
        )

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Incidente no encontrado")

        cur.execute(
            """
            UPDATE tecnico
            SET disponibilidad = FALSE
            WHERE id = %s
            """,
            (datos.tecnico_id,)
        )

        conn.commit()

        return {
            "mensaje": "Técnico asignado correctamente",
            "incidente_id": id,
            "tecnico_id": datos.tecnico_id,
            "especialidad": tecnico[1]
        }

    finally:
        cur.close()
        conn.close()

@app.put("/incidentes/{id}/iniciar-atencion")
def iniciar_atencion_tecnica(id: int):
    conn = get_connection()
    cur = conn.cursor()

    try:
        id_estado, nombre_estado = buscar_id_catalogo(cur, "estado_incidente", "En Proceso")

        if not id_estado:
            raise HTTPException(status_code=400, detail="No existe el estado En Proceso")

        cur.execute(
            """
            UPDATE solicitud_emergencia
            SET id_estado = %s
            WHERE id = %s
            """,
            (id_estado, id)
        )

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Incidente no encontrado")

        conn.commit()

        return {
            "mensaje": "Atención técnica iniciada correctamente",
            "incidente_id": id,
            "nuevo_estado": nombre_estado
        }

    finally:
        cur.close()
        conn.close()


@app.post("/ia/analizar-incidente")
def analizar_incidente_ia(datos: TextoIA):
    resultado = analizar_incidente_texto(datos.texto)

    return {
        "mensaje": "Análisis generado correctamente",
        "texto_analizado": datos.texto,
        "categoria_sugerida": resultado["categoria"],
        "prioridad_sugerida": resultado["prioridad"],
        "recomendacion": resultado["recomendacion"]
    }

@app.delete("/tecnicos/{id}")
def eliminar_tecnico(id: int):
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Desasignamos el técnico de cualquier incidente en el que esté asignado
        cur.execute(
            """
            UPDATE solicitud_emergencia
            SET id_tecnico = NULL
            WHERE id_tecnico = %s
            """,
            (id,)
        )

        # Ahora sí eliminamos el técnico
        cur.execute(
            """
            DELETE FROM tecnico
            WHERE id = %s
            """,
            (id,)
        )

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Técnico no encontrado")

        conn.commit()

        return {"mensaje": "Técnico eliminado correctamente"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cur.close()
        conn.close()