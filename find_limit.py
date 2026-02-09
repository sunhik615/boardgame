
import os

with open(r'c:\Users\user\Desktop\책자\boardgame\games-data.js', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if '리미트' in line:
            print(f'Found at line {i}: {line.strip()}')
