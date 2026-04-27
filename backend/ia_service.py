def analizar_incidente_texto(texto: str):
    texto = texto.lower()

    if "choque" in texto or "accidente" in texto or "herido" in texto:
        return {
            "categoria": "Choque",
            "prioridad": "Crítica",
            "recomendacion": "Mantén la calma, verifica si hay personas heridas y solicita asistencia inmediata."
        }

    if "llanta" in texto or "pinchada" in texto or "neumático" in texto:
        return {
            "categoria": "Neumáticos y auxilio",
            "prioridad": "Media",
            "recomendacion": "Evita mover el vehículo y espera asistencia para el cambio o reparación de la llanta."
        }

    if "batería" in texto or "bateria" in texto or "no enciende" in texto:
        return {
            "categoria": "Sistema electrico",
            "prioridad": "Media",
            "recomendacion": "Puede tratarse de una falla eléctrica o batería descargada. Solicita revisión técnica."
        }

    if "motor" in texto or "humo" in texto or "calentó" in texto or "apagó" in texto:
        return {
            "categoria": "Mecánica general",
            "prioridad": "Alta",
            "recomendacion": "Apaga el vehículo y evita seguir conduciendo hasta recibir asistencia."
        }

    if "grúa" in texto or "grua" in texto or "remolque" in texto:
        return {
            "categoria": "Remolque y grua",
            "prioridad": "Alta",
            "recomendacion": "Solicita servicio de remolque para trasladar el vehículo de forma segura."
        }

    return {
        "categoria": "Mecánica general",
        "prioridad": "Media",
        "recomendacion": "Describe con más detalle la falla para mejorar el diagnóstico."
    }