
import os

game_file = r'c:\Users\user\Desktop\책자\boardgame\games-data.js'
search_term = '스위트랜드'

try:
    with open(game_file, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if search_term in line:
            print(f"Found at line {i+1}: {line.strip()}")
            # Print context
            start = max(0, i-5)
            end = min(len(lines), i+6)
            for j in range(start, end):
                print(f"{j+1}: {lines[j].strip()}")
            break
            
except Exception as e:
    print(f"Error: {e}")
