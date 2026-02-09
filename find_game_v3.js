
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'games-data.js');
const fileContent = fs.readFileSync(filePath, 'utf8');
const lines = fileContent.split('\n');

lines.forEach((line, i) => {
    if (line.includes('백로성 대결')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
    if (line.toLowerCase().includes('white-castle')) {
        console.log(`Line ${i + 1}: ${line.trim()} (found 'white-castle')`);
    }
});
