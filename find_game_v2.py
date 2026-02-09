
import os

filepath = r'c:\Users\user\Desktop\책자\boardgame\games-data.js'

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f, 1):
        if '백로성 대결' in line:
            print(f"Line {i}: {line.strip()}")
        elif 'white-castle' in line.lower():
            print(f"Line {i}: {line.strip()} (found 'white-castle')")
