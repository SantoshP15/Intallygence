import requests
import sqlite3
import re
import xml.etree.ElementTree as ET

# -----------------------------
# XML Request
# -----------------------------
xml_request = """
<ENVELOPE>
    <HEADER>
        <VERSION>0</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>SalesInventoryDetails_coll</ID>
    </HEADER>
 
    <BODY>
        <DESC>
            <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
           </DESC>
    </BODY>
</ENVELOPE>
"""

# -----------------------------
# Get XML from Tally
# -----------------------------
response = requests.post(
    "http://localhost:9000",
    data=xml_request,
    headers={"Content-Type": "text/xml"}
)

# Remove invalid XML character references
xml_data = re.sub(r'&#\d+;', '', response.text)

# Parse XML
root = ET.fromstring(xml_data)

# -----------------------------
# SQLite Connection
# -----------------------------
conn = sqlite3.connect("tally.db")
cursor = conn.cursor()

# -----------------------------
# Create Table
# -----------------------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS Ledger(
    Name TEXT,
    Parent TEXT,
    OpeningBalance REAL,
    ClosingBalance REAL
)
""")

# Optional: clear old data
cursor.execute("DELETE FROM Ledger")

# -----------------------------
# Read XML and Insert
# -----------------------------
count = 0

for obj in root.iter("OBJECT"):

    name = obj.get("NAME", "")

    parent = ""
    opening = 0
    closing = 0

    parent_node = obj.find("PARENT")
    if parent_node is not None and parent_node.text:
        parent = parent_node.text.strip()

    opening_node = obj.find("OPENINGBALANCE")
    if opening_node is not None and opening_node.text:
        try:
            opening = float(opening_node.text)
        except:
            opening = 0

    closing_node = obj.find("CLOSINGBALANCE")
    if closing_node is not None and closing_node.text:
        try:
            closing = float(closing_node.text)
        except:
            closing = 0

    cursor.execute("""
        INSERT INTO Ledger
        (Name, Parent, OpeningBalance, ClosingBalance)
        VALUES (?, ?, ?, ?)
    """, (name, parent, opening, closing))

    count += 1

conn.commit()
conn.close()

print(f"{count} ledgers imported successfully!")