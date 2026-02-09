
const fs = require('fs');
const path = require('path');

const gamesFile = path.join(__dirname, 'games-data.js');
const imagesDir = path.join(__dirname, 'assets', 'images', 'games');

// 1. Read existing games data
let fileContent = fs.readFileSync(gamesFile, 'utf8');

// Convert to loadable module
const tempFile = path.join(__dirname, 'temp_games_updater.js');
// Replace "const games =" with "module.exports =" to load data
const jsContent = fileContent.replace(/const\s+games\s*=\s*/, 'module.exports = ');
fs.writeFileSync(tempFile, jsContent);

try {
    const games = require(tempFile);

    // 2. Read available images
    if (!fs.existsSync(imagesDir)) {
        console.error(`Image directory not found: ${imagesDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(imagesDir);
    const imageMap = {}; // normalized_base -> filename

    // Helper to normalize strings for comparison
    const normalize = (str) => str.toLowerCase().replace(/[\s\-_]/g, '');

    files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
            const baseName = path.basename(file, path.extname(file)); // filename without ext
            imageMap[normalize(baseName)] = file;
        }
    });

    console.log(`Found ${files.length} files in images folder.`);

    // 3. Update games data
    let updatedCount = 0;

    games.forEach(game => {
        // Only update if no images defined or empty
        if (!game.images || game.images.length === 0) {
            const gameId = normalize(game.id);
            const gameTitle = normalize(game.title);

            // Check match by normalized ID first, then by normalized Title
            let matchedFile = imageMap[gameId] || imageMap[gameTitle];

            if (matchedFile) {
                game.images = [matchedFile];
                console.log(`[UPDATE] Linked image for ${game.title}: ${matchedFile}`);
                updatedCount++;
            }
        }
    });

    if (updatedCount === 0) {
        console.log("No new images linked. Make sure image filenames match Game IDs or Titles.");
    } else {
        console.log(`Successfully linked ${updatedCount} new images.`);

        // 4. Save back to file
        // We use JSON.stringify but need to preserve "const games =" prefix
        const newContent = `const games = ${JSON.stringify(games, null, 4)};`;
        fs.writeFileSync(gamesFile, newContent, 'utf8');
        console.log("games-data.js has been updated!");
    }

} catch (err) {
    console.error("Error processing data:", err);
} finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
}
