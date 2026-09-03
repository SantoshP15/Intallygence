from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    redirect,
    url_for,
    session
)

import re
import json

from database import connect, get_dbms

app = Flask(__name__)
app.secret_key = "your_secret_key_here"


def get_db_connection():
    return connect()


# =========================================================
# REPORT DATA SOURCES
# =========================================================

ALLOWED_REPORT_SOURCES = {
    "SalesInventory",
    "PurchaseInventory"
}


def validate_data_source(data_source):
    if data_source not in ALLOWED_REPORT_SOURCES:
        raise ValueError("Invalid report data source.")
    return data_source

# =========================================================
# REPORT DASHBOARD
# =========================================================

@app.route("/report-dashboard")
def report_dashboard():

    if "user" not in session:

        return redirect(
            url_for("splash")
        )

    return render_template(
        "report-dashboard.html"
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
        (
            username,
            password
        )
    )

    user = cursor.fetchone()

    cursor.close()
    db.close()

    if user:

        session["user"] = user["username"]

        return redirect(url_for("report_dashboard"))

    return redirect("/#login")

    # return render_template(
    #     # "splash.html",
    #     "/#login",
    #     error="Invalid username or password."
    # )


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return redirect(url_for("splash"))

@app.route("/dashboard")
def home():

    page = request.args.get("page", 1, type=int)

    per_page = 10
    offset = (page - 1) * per_page

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS total FROM SalesInventory")
    total = cursor.fetchone()["total"]

    if get_dbms() == "sqlserver":

        cursor.execute(
            """
            SELECT *
            FROM SalesInventory
            ORDER BY (SELECT NULL)
            OFFSET ? ROWS
            FETCH NEXT ? ROWS ONLY
            """,
            (
                offset,
            per_page
            )
        )

    else:

        cursor.execute(
            """
            SELECT *
            FROM SalesInventory
            LIMIT %s OFFSET %s
            """,
            (
                per_page,
                offset
            )
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

    cursor.execute("SHOW COLUMNS FROM SalesInventory")

    column_info = cursor.fetchall()

    columns = []

    date_columns = []

    column_types = {}

    # MANUAL_DATE_COLUMNS = {
    #     "Invoice Date",
    #     "Document Date"
    # }

    for col in column_info:

        column_name = col[0]

        column_type = col[1].lower()

        columns.append(column_name)

        # Store datatype for JavaScript
        column_types[column_name] = column_type

        if (
            "date" in column_type
            or "time" in column_type
            # or column_name in MANUAL_DATE_COLUMNS
        ):
            date_columns.append(column_name)

    cursor.close()
    db.close()

    return render_template(
        "pivot.html",
        columns=columns,
        date_columns=date_columns,
        column_types=column_types
    )

@app.route("/generate-pivot", methods=["POST"])
def generate_pivot():

    config = request.get_json() or {}

    try:

        # ============================================
        # GET DATA SOURCE
        # ============================================

        data_source = validate_data_source(
            config.get("dataSource", "SalesInventory")
        )
        config["dataSource"] = data_source

        # ============================================
        # GET SELECTED LAYOUT
        # ============================================

        layout = config.get("layout")


        # ============================================
        # LAYOUT IS REQUIRED
        # ============================================

        if not layout:

            return jsonify({
                "error": "Please select a layout."
            }), 400


        # ============================================
        # BUILD QUERY ACCORDING TO LAYOUT
        # ============================================

        if layout == "pivot":

            sql = build_pivot_query(config, data_source)

        else:

            sql = build_query(config, data_source)


        # ============================================
        # VALIDATE QUERY
        # ============================================

        if sql is None:

            return jsonify({
                "error":
                    "Please select at least one Row "
                    "and one Value."
            }), 400


        # ============================================
        # PRINT DEBUG INFORMATION
        # ============================================

        print("=================================")

        print("SELECTED LAYOUT:")
        print(layout)

        print("=================================")

        print("GENERATED SQL:")
        print(sql)

        print("=================================")


        # ============================================
        # EXECUTE QUERY
        # ============================================

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )


        cursor.execute(sql)

        data = cursor.fetchall()


        # ============================================
        # GET COLUMN NAMES
        # ============================================

        columns = [
            desc[0]
            for desc in cursor.description
        ]


        # ============================================
        # CLOSE DATABASE
        # ============================================

        cursor.close()

        db.close()


        # ============================================
        # DEBUG CONFIG
        # ============================================

        print("CONFIG:")

        print(config)

        print("=================================")


        # ============================================
        # RETURN RESULT
        # ============================================

        return jsonify({

            "columns": columns,

            "data": data,

            "layout": layout

        })


    except Exception as e:

        err_msg = str(e)
        if "1117" in err_msg or "Too many columns" in err_msg:
            err_msg = (
                "Too many columns generated for the pivot table. "
                "Please apply filters to reduce your dataset or select a column field with fewer unique values (e.g., Month, Category, Status)."
            )
                
        print("=================================")

        print("GENERATE REPORT ERROR:")

        print(str(e))

        print("=================================")


        return jsonify({

            "error": err_msg

        }), 500
        
        
        
