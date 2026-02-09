
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'games-data.js');

try {
    let data = fs.readFileSync(filePath, 'utf8');

    // Convert to CommonJS format for requiring
    // Remove "const games =" and replace with "module.exports ="
    // Also need to handle potential syntax issues if the file structure is complex
    // Assuming simple assignment based on previous view_file

    // Find the start of the array
    const startIdx = data.indexOf('[');
    if (startIdx === -1) throw new Error("Could not find array start");

    // Create a strict JSON-like string if possible, or just use eval/Function (risky but okay for local trusted file)
    // using module replacement is safer

    // We'll create a temporary file that exports the data
    const tempContent = 'module.exports = ' + data.substring(startIdx);
    // Note: games-data.js might have comments or other variable declarations. 
    // Ideally we just want the array.
    // Let's try to just substring from '[' to the end, but need to make sure valid JS.

    // Safer approach: Read file, find "const games = [...];" and eval just that part?
    // Or just make a temp file "temp_games.js" with `module.exports = ...`

    // The previous view_file showed `const games = [...]`
    // Let's replace `const games =` with `module.exports =` and try to require it.

    // Handle comments? require will handle JS comments.

    const jsContent = data.replace(/const\s+games\s*=\s*/, 'module.exports = ');

    const tempPath = path.join(__dirname, 'temp_check_images.js');
    fs.writeFileSync(tempPath, jsContent);

    try {
        const games = require(tempPath);

        const missing = games.filter(g => !g.images || g.images.length === 0);

        console.log(`Total Games: ${games.length}`);
        console.log(`Missing Images: ${missing.length}`);

        let mdContent = "# 이미지 누락 게임 목록\n\n";
        mdContent += `총 ${missing.length}개의 게임 이미지가 없습니다.\n`;
        mdContent += "이미지를 구해서 `assets/images/games` 폴더에 아래 ID 파일명으로 넣어주세요 (예: `yamatai.jpg`).\n\n";

        missing.forEach(g => {
            mdContent += `- [ ] **${g.title}** (ID: \`${g.id}\`)\n`;
        });

        fs.writeFileSync(path.join(__dirname, 'missing_images.md'), mdContent);
        console.log("missing_images.md created.");

    } catch (reqErr) {
        console.error("Require Failed:", reqErr.message);
    } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }

} catch (err) {
    console.error("Read File Failed:", err.message);
}
