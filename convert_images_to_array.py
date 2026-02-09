import re

# Read the file
with open('games-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace "images": "filename.jpg" with "images": ["filename.jpg"]
# This regex finds the pattern and converts it to an array
pattern = r'"images":\s*"([^"]+)"'
replacement = r'"images": ["\1"]'

new_content = re.sub(pattern, replacement, content)

# Write back to the file
with open('games-data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully converted images property to array format!")