@app.route("/save-report", methods=["POST"])
def save_report():

    if "user" not in session:
        return jsonify({
            "error": "Not logged in"
        }), 401

    data = request.get_json()

    report_name = data.get("report_name", "").strip()
    config = data.get("config")

    if not report_name:
        return jsonify({
            "error": "Report name is required"
        }), 400

    if not config:
        return jsonify({
            "error": "Report configuration is missing"
        }), 400


    db = get_db_connection()
    cursor = db.cursor()


    # =================================
    # CHECK DUPLICATE REPORT NAME
    # =================================

    cursor.execute(
        """
        SELECT id
        FROM SavedReports
        WHERE username = %s
          AND report_name = %s
        """,
        (
            session["user"],
            report_name
        )
    )

    existing = cursor.fetchone()


    if existing:

        cursor.close()
        db.close()

        return jsonify({
            "success": False,
            "error": "A report with this name already exists."
        }), 409


    # =================================
    # SAVE REPORT
    # =================================

    cursor.execute(
        """
        INSERT INTO SavedReports
        (
            username,
            report_name,
            report_config
        )
        VALUES (%s, %s, %s)
        """,
        (
            session["user"],
            report_name,
            json.dumps(config)
        )
    )

    db.commit()

    cursor.close()
    db.close()


    return jsonify({
        "success": True,
        "message": "Report saved successfully"
    })

@app.route("/saved-reports")
def saved_reports():

    if "user" not in session:
        return jsonify([]), 401


    db = get_db_connection()
    cursor = db.cursor(dictionary=True)


    cursor.execute(
        """
        SELECT
            id,
            report_name,
            created_at
        FROM SavedReports
        WHERE username = %s
        ORDER BY created_at DESC
        """,
        (session["user"],)
    )


    reports = cursor.fetchall()


    cursor.close()
    db.close()


    return jsonify(reports)

@app.route("/saved-report/<int:report_id>")
def get_saved_report(report_id):

    if "user" not in session:
        return jsonify({
            "error": "Not logged in"
        }), 401


    db = get_db_connection()
    cursor = db.cursor(dictionary=True)


    cursor.execute(
        """
        SELECT
            id,
            report_name,
            report_config
        FROM SavedReports
        WHERE id = %s
        AND username = %s
        """,
        (
            report_id,
            session["user"]
        )
    )


    report = cursor.fetchone()


    cursor.close()
    db.close()


    if not report:

        return jsonify({
            "error": "Report not found"
        }), 404


    report["report_config"] = json.loads(
        report["report_config"]
    )


    return jsonify(report)

@app.route("/delete-saved-report/<int:report_id>", methods=["DELETE"])
def delete_saved_report(report_id):

    if "user" not in session:
        return jsonify({
            "error": "Not logged in"
        }), 401


    db = get_db_connection()
    cursor = db.cursor()


    cursor.execute(
        """
        DELETE FROM SavedReports
        WHERE id = %s
        AND username = %s
        """,
        (
            report_id,
            session["user"]
        )
    )


    db.commit()


    cursor.close()
    db.close()


    return jsonify({
        "success": True
    })



@app.route("/report-columns/<path:table_name>")
def report_columns(table_name):

    if "user" not in session:
        return jsonify({"error": "Not logged in"}), 401

    try:
        data_source = validate_data_source(table_name)

        db = get_db_connection()
        cursor = db.cursor()
        cursor.execute(f"SHOW COLUMNS FROM {data_source}")
        column_info = cursor.fetchall()

        columns = []
        date_columns = []
        column_types = {}

        for col in column_info:
            column_name = col[0]
            column_type = str(col[1]).lower()
            columns.append(column_name)
            column_types[column_name] = column_type

            if "date" in column_type or "time" in column_type:
                date_columns.append(column_name)

        cursor.close()
        db.close()

        return jsonify({
            "dataSource": data_source,
            "columns": columns,
            "date_columns": date_columns,
            "column_types": column_types
        })

    except Exception as e:
        print("REPORT COLUMNS ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/filter-values/<path:column>")
