// Utility to get URL parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Curated Gradients Palette (Modern & Vibrant)
const curatedGradients = [
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", // Purple to Pink
    "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)", // Soft Pink
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", // Pinky
    "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)", // Purple to Blue
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", // Aqua
    "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)", // Light Blue
    "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)", // Periwinkle
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // Vibrant Pink/Red
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Bright Blue
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Green/Teal
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", // Sunset
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Deep Purple
    "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)", // Sky Blue
    "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)", // Warm Light
    "linear-gradient(135deg, #9890e3 0%, #b1f4cf 100%)", // Purple to Green
    "linear-gradient(135deg, #ebc0fd 0%, #d9ded8 100%)", // Soft Violet
    "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)"  // Green to Yellow
];

// Generate consistent gradient from string (hashing to index)
function getGradient(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Ensure positive index
    const index = Math.abs(hash) % curatedGradients.length;
    return curatedGradients[index];
}


// Shared State
let currentGames = [];

// Main Execution
document.addEventListener('DOMContentLoaded', () => {
    // Load games data (already loaded via script tag as 'games')
    if (typeof games !== 'undefined') {
        currentGames = [...games]; // Copy
    }

    const gameListContainer = document.getElementById('game-list');
    const detailContainer = document.getElementById('game-detail');

    // Index Page
    if (gameListContainer) {
        initFilters();
        renderGameList(gameListContainer, currentGames);
    }

    // Detail Page
    if (detailContainer) {
        renderGameDetail();
    }
});


// --- Filtering Logic ---
function initFilters() {
    const filterPlayers = document.getElementById('filter-players');
    const filterTime = document.getElementById('filter-time');
    const filterDifficulty = document.getElementById('filter-difficulty');
    const btnReset = document.getElementById('btn-reset');
    const sortOrder = document.getElementById('sort-order');
    const searchInput = document.getElementById('search-input');

    const filterInputs = [filterPlayers, filterTime, filterDifficulty, sortOrder];

    // Event Listener for all changes
    filterInputs.forEach(input => {
        input.addEventListener('change', () => applyFilters());
    });

    // Search Input Listener (Real-time)
    if (searchInput) {
        searchInput.addEventListener('input', () => applyFilters());
    }

    // Reset Button
    btnReset.addEventListener('click', () => {
        filterPlayers.value = 'all';
        filterTime.value = 'all';
        filterDifficulty.value = 'all';
        sortOrder.value = 'name';
        if (searchInput) searchInput.value = '';
        applyFilters();
    });
}

