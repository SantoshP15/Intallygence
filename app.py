from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    redirect,
    url_for,
    session
)
import mysql.connector
import re

app = Flask(__name__)
app.secret_key = "your_secret_key_here"


def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="untitled09",
        database="untitled"
    )

@app.route("/")
def splash():
    error = request.args.get("error")
    return render_template("splash.html", error=error)

@app.route("/login", methods=["POST"])
def login():

    username = request.form["username"]
    password = request.form["password"]

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM users
        WHERE username=%s
        AND password=%s
        """,
        (username, password)
    )

    user = cursor.fetchone()

    cursor.close()
    db.close()

    if user:

        session["user"] = user["username"]

        return redirect(url_for("home"))

    return redirect("/#login")

    # return render_template(
    #     # "splash.html",
    #     "/#login",
    #     error="Invalid username or password."
    # )

@app.route("/dashboard")
def home():

    page = request.args.get("page", 1, type=int)

    per_page = 10
    offset = (page - 1) * per_page

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS total FROM SalesMaster")
    total = cursor.fetchone()["total"]

    cursor.execute(
        "SELECT * FROM SalesMaster LIMIT %s OFFSET %s",
        (per_page, offset)
    )

    data = cursor.fetchall()

    cursor.close()
    db.close()

    total_pages = (total + per_page - 1) // per_page

    return render_template(
        "index.html",
        data=data,
        page=page,
        total_pages=total_pages,
        total=total
    )


@app.route("/pivot")
def pivot():
    
    if "user" not in session:
        return redirect(url_for("splash"))

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("SHOW COLUMNS FROM SalesMaster")

    column_info = cursor.fetchall()

    columns = []

    date_columns = []
    MANUAL_DATE_COLUMNS = {
    "Invoice Date",
    "Document Date"
    }

    for col in column_info:

        column_name = col[0]

        column_type = col[1].lower()

        columns.append(column_name)

        if "date" in column_type or "time" in column_type or column_name in MANUAL_DATE_COLUMNS:

            date_columns.append(column_name)

    cursor.close()
    db.close()

    return render_template("pivot.html", columns=columns,date_columns=date_columns)


@app.route("/generate-pivot", methods=["POST"])
def generate_pivot():

    config = request.get_json()

    sql = build_query(config)

    if sql is None:
        return jsonify({
            "error": "Please select at least one Row and one Value."
        }), 400

    print(sql)

    db = get_db_connection()

    cursor = db.cursor(dictionary=True)

    cursor.execute(sql)

    data = cursor.fetchall()

    cursor.close()
    db.close()
    print(config)
    return jsonify({
    "columns": [desc[0] for desc in cursor.description],
    "data": data
    })

@app.route("/filter-values/<path:column>")
def filter_values(column):

    if "user" not in session:
        return jsonify([])

    db = get_db_connection()
    cursor = db.cursor()

    query = f"""
        SELECT DISTINCT `{column}`
        FROM SalesMaster
        WHERE `{column}` IS NOT NULL
        ORDER BY `{column}`
    """

    cursor.execute(query)

    values = [row[0] for row in cursor.fetchall()]

    cursor.close()
    db.close()

    return jsonify(values)

from collections import defaultdict


@app.route("/date-hierarchy/<path:column>")
def date_hierarchy(column):

    if "user" not in session:
        return jsonify({})

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    query = f"""
        SELECT DISTINCT
            `{column}` AS FullDate,
            YEAR(`{column}`) AS YearNo,
            MONTH(`{column}`) AS MonthNo,
            MONTH(`{column}`) AS MonthNo,
            MONTHNAME(`{column}`) AS MonthName,
            DAY(`{column}`) AS DayNo
        FROM SalesMaster
        WHERE `{column}` IS NOT NULL
        ORDER BY
            YEAR(`{column}`),
            MONTH(`{column}`),
            DAY(`{column}`)
    """

    cursor.execute(query)

    rows = cursor.fetchall()

    cursor.close()
    db.close()

    hierarchy = {}

    for row in rows:

        year = str(row["YearNo"])
        month = row["MonthName"]
        date = row["FullDate"].strftime("%Y-%m-%d")

        if year not in hierarchy:
            hierarchy[year] = {}

        if month not in hierarchy[year]:
            hierarchy[year][month] = []

        hierarchy[year][month].append(date)

    return jsonify(hierarchy)

def build_query(config):

    rows = config.get("rows", [])
    columns = config.get("columns", [])
    values = config.get("values", [])
    filters = config.get("filters", [])

    if not rows or not values:
        return None

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("SHOW COLUMNS FROM SalesMaster")
    valid_columns = {row[0] for row in cursor.fetchall()}

    # -------------------------
    # Validation
    # -------------------------

    for col in rows:
        if col not in valid_columns:
            raise ValueError(f"Invalid Row: {col}")

    for col in columns:
        if col not in valid_columns:
            raise ValueError(f"Invalid Column: {col}")

    allowed_functions = {"SUM", "COUNT", "AVG", "MIN", "MAX"}

    for value in values:

        if value["field"] not in valid_columns:
            raise ValueError("Invalid Value Column")

        if value["aggregate"] not in allowed_functions:
            raise ValueError("Invalid Aggregate")

    # -------------------------
    # SELECT
    # -------------------------

    select_clause = []
    group_clause = []

    for row in rows:

        select_clause.append(f"`{row}`")
        group_clause.append(f"`{row}`")

    # ==========================================================
    # NO COLUMN AREA
    # ==========================================================

    if len(columns) == 0:

        for value in values:

            agg = value["aggregate"]
            val_col = value["field"]

            safe_name = re.sub(r'[^A-Za-z0-9_]', '_', val_col)

            if agg == "COUNT":

                select_clause.append(
                    f"COUNT(DISTINCT `{val_col}`) AS `{agg}_{safe_name}`"
                )

            else:

                select_clause.append(
                    f"{agg}(`{val_col}`) AS `{agg}_{safe_name}`"
                )

    # ==========================================================
    # COLUMN AREA
    # ==========================================================

    else:

        pivot_column = columns[0]

        cursor.execute(f"""
            SELECT DISTINCT `{pivot_column}`
            FROM SalesMaster
            WHERE `{pivot_column}` IS NOT NULL
            ORDER BY `{pivot_column}`
        """)

        pivot_values = [row[0] for row in cursor.fetchall()]

        for pv in pivot_values:

            pv_sql = str(pv).replace("'", "''")

            pivot_alias = re.sub(
                r'[^A-Za-z0-9_]',
                '_',
                str(pv)
            )

            for value in values:

                agg = value["aggregate"]
                val_col = value["field"]

                safe_val = re.sub(
                    r'[^A-Za-z0-9_]',
                    '_',
                    val_col
                )

                select_clause.append(f"""
{agg}(
CASE
    WHEN `{pivot_column}` = '{pv_sql}'
    THEN `{val_col}`
    ELSE NULL
END
) AS `{pivot_alias}_{safe_val}`
""")

    # -------------------------
    # WHERE
    # -------------------------

    from datetime import datetime

    where_clause = []

    for f in filters:

        field = f["field"]

        if field not in valid_columns:
            continue
    # ======================================
# DATE HIERARCHY FILTER
# ======================================

        if f.get("selectedDates"):

            selected = []

            for d in f["selectedDates"]:

                selected.append("'" + str(d).replace("'", "''") + "'")

            where_clause.append(
                f"`{field}` IN ({','.join(selected)})"
            )

            continue    
            # ======================================
            # DATE RANGE FILTER
            # ======================================

        if f.get("from") and f.get("to"):

            from_date = f["from"]
            to_date = f["to"]

            where_clause.append(
                f"`{field}` BETWEEN '{from_date}' AND '{to_date}'"
            )

            continue

    # ======================================
    # NORMAL FILTERS
    # ======================================

        filter_values = f.get("values", [])

        if not filter_values:
            continue

        escaped = []

        for v in filter_values:

            try:
                v = datetime.strptime(str(v), "%d-%b-%y").strftime("%Y-%m-%d")
            except ValueError:
                pass

            escaped.append("'" + str(v).replace("'", "''") + "'")

        where_clause.append(
            f"`{field}` IN ({','.join(escaped)})"
        )
    
    # -------------------------
    # BUILD WHERE SQL
    # -------------------------

    where_sql = ""

    if where_clause:

        where_sql = "WHERE " + " AND ".join(where_clause)
    # -------------------------
    # FINAL SQL
    # -------------------------

    sql = f"""
    SELECT
        {",".join(select_clause)}
    FROM SalesMaster
    {where_sql}
    GROUP BY
        {",".join(group_clause)}
    """

    cursor.close()
    db.close()

    return sql

if __name__ == "__main__":
    app.run(debug=True)