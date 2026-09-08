import json

file_path = r"D:\XboxGames\sales_details_list.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

print("JSON is valid")
print("Records:", len(data))