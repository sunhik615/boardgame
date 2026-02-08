import json

with open(r'c:\Users\user\Desktop\책자\boardgame\games-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Strip 'const games = ' and ';'
json_str = content.replace('const games = ', '').rsplit(';', 1)[0].strip()

try:
    games = json.loads(json_str)
    missing_desc = []
    for game in games:
        if 'description' not in game or not game['description']:
            missing_desc.append(game['title'])
    
    if missing_desc:
        print(f"Games missing description: {', '.join(missing_desc)}")
    else:
        print("All games have descriptions.")
except Exception as e:
    print(f"Error parsing JSON: {e}")
