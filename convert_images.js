const fs = require('fs');

// Read the file
const content = fs.readFileSync('games-data.js', 'utf8');

// Replace "images": "filename.jpg" with "images": ["filename.jpg"]
const pattern = /"images":\s*"([^"]+)"/g;
const replacement = '"images": ["$1"]';

const newContent = content.replace(pattern, replacement);

// Write back to the file
fs.writeFileSync('games-data.js', newContent, 'utf8');

console.log("Successfully converted images property to array format!");
