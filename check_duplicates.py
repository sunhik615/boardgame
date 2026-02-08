import re

with open(r'c:\Users\user\Desktop\책자\boardgame\games-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

ids = re.findall(r'"id":\s*"([^"]+)"', content)
seen = set()
duplicates = set()

for game_id in ids:
    if game_id in seen:
        duplicates.add(game_id)
    seen.add(game_id)

if duplicates:
    print(f"Found duplicates: {', '.join(duplicates)}")
else:
    print("No duplicates found.")
