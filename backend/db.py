import psycopg2

def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="asistencia_vehicular",
        user="postgres",
        password="6358370",
        port="5432"
    )