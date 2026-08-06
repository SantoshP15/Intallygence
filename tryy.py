import sqlite3

conn = sqlite3.connect("tally.db")
cursor = conn.cursor()
cursor.execute("SELECT * FROM Ledger LIMIT 10")
columns = [col[0] for col in cursor.description]
rows = cursor.fetchall()
for row in rows:
    print("---------------------")
    for col, value in zip(columns, row):
        print(f"{col}: {value}")

conn.close()