def filter_values(column):

    if "user" not in session:
        return jsonify([])

    try:
        data_source = validate_data_source(
            request.args.get("table", "SalesInventory")
        )
    except ValueError:
        return jsonify([])

    db = get_db_connection()
    cursor = db.cursor()


    cursor.execute(
        f"SHOW COLUMNS FROM {data_source}"
    )

    valid_columns = {
        row[0]
        for row in cursor.fetchall()
    }


    if column not in valid_columns:

        cursor.close()
        db.close()

        return jsonify([])


    if get_dbms() == "mysql":

        quoted = f"`{column}`"

    elif get_dbms() in (
        "postgres",
        "postgresql"
    ):

        quoted = f'"{column}"'

    else:

        quoted = f'[{column}]'


    query = f"""
        SELECT DISTINCT
            {quoted}
        FROM {data_source}
        WHERE {quoted} IS NOT NULL
        ORDER BY {quoted}
    """


    cursor.execute(query)

    values = [
        row[0]
        for row in cursor.fetchall()
    ]


    cursor.close()
    db.close()


    return jsonify(values)

from collections import defaultdict


@app.route("/date-hierarchy/<column>")
def date_hierarchy(column):

    if "user" not in session:
        return jsonify({})

    try:
        data_source = validate_data_source(
            request.args.get("table", "SalesInventory")
        )
    except ValueError:
        return jsonify({})

    db = get_db_connection()
    cursor = db.cursor()


    try:

        # =================================================
        # GET VALID COLUMNS
        # =================================================

        cursor.execute(
            f"SHOW COLUMNS FROM {data_source}"
        )

        column_info = cursor.fetchall()

        valid_columns = {
            row[0]
            for row in column_info
        }


        # =================================================
        # VALIDATE COLUMN
        # =================================================

        if column not in valid_columns:

            return jsonify({})


        # =================================================
        # QUOTE COLUMN ACCORDING TO DBMS
        # =================================================

        dbms = get_dbms()


        if dbms == "mysql":

            quoted_column = f"`{column}`"


        elif dbms in (
            "postgres",
            "postgresql"
        ):

            quoted_column = f'"{column}"'


        elif dbms in (
            "sqlserver",
            "mssql"
        ):

            quoted_column = f'[{column}]'


        else:

            raise ValueError(
                f"Unsupported DBMS: {dbms}"
            )


        # =================================================
        # GET DISTINCT DATES
        #
        # IMPORTANT:
        # We don't use YEAR(), MONTH(), MONTHNAME()
        # or DAY() here.
        #
        # Python handles the date hierarchy.
        # This makes this endpoint DBMS-independent.
        # =================================================

        query = f"""
            SELECT DISTINCT
                {quoted_column}
            FROM {data_source}
            WHERE {quoted_column} IS NOT NULL
            ORDER BY {quoted_column}
        """


        cursor.execute(query)

        rows = cursor.fetchall()


        # =================================================
        # BUILD HIERARCHY
        # =================================================

        hierarchy = {}


        for row in rows:

            full_date = row[0]


            if full_date is None:
                continue


            # -------------------------------------------------
            # Convert date/datetime/string to YYYY-MM-DD
            # -------------------------------------------------

            if hasattr(full_date, "year"):

                year = str(full_date.year)

                month_number = full_date.month

                month_name = full_date.strftime("%B")

                date_string = full_date.strftime(
                    "%Y-%m-%d"
                )


            else:

                date_string = str(
                    full_date
                )[:10]


                # Try to parse YYYY-MM-DD

                try:

                    from datetime import datetime

                    parsed_date = datetime.strptime(
                        date_string,
                        "%Y-%m-%d"
                    )

                    year = str(
                        parsed_date.year
                    )

                    month_number = (
                        parsed_date.month
                    )

                    month_name = (
                        parsed_date.strftime("%B")
                    )


                except ValueError:

                    continue


            # -------------------------------------------------
            # Create Year
            # -------------------------------------------------

            if year not in hierarchy:

                hierarchy[year] = {}


            # -------------------------------------------------
            # Create Month
            # -------------------------------------------------

            if month_name not in hierarchy[year]:

                hierarchy[year][month_name] = []


            # -------------------------------------------------
            # Add Date
            # -------------------------------------------------

            hierarchy[year][month_name].append(
                date_string
            )


        return jsonify(hierarchy)


    except Exception as e:

        print(
            "DATE HIERARCHY ERROR:",
            str(e)
        )

        return jsonify({
            "error": str(e)
        }), 500


    finally:

        cursor.close()
        db.close()

