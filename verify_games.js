
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'games-data.js');
const fileContent = fs.readFileSync(filePath, 'utf8');
const games = eval(fileContent.replace('const games =', ''));

const targetTitles = ['7원더스 건축가들', '백로성 대결', '3초 트라이'];

games.forEach(game => {
    if (targetTitles.includes(game.title)) {
        console.log(JSON.stringify(game, null, 2));
    }
});