function applyFilters() {
    const playersVal = document.getElementById('filter-players').value;
    const timeVal = document.getElementById('filter-time').value;
    const difficultyVal = document.getElementById('filter-difficulty').value;
    const sortVal = document.getElementById('sort-order').value;
    const searchVal = document.getElementById('search-input').value.toLowerCase().trim();

    let filtered = games.filter(game => {
        // 0. Search Filter
        if (searchVal) {
            if (!game.title.toLowerCase().includes(searchVal)) return false;
        }

        // 1. Players Filter
        if (playersVal !== 'all') {
            const p = parseInt(playersVal);
            if (playersVal === '5+') {
                if (game.maxPlayers < 5) return false;
            } else {
                if (p < game.minPlayers || p > game.maxPlayers) return false;
            }
        }

        // 2. Time Filter
        if (timeVal !== 'all') {
            const times = game.playTime.match(/\d+/g);
            if (!times) return true;
            const maxTime = Math.max(...times.map(Number));

            if (timeVal === '30') {
                if (maxTime > 30) return false;
            } else if (timeVal === '60') {
                if (maxTime > 60) return false;
            } else if (timeVal === 'over60') {
                if (maxTime <= 60) return false;
            }
        }

        // 3. Difficulty Filter
        if (difficultyVal !== 'all') {
            const diff = game.difficulty;
            if (difficultyVal === 'easy') {
                if (diff >= 2.0) return false;
            } else if (difficultyVal === 'normal') {
                if (diff < 2.0 || diff >= 3.0) return false;
            } else if (difficultyVal === 'hard') {
                if (diff < 3.0) return false;
            }
        }

        return true;
    });

    // 4. Sorting
    // Default to 'name' if sortVal is 'default' (though option removed, handle defensively) or 'name' or anything else
    if (sortVal === 'difficulty-asc') {
        filtered.sort((a, b) => a.difficulty - b.difficulty);
    } else if (sortVal === 'difficulty-desc') {
        filtered.sort((a, b) => b.difficulty - a.difficulty);
    } else {
        // Default: Name (Alphabetical)
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    const container = document.getElementById('game-list');
    renderGameList(container, filtered);
}


// --- Rendering Logic ---
function renderGameList(container, matches) {
    container.innerHTML = '';

    if (matches.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1;">조건에 맞는 게임이 없습니다.</p>';
        return;
    }

    matches.forEach(game => {
        const card = document.createElement('a');
        card.href = `detail.html?id=${game.id}`;
        card.className = 'card-link';

        // Generate dynamic gradient if no explicit CSS class (though we have imageClass, specific CSS might be missing)
        // We will assign the gradient inline for robustness given the user wiped styled classes
        const bgStyle = `background: ${getGradient(game.id)};`;

        card.innerHTML = `
            <article class="game-card">
                <div class="card-image" style="${bgStyle}">
                    <span>${game.icon}</span>
                </div>
                <div class="card-content">
                    <h2>${game.title}</h2>
                    <div class="meta-info">
                        <span class="badge players">👥 ${game.minPlayers}-${game.maxPlayers}인</span>
                        <span class="badge time">⏱️ ${game.playTime}</span>
                        <span class="badge difficulty">🔥 ${game.difficulty}/5</span>
                    </div>
                </div>
            </article>
        `;

        container.appendChild(card);
    });
}

function renderGameDetail() {
    const gameId = getQueryParam('id');
    const game = games.find(g => g.id === gameId);

    const detailContent = document.querySelector('.detail-content');

    // Check if ID exists
    if (!gameId || !game) {
        detailContent.innerHTML = '<h2>게임을 찾을 수 없습니다.</h2><p>메인 페이지로 돌아가주세요.</p>';
        document.querySelector('.hero-section').style.display = 'none'; // Hide hero
        return;
    }

    // Update Title
    document.title = `${game.title} - 내 보드게임 컬렉션`;

    // Hero Section
    const heroSection = document.querySelector('.hero-section');

    // Dynamic Background again
    heroSection.style.background = getGradient(game.id);

    document.getElementById('game-title').textContent = game.title;

    // Genre & Mechanism
    const genreEl = document.getElementById('game-genre');
    const mechEl = document.getElementById('game-mechanism');

    if (game.genre) {
        genreEl.textContent = `🏷️ ${game.genre}`;
        genreEl.style.display = 'inline-block';
    } else {
        genreEl.style.display = 'none';
    }

    if (game.mechanism) {
        mechEl.textContent = `⚙️ ${game.mechanism}`;
        mechEl.style.display = 'inline-block';
    } else {
        mechEl.style.display = 'none';
    }

    document.getElementById('game-players').textContent = `👥 ${game.minPlayers}-${game.maxPlayers}인`;
    document.getElementById('game-time').textContent = `⏱️ ${game.playTime}`;
    document.getElementById('game-difficulty').textContent = `🔥 ${game.difficulty}/5`;

    // Description
    const descEl = document.getElementById('game-description-text');
    if (descEl) {
        descEl.innerHTML = game.description;
    }

    // Expansion
    const expEl = document.getElementById('game-expansion');
    const expText = document.getElementById('game-expansion-text');

    if (game.expansion && expEl && expText) {
        expText.textContent = game.expansion;
        expEl.style.display = 'block';
    } else if (expEl) {
        expEl.style.display = 'none';
    }
}
