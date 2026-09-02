import os
import re

from dotenv import load_dotenv

import mysql.connector
import psycopg2
import pyodbc


# =========================================================
# LOAD ENVIRONMENT
# =========================================================

load_dotenv()


DBMS = os.getenv("DBMS", "mysql").lower()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "")
DB_NAME = os.getenv("DB_NAME", "")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_db_connection():

    # -----------------------------------------------------
    # MYSQL
    # -----------------------------------------------------

    if DBMS == "mysql":

        return mysql.connector.connect(
            host=DB_HOST,
            port=int(DB_PORT or 3306),
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )


    # -----------------------------------------------------
    # POSTGRESQL
    # -----------------------------------------------------

    if DBMS in ("postgres", "postgresql"):

        return psycopg2.connect(
            host=DB_HOST,
            port=int(DB_PORT or 5432),
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )


    # -----------------------------------------------------
    # SQL SERVER
    # -----------------------------------------------------

    if DBMS in ("sqlserver", "mssql"):

        driver = os.getenv(
            "DB_DRIVER",
            "ODBC Driver 18 for SQL Server"
        )

        connection_string = (
            f"DRIVER={{{driver}}};"
            f"SERVER={DB_HOST},{DB_PORT or 1433};"
            f"DATABASE={DB_NAME};"
            f"UID={DB_USER};"
            f"PWD={DB_PASSWORD};"
            "TrustServerCertificate=yes;"
        )

        return pyodbc.connect(connection_string)


    raise ValueError(
        f"Unsupported DBMS: {DBMS}"
    )


# =========================================================
# DBMS INFORMATION
# =========================================================

def get_dbms():

    return DBMS


# =========================================================
# IDENTIFIER QUOTING
# =========================================================

def quote_identifier(identifier):

    identifier = str(identifier)

    # Prevent identifiers from containing dangerous SQL
    if not re.match(
        r"^[A-Za-z_][A-Za-z0-9_ ]*$",
        identifier
    ):
        raise ValueError(
            f"Invalid database identifier: {identifier}"
        )

    if DBMS == "mysql":

        return f"`{identifier}`"

    return f'"{identifier}"'


# =========================================================
# NORMALIZE EXISTING MYSQL-STYLE SQL
# =========================================================

def normalize_sql(sql):

    if DBMS == "mysql":
        return sql

    # Existing application uses MySQL backticks.
    # Convert them to ANSI double quotes.
    sql = re.sub(
        r"`([^`]*)`",
        r'"\1"',
        sql
    )

    return sql


# =========================================================
# PARAMETER NORMALIZATION
# =========================================================

def normalize_parameters(sql):

    if DBMS in ("mysql", "postgres", "postgresql"):

        return sql

    # pyodbc uses ?
    if DBMS in ("sqlserver", "mssql"):

        sql = sql.replace("%s", "?")

    return sql


# =========================================================
# CURSOR WRAPPER
# =========================================================

class DatabaseCursor:

    def __init__(self, connection, dictionary=False):

        self.connection = connection

        self.dictionary = dictionary

        self.cursor = connection.cursor()

        self.description = None


    # =====================================================
    # EXECUTE
    # =====================================================

    def execute(self, sql, params=None):

        sql = normalize_sql(sql)

        sql = normalize_parameters(sql)

        sql = translate_mysql_metadata_query(sql)

        sql = translate_pagination(sql)


        if params is None:

            self.cursor.execute(sql)

        else:

            self.cursor.execute(
                sql,
                params
            )


        self.description = self.cursor.description

        return self


    # =====================================================
    # FETCH ONE
    # =====================================================

    def fetchone(self):

        row = self.cursor.fetchone()

        if row is None:

            return None


        if self.dictionary:

            return make_row(
                self.cursor.description,
                row
            )


        # Normal cursor = tuple

        return row


    # =====================================================
    # FETCH ALL
    # =====================================================

    def fetchall(self):

        rows = self.cursor.fetchall()


        if self.dictionary:

            return [
                make_row(
                    self.cursor.description,
                    row
                )
                for row in rows
            ]


        # Normal cursor = list of tuples

        return rows


    # =====================================================
    # CLOSE
    # =====================================================

    def close(self):

        self.cursor.close()

# =========================================================
# ROW CONVERSION
# =========================================================

def make_row(description, row):

    if description is None:
        return row

    columns = [
        column[0]
        for column in description
    ]

    # Return dictionary-like rows
    return {
        columns[index]: row[index]
        for index in range(len(columns))
    }


# =========================================================
# CONNECTION WRAPPER
# =========================================================

class DatabaseConnection:

    def __init__(self, connection):

        self.connection = connection


    def cursor(self, dictionary=False):

        return DatabaseCursor(
            self.connection,
            dictionary=dictionary
        )


    def commit(self):

        self.connection.commit()


    def rollback(self):

        self.connection.rollback()


    def close(self):

        self.connection.close()


# =========================================================
# PUBLIC CONNECTION
# =========================================================

def connect():

    return DatabaseConnection(
        get_db_connection()
    )


# =========================================================
# MYSQL "SHOW COLUMNS" COMPATIBILITY
# =========================================================

def translate_mysql_metadata_query(sql):

    normalized = sql.strip().rstrip(";")

    match = re.match(
        r"SHOW\s+COLUMNS\s+FROM\s+([A-Za-z0-9_]+)",
        normalized,
        re.IGNORECASE
    )

    if not match:

        return sql


    table = match.group(1)


    # -----------------------------------------------------
    # MYSQL
    # -----------------------------------------------------

    if DBMS == "mysql":

        return sql


    # -----------------------------------------------------
    # POSTGRESQL
    # -----------------------------------------------------

    if DBMS in ("postgres", "postgresql"):

        return f"""
            SELECT
                column_name,
                data_type
            FROM information_schema.columns
            WHERE table_name = '{table}'
            ORDER BY ordinal_position
        """


    # -----------------------------------------------------
    # SQL SERVER
    # -----------------------------------------------------

    if DBMS in ("sqlserver", "mssql"):

        return f"""
            SELECT
                COLUMN_NAME,
                DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '{table}'
            ORDER BY ORDINAL_POSITION
        """


    return sql


# =========================================================
# PAGINATION
# =========================================================

def translate_pagination(sql):

    if DBMS not in ("sqlserver", "mssql"):
        return sql

    # Current application:
    #
    # SELECT *
    # FROM SalesInventory
    # LIMIT %s OFFSET %s
    #
    # After parameter normalization:
    #
    # LIMIT ? OFFSET ?
    #
    # SQL Server needs:
    #
    # ORDER BY ...
    # OFFSET ? ROWS
    # FETCH NEXT ? ROWS ONLY
    #
    # This endpoint will be handled separately in app.py.
    #
    # Therefore don't automatically modify it here.

    return sql