def build_query(config, data_source):

    rows = config.get("rows", [])
    columns = config.get("columns", [])
    values = config.get("values", [])
    filters = config.get("filters", [])
    layout = config.get("layout", "tabular")

    if not rows or not values:
        return None

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(f"SHOW COLUMNS FROM {data_source}")
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
            FROM {data_source}
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
    FROM {data_source}
    {where_sql}
    GROUP BY
        {",".join(group_clause)}
    """

    cursor.close()
    db.close()

    return sql
def build_pivot_query(config, data_source):

    rows = config.get("rows", [])
    columns = config.get("columns", [])
    values = config.get("values", [])
    filters = config.get("filters", [])

    if not rows or not values:
        return None

    # =====================================================
    # DATABASE
    # =====================================================

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        f"SHOW COLUMNS FROM {data_source}"
    )

    valid_columns = {
        row[0]
        for row in cursor.fetchall()
    }

    # =====================================================
    # VALIDATION
    # =====================================================

    for col in rows:

        if col not in valid_columns:

            cursor.close()
            db.close()

            raise ValueError(
                f"Invalid Row: {col}"
            )

    for col in columns:

        if col not in valid_columns:

            cursor.close()
            db.close()

            raise ValueError(
                f"Invalid Column: {col}"
            )

    allowed_functions = {
        "SUM",
        "COUNT",
        "AVG",
        "MIN",
        "MAX"
    }

    for value in values:

        field = value.get("field")
        aggregate = value.get("aggregate")

        if field not in valid_columns:

            cursor.close()
            db.close()

            raise ValueError(
                f"Invalid Value: {field}"
            )

        if aggregate not in allowed_functions:

            cursor.close()
            db.close()

            raise ValueError(
                f"Invalid Aggregate: {aggregate}"
            )

    # =====================================================
    # WHERE CLAUSE
    # =====================================================

    where_clause = []

    from datetime import datetime

    for f in filters:

        field = f.get("field")

        if field not in valid_columns:
            continue

        # =================================================
        # SELECTED DATE VALUES
        # =================================================

        selected_dates = f.get(
            "selectedDates",
            []
        )

        if selected_dates:

            escaped_dates = []

            for d in selected_dates:

                escaped_dates.append(
                    "'" +
                    str(d).replace(
                        "'",
                        "''"
                    ) +
                    "'"
                )

            where_clause.append(
                f"""
                `{field}` IN (
                    {",".join(escaped_dates)}
                )
                """
            )

            continue

        # =================================================
        # DATE RANGE
        # =================================================

        from_date = f.get("from")
        to_date = f.get("to")

        if from_date and to_date:

            where_clause.append(
                f"""
                `{field}` BETWEEN
                '{str(from_date).replace("'", "''")}'
                AND
                '{str(to_date).replace("'", "''")}'
                """
            )

            continue

        # =================================================
        # NORMAL FILTER
        # =================================================

        filter_values = f.get(
            "values",
            []
        )

        if not filter_values:
            continue

        escaped = []

        for v in filter_values:

            try:

                v = datetime.strptime(
                    str(v),
                    "%d-%b-%y"
                ).strftime(
                    "%Y-%m-%d"
                )

            except ValueError:
                pass

            escaped.append(
                "'" +
                str(v).replace(
                    "'",
                    "''"
                ) +
                "'"
            )

        where_clause.append(
            f"""
            `{field}` IN (
                {",".join(escaped)}
            )
            """
        )

    # =====================================================
    # WHERE SQL
    # =====================================================

    where_sql = ""

    if where_clause:

        where_sql = (
            "WHERE "
            +
            " AND ".join(where_clause)
        )

    # =====================================================
    # SELECT - ROWS
    # =====================================================

    select_clause = []

    group_clause = []

    for row in rows:

        select_clause.append(
            f"`{row}`"
        )

        group_clause.append(
            f"`{row}`"
        )

    # =====================================================
    # NO COLUMNS
    # =====================================================

    if not columns:

        for value in values:

            field = value["field"]
            aggregate = value["aggregate"]

            safe_field = re.sub(
                r'[^A-Za-z0-9_]',
                '_',
                field
            )

            if aggregate == "COUNT":

                select_clause.append(
                    f"""
                    COUNT(`{field}`)
                    AS `{aggregate}_{safe_field}`
                    """
                )

            else:

                select_clause.append(
                    f"""
                    {aggregate}(`{field}`)
                    AS `{aggregate}_{safe_field}`
                    """
                )

    # =====================================================
    # MULTI-COLUMN PIVOT
    # =====================================================

    else:

        # -------------------------------------------------
        # IMPORTANT:
        # Apply the filters BEFORE finding pivot values.
        # -------------------------------------------------

        cursor.execute(
            f"""
            SELECT DISTINCT
                {",".join(
                    f"`{col}`"
                    for col in columns
                )}

            FROM {data_source}

            {where_sql}

            ORDER BY
                {",".join(
                    f"`{col}`"
                    for col in columns
                )}
            """
        )

        pivot_combinations = cursor.fetchall()

        # -------------------------------------------------
        # CHECK MAXIMUM PIVOT COLUMNS (Prevent MySQL 1117 Error)
        # -------------------------------------------------

        MAX_PIVOT_COLUMNS = 500
        total_generated_columns = len(pivot_combinations) * len(values)

        if total_generated_columns > MAX_PIVOT_COLUMNS:
            cursor.close()
            db.close()
            raise ValueError(
                f"Too many columns ({total_generated_columns} combinations). "
                f"The selected Column field '{', '.join(columns)}' has too many unique values to build a pivot table. "
                f"Please apply filters or select a column with fewer unique values (e.g., Month, Category, Status)."
            )

        # -------------------------------------------------
        # CREATE ONE PIVOT AREA FOR EVERY COMBINATION
        # -------------------------------------------------

        for combination in pivot_combinations:

            # ---------------------------------------------
            # Build condition for this combination
            # ---------------------------------------------

            conditions = []

            display_parts = []

            alias_parts = []

            for index, col in enumerate(columns):

                value = combination[index]

                if value is None:

                    conditions.append(
                        f"`{col}` IS NULL"
                    )

                    display_parts.append(
                        "(Blank)"
                    )

                    alias_parts.append(
                        "Blank"
                    )

                else:

                    value_sql = str(
                        value
                    ).replace(
                        "'",
                        "''"
                    )

                    conditions.append(
                        f"""
                        `{col}` =
                        '{value_sql}'
                        """
                    )

                    display_parts.append(
                        str(value)
                    )

                    safe_value = re.sub(
                        r'[^A-Za-z0-9_]',
                        '_',
                        str(value)
                    )

                    alias_parts.append(
                        safe_value
                    )

            combination_condition = (
                " AND ".join(
                    conditions
                )
            )

            display_label = " | ".join(
                display_parts
            )

            alias_label = "__".join(
                alias_parts
            )

            # ---------------------------------------------
            # CREATE VALUE COLUMNS
            # ---------------------------------------------

            for value in values:

                field = value["field"]
                aggregate = value["aggregate"]

                safe_field = re.sub(
                    r'[^A-Za-z0-9_]',
                    '_',
                    field
                )

                # =========================================
                # COUNT
                # =========================================

                if aggregate == "COUNT":

                    expression = f"""
                    COUNT(
                        CASE
                            WHEN
                                {combination_condition}
                            THEN `{field}`
                        END
                    )
                    """

                # =========================================
                # SUM / AVG / MIN / MAX
                # =========================================

                else:

                    expression = f"""
                    {aggregate}(
                        CASE
                            WHEN
                                {combination_condition}
                            THEN `{field}`
                            ELSE NULL
                        END
                    )
                    """

                # -----------------------------------------
                # UNIQUE SQL ALIAS
                # -----------------------------------------

                sql_alias = (
                    f"PV__{alias_label}"
                    f"__{aggregate}"
                    f"__{safe_field}"
                )

                select_clause.append(
                    f"""
                    {expression}
                    AS `{sql_alias}`
                    """
                )

    # =====================================================
    # GROUP BY
    # =====================================================

    group_sql = ""

    if group_clause:

        group_sql = (
            "GROUP BY "
            +
            ",".join(group_clause)
        )

    # =====================================================
    # FINAL SQL
    # =====================================================

    sql = f"""
        SELECT

            {",".join(select_clause)}

        FROM {data_source}

        {where_sql}

        {group_sql}
    """

    cursor.close()
    db.close()

    return sql
if __name__ == "__main__":
    app.run(debug=True)
