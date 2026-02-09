
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'games-data.js');
const fileContent = fs.readFileSync(filePath, 'utf8');
const games = eval(fileContent.replace('const games =', ''));

const targetTitles = ['캐시 어 캐치', '루핑루이 더블 어택'];

games.forEach(game => {
    if (targetTitles.includes(game.title)) {
        console.log(JSON.stringify(game, null, 2));
    }
});
