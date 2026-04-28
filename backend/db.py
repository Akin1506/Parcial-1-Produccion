import os
import psycopg2


def get_connection():
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        return psycopg2.connect(database_url)

    return psycopg2.connect(
        host="localhost",
        database="asistencia_vehicular",
        user="postgres",
        password="6358370",
        port="5432"
    )