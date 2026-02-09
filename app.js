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

// Fisher-Yates Shuffle Utility
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// Shared State
let currentGames = [];
let currentSlideIndex = 0;
let filteredGames = [];
let isSearchActive = false;
let wishlist = new Set();

// LocalStorage Utils
const WISHLIST_KEY = 'boardgame_wishlist';
function loadWishlist() {
    // 1. Check URL parameters first for shared wishlist
    const urlParams = new URLSearchParams(window.location.search);
    const sharedWished = urlParams.get('wished');

    if (sharedWished) {
        try {
            const arr = sharedWished.split(',').filter(id => id.trim() !== '');
            wishlist = new Set(arr);
            // Save to local storage so it persists for this user too
            saveWishlist();
            // Clear URL to prevent re-loading same shared list on refresh if they toggle items
            // window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
            console.error('Failed to parse shared wishlist', e);
        }
    } else {
        // 2. Otherwise load from local storage
        const saved = localStorage.getItem(WISHLIST_KEY);
        if (saved) {
            try {
                const arr = JSON.parse(saved);
                wishlist = new Set(arr);
            } catch (e) {
                console.error('Failed to load wishlist', e);
            }
        }
    }
}

function saveWishlist() {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(Array.from(wishlist)));
}

function toggleWishlist(gameId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (wishlist.has(gameId)) {
        wishlist.delete(gameId);
    } else {
        wishlist.add(gameId);
    }
    saveWishlist();

    // For the new Badge UI, we re-render the card simplest by re-applying filters or re-rendering list
    // This ensures badges and overlays update correctly
    const gameList = document.getElementById('game-list');
    if (gameList && gameList.children.length > 0) {
        renderGameList(gameList, filteredGames, isSearchActive);
    }
    const bazaarGrid = document.querySelector('.bazaar-grid');
    if (bazaarGrid) {
        renderImageBazaar(bazaarGrid, currentGames);
    }

    // If "Wishlist Only" filter is active, we might need to re-render everything
    const wishlistFilter = document.getElementById('filter-wishlist');
    if (wishlistFilter && wishlistFilter.checked) {
        applyFilters();
    }
}

function copyWishlistLink() {
    if (wishlist.size === 0) {
        alert('찜한 게임이 없습니다. 먼저 별을 눌러 게임을 추가해 주세요!');
        return;
    }

    const ids = Array.from(wishlist).join(',');
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?wished=${ids}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        const btn = document.getElementById('btn-share-wishlist');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ 복사 완료!';
        btn.classList.add('success');

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('success');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy', err);
        alert('링크 복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.');
    });
}

// Main Execution
document.addEventListener('DOMContentLoaded', () => {
    // Load games data (already loaded via script tag as 'games')
    if (typeof games !== 'undefined') {
        currentGames = shuffleArray([...games]); // Shuffle on load
    }

    loadWishlist();

    const gameListContainer = document.getElementById('game-list');
    const detailContainer = document.getElementById('game-detail');

    // Index Page
    if (gameListContainer) {
        initFilters();
        initSlideCarousel();
        applyFilters(); // Initial render and count update
    }

    // Detail Page
    if (detailContainer) {
        renderGameDetail();
    }

    // Scroll-to-Top FAB Logic
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});


// --- Filtering Logic ---
// --- Filtering Logic ---
function initFilters() {
    const filterPlayers = document.getElementById('filter-players');
    const filterGenre = document.getElementById('filter-genre');
    const filterTime = document.getElementById('filter-time');
    const filterDifficulty = document.getElementById('filter-difficulty');
    const btnReset = document.getElementById('btn-reset');
    const sortOrder = document.getElementById('sort-order');
    const searchInput = document.getElementById('search-input');
    const filterWishlist = document.getElementById('filter-wishlist');
    const mobileToggle = document.getElementById('mobile-filter-toggle');

    // Populate Genre Options Dynamically
    if (filterGenre && typeof games !== 'undefined') {
        const genres = new Set();
        games.forEach(game => {
            if (game.genre) {
                // Split by comma if multiple genres exist? Assuming single string based on data
                genres.add(game.genre);
            }
        });

        // Sort genres alphabetically
        const sortedGenres = Array.from(genres).sort();

        sortedGenres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            filterGenre.appendChild(option);
        });
    }

    // Mobile Toggle Listener
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            const container = document.querySelector('.filter-container');
            container.classList.toggle('expanded');
        });
    }

    const filterInputs = [filterPlayers, filterGenre, filterTime, filterDifficulty, sortOrder, filterWishlist];

    // Event Listener for all changes
    filterInputs.forEach(input => {
        if (input) {
            input.addEventListener('change', () => applyFilters());
        }
    });

    // Search Input Listener (Real-time)
    if (searchInput) {
        searchInput.addEventListener('input', () => applyFilters());
    }

    // Reset Button
    const resetLogic = () => {
        if (filterPlayers) filterPlayers.value = 'all';
        if (filterGenre) filterGenre.value = 'all';
        if (filterTime) filterTime.value = 'all';
        if (filterDifficulty) filterDifficulty.value = 'all';
        if (sortOrder) sortOrder.value = 'random';
        if (searchInput) searchInput.value = '';
        if (filterWishlist) filterWishlist.checked = false;
        currentSlideIndex = 0; // Will be recalcuated in applyFilters
        applyFilters();
    };

    if (btnReset) {
        btnReset.addEventListener('click', resetLogic);
    }

    // Header Title Click to Reset
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.style.cursor = 'pointer'; // Make it look clickable
        headerTitle.addEventListener('click', resetLogic);
    }
}

function applyFilters() {
    const playersVal = document.getElementById('filter-players') ? document.getElementById('filter-players').value : 'all';
    const genreVal = document.getElementById('filter-genre') ? document.getElementById('filter-genre').value : 'all';
    const timeVal = document.getElementById('filter-time') ? document.getElementById('filter-time').value : 'all';
    const difficultyVal = document.getElementById('filter-difficulty') ? document.getElementById('filter-difficulty').value : 'all';
    const sortVal = document.getElementById('sort-order') ? document.getElementById('sort-order').value : 'random';
    const filterWishlist = document.getElementById('filter-wishlist');
    const wishlistOnly = filterWishlist ? filterWishlist.checked : false;
    const searchInput = document.getElementById('search-input');
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filtered = currentGames.filter(game => {
        // -1. Wishlist Filter
        if (wishlistOnly && !wishlist.has(game.id)) return false;

        // 0. Search Filter
        if (searchVal) {
            if (!game.title.toLowerCase().includes(searchVal)) return false;
        }

        // 1. Players Filter
        if (playersVal !== 'all') {
            if (playersVal === '7+') {
                // 7 or more players (maxPlayers >= 7)
                if (game.maxPlayers < 7) return false;
            } else {
                const p = parseInt(playersVal);
                // Check if p is within the range [min, max]
                if (p < game.minPlayers || p > game.maxPlayers) return false;
            }
        }

        // 2. Genre Filter
        if (genreVal !== 'all') {
            if (game.genre !== genreVal) return false;
        }

        // 3. Time Filter
        if (timeVal !== 'all') {
            const times = game.playTime.match(/\d+/g);
            if (!times) return true; // Keep if format unknown
            const maxTime = Math.max(...times.map(Number));

            if (timeVal === '30') {
                if (maxTime > 30) return false;
            } else if (timeVal === '60') {
                if (maxTime > 60) return false;
            } else if (timeVal === 'over60') {
                if (maxTime <= 60) return false;
            }
        }

        // 4. Difficulty Filter
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

    // 5. Sorting
    filtered.sort((a, b) => {
        // Search relevance priority: Titles starting with the search term come first
        if (searchVal) {
            const aStart = a.title.toLowerCase().startsWith(searchVal);
            const bStart = b.title.toLowerCase().startsWith(searchVal);
            if (aStart && !bStart) return -1;
            if (!aStart && bStart) return 1;
        }

        if (sortVal === 'difficulty-asc') {
            return a.difficulty - b.difficulty || 0;
        } else if (sortVal === 'difficulty-desc') {
            return b.difficulty - a.difficulty || 0;
        } else if (sortVal === 'random') {
            return 0; // Preserve shuffled order
        } else {
            // Default: Name (Alphabetical)
            return a.title.localeCompare(b.title);
        }
    });

    const isFilterActive = !!(searchVal || playersVal !== 'all' || genreVal !== 'all' || timeVal !== 'all' || difficultyVal !== 'all' || wishlistOnly);
    isSearchActive = isFilterActive; // Store in global state
    const container = document.getElementById('game-list');
    const bazaarContainer = document.getElementById('image-bazaar');

    if (container) {
        renderGameList(container, filtered, isFilterActive);
    }

    if (bazaarContainer) {
        renderImageBazaar(bazaarContainer, filtered);
    }

    // Update results count display
    const resultsCountEl = document.getElementById('results-count');
    if (resultsCountEl && typeof games !== 'undefined') {
        const total = games.length;
        const count = filtered.length;

        if (isFilterActive) {
            resultsCountEl.textContent = `${total}개 중에 ${count}개를 찾았습니다.`;
        } else {
            resultsCountEl.textContent = `총 ${total}개 보유중입니다.`;
        }
    }
}

// --- Image Bazaar (Grid View) Logic ---
function renderImageBazaar(container, matches) {
    container.innerHTML = '';

    // Filter only those that HAVE images
    const gamesWithImages = matches.filter(game => {
        const gameImg = game.image || game.images;
        return Array.isArray(gameImg) ? gameImg.length > 0 : !!gameImg;
    });

    // Always sort Bazaar (Grid View) by Name
    gamesWithImages.sort((a, b) => a.title.localeCompare(b.title));

    if (gamesWithImages.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1; opacity:0.6;">이미지가 있는 게임이 없습니다.</p>';
        return;
    }

    gamesWithImages.forEach(game => {
        const gameImages = game.image || game.images;
        const img = Array.isArray(gameImages) ? gameImages[0] : gameImages;
        const imgSrc = img.includes('/') ? `assets/images/${img}` : `assets/images/games/${img}`;

        const card = document.createElement('a');
        card.href = `detail.html?id=${game.id}`;
        card.className = 'bazaar-card';
        card.innerHTML = `
            <div class="bazaar-img-container">
                <img src="${imgSrc}" alt="${game.title}" class="bazaar-img" loading="lazy">
                ${wishlist.has(game.id) ? '<span class="bazaar-badge">찜</span>' : ''}
            </div>
            <div class="bazaar-info">
                <h3>${game.title}</h3>
            </div>
        `;
        container.appendChild(card);
    });
}


// --- Rendering Logic ---
// --- Rendering Logic (Optimized Windowing) ---
function renderGameList(container, matches, isSearchActive) {
    container.innerHTML = '';
    filteredGames = matches;

    // Handle index: 
    // 1. If filtering/searching, reset to first card
    // 2. If initial load (not filtering) and index is 0, start from middle
    if (isSearchActive) {
        currentSlideIndex = 0;
    } else if (currentSlideIndex === 0 && matches.length > 0) {
        currentSlideIndex = Math.floor(matches.length / 2);
    }

    if (matches.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1;">조건에 맞는 게임이 없습니다.</p>';
        updateSlideControls();
        updateSlideIndicators();
        return;
    }

    // Instead of creating ALL elements, we'll create them as needed.
    // For initial render, we only need the first few.
    updateSlideDisplay();
    updateSlideControls();
    updateSlideIndicators();
}

function updateSlideDisplay() {
    const container = document.getElementById('game-list');
    if (!container || filteredGames.length === 0) return;

    // Windowing: Render current, and +/- 5 cards around it.
    const windowSize = 5;
    const start = Math.max(0, currentSlideIndex - windowSize);
    const end = Math.min(filteredGames.length - 1, currentSlideIndex + windowSize);

    // Identify which IDs should be in DOM
    const targetIds = new Set();
    for (let i = start; i <= end; i++) {
        targetIds.add(filteredGames[i].id);
    }

    // Remove cards no longer in window
    const existingCards = container.querySelectorAll('.card-link');
    existingCards.forEach(card => {
        const id = card.getAttribute('data-id');
        if (!targetIds.has(id)) {
            card.remove();
        }
    });

    // Add or Update cards in window
    for (let i = start; i <= end; i++) {
        const game = filteredGames[i];
        let card = container.querySelector(`.card-link[data-id="${game.id}"]`);

        if (!card) {
            card = createGameCard(game);
            card.setAttribute('data-id', game.id);

            // Insert at correct relative position
            const successors = Array.from(container.children).filter(child => {
                const idx = filteredGames.findIndex(g => g.id === child.getAttribute('data-id'));
                return idx > i;
            });

            if (successors.length > 0) {
                container.insertBefore(card, successors[0]);
            } else {
                container.appendChild(card);
            }
        }

        // Apply classes for position
        card.classList.remove('slide-center', 'slide-left', 'slide-right', 'slide-far-left', 'slide-far-right', 'slide-hidden');
        const diff = i - currentSlideIndex;
        if (diff === 0) card.classList.add('slide-center');
        else if (diff === -1) card.classList.add('slide-left');
        else if (diff === 1) card.classList.add('slide-right');
        else if (diff === -2) card.classList.add('slide-far-left');
        else if (diff === 2) card.classList.add('slide-far-right');
        else card.classList.add('slide-hidden');
    }
}

function createGameCard(game) {
    const card = document.createElement('a');
    card.href = `detail.html?id=${game.id}`;
    card.className = 'card-link';

    const gameImages = game.image || game.images;
    const gameImg = Array.isArray(gameImages) ? gameImages[0] : gameImages;
    const bgStyle = gameImg ? 'background: #fff;' : `background: ${getGradient(game.id)};`;
    const iconColor = gameImg ? 'color: #333;' : 'color: white;';

    let imgSrc = '';
    if (gameImg) {
        imgSrc = gameImg.includes('/') ? `assets/images/${gameImg}` : `assets/images/games/${gameImg}`;
    }

    const imageContent = gameImg
        ? `<img src="${imgSrc}" alt="${game.title}" class="card-game-image" loading="lazy">`
        : `<span>${game.icon}</span>`;

    // Prepare badges for meta-info
    const badges = [];
    badges.push(`
        <span class="badge players">
            ${isSearchActive
            ? `⭐ 추천: ${game.bestPlayers ? (game.bestPlayers === 99 ? 'N/A' : `${game.bestPlayers}인`) : `${game.minPlayers}-${game.maxPlayers}인`}`
            : `👥 ${game.minPlayers}-${game.maxPlayers}인${game.bestPlayers ? ` | 추천: ${game.bestPlayers === 99 ? 'N/A' : `${game.bestPlayers}인`}` : ''}`
        }
        </span>
    `);
    badges.push(`<span class="badge time">⏱️ ${game.playTime}</span>`);
    badges.push(`<span class="badge difficulty">🔥 ${game.difficulty}/5</span>`);


    card.innerHTML = `
        <article class="game-card ${wishlist.has(game.id) ? 'is-wished' : ''}">
            <div class="card-image-container">
                <div class="card-image" style="${bgStyle} ${iconColor}">
                    ${imageContent}
                </div>
                <div class="card-info-reveal">
                    <div class="reveal-content">
                        <span class="reveal-tag">${game.genre || '보드게임'}</span>
                        <p class="reveal-mech">${game.mechanism || '다양한 재미'}</p>
                        <span class="reveal-hint">자세히 보기 →</span>
                    </div>
                </div>
            </div>
            <div class="card-content">
                <div class="title-row">
                    <h2>${game.title}</h2>
                    ${wishlist.has(game.id) ? '<span class="wish-badge">찜완료</span>' : ''}
                </div>
                <div class="meta-info">
                    ${badges.join('')}
                </div>
                <button class="wishlist-toggle-btn ${wishlist.has(game.id) ? 'active' : ''}" 
                        onclick="toggleWishlist('${game.id}', event)" 
                        aria-label="찜하기">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                </button>
            </div>
        </article>
    `;
    return card;
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

    // Handle images (now an array)
    const gameImages = game.image || game.images;
    const imageArray = Array.isArray(gameImages) ? gameImages : (gameImages ? [gameImages] : []);
    const miniImgContainer = document.getElementById('game-image-mini');

    if (imageArray.length > 0) {
        const firstImg = imageArray[0];
        const imgSrc = firstImg.includes('/') ? `assets/images/${firstImg}` : `assets/images/games/${firstImg}`;
        heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${imgSrc}')`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';

        if (miniImgContainer) {
            miniImgContainer.innerHTML = `<img src="${imgSrc}" alt="${game.title}">`;
            miniImgContainer.style.display = 'block';
        }

        // Initialize carousel if there are images
        initCarousel(imageArray, game.title);
    } else if (miniImgContainer) {
        miniImgContainer.style.display = 'none';
    }

    document.getElementById('game-title').textContent = game.title;

    // Add Wishlist Action Button in Hero Section
    const heroText = document.querySelector('.hero-text-content');
    const existingAction = document.getElementById('wishlist-action');
    if (existingAction) existingAction.remove();

    const actionBtn = document.createElement('button');
    actionBtn.id = 'wishlist-action';
    actionBtn.className = `wishlist-action-btn ${wishlist.has(game.id) ? 'active' : ''}`;
    actionBtn.innerHTML = wishlist.has(game.id) ? '⭐ 찜한 게임에서 제외' : '☆ 하고 싶은 게임으로 찜하기';
    actionBtn.onclick = (e) => {
        toggleWishlist(game.id, e);
        actionBtn.classList.toggle('active', wishlist.has(game.id));
        actionBtn.innerHTML = wishlist.has(game.id) ? '⭐ 찜한 게임에서 제외' : '☆ 하고 싶은 게임으로 찜하기';
    };
    heroText.appendChild(actionBtn);

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
    const bestPlayersEl = document.getElementById('game-best-players');
    if (bestPlayersEl) {
        if (game.bestPlayers) {
            bestPlayersEl.textContent = `⭐ 추천: ${game.bestPlayers === 99 ? 'N/A' : `${game.bestPlayers}인`}`;
            bestPlayersEl.style.display = 'inline-block';
        } else {
            bestPlayersEl.style.display = 'none';
        }
    }
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

// Carousel functionality
function initCarousel(images, gameTitle) {
    if (!images || images.length === 0) return;

    const carouselContainer = document.getElementById('image-carousel');
    const carouselImages = document.getElementById('carousel-images');
    const carouselIndicators = document.getElementById('carousel-indicators');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (!carouselContainer || !carouselImages) return;

    // Show carousel
    carouselContainer.style.display = 'block';

    let currentIndex = 0;

    // Create image elements
    carouselImages.innerHTML = '';
    images.forEach((img, index) => {
        const imgSrc = img.includes('/') ? `assets/images/${img}` : `assets/images/games/${img}`;
        const imgEl = document.createElement('img');
        imgEl.src = imgSrc;
        imgEl.alt = `${gameTitle} - 이미지 ${index + 1}`;
        imgEl.className = 'carousel-image';
        imgEl.style.transform = `translateX(${index * 100}%)`;
        carouselImages.appendChild(imgEl);
    });

    // Create indicators
    if (carouselIndicators && images.length > 1) {
        carouselIndicators.innerHTML = '';
        images.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.className = 'carousel-indicator';
            if (index === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => goToSlide(index));
            carouselIndicators.appendChild(indicator);
        });
    }

    function updateCarousel() {
        const allImages = carouselImages.querySelectorAll('.carousel-image');
        allImages.forEach((img, index) => {
            img.style.transform = `translateX(${(index - currentIndex) * 100}%)`;
        });

        // Update indicators
        if (carouselIndicators) {
            const allIndicators = carouselIndicators.querySelectorAll('.carousel-indicator');
            allIndicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentIndex);
            });
        }

        // Update button visibility
        if (prevBtn) prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
        if (nextBtn) nextBtn.style.display = currentIndex === images.length - 1 ? 'none' : 'flex';
    }

    function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, images.length - 1));
        updateCarousel();
    }

    function nextSlide() {
        if (currentIndex < images.length - 1) {
            currentIndex++;
            updateCarousel();
        }
    }

    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    }

    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });

    // Initial update
    updateCarousel();

    // Hide carousel if only one image
    if (images.length === 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (carouselIndicators) carouselIndicators.style.display = 'none';
    }
}

// --- Slide Carousel Logic ---
let touchStartX = 0;
let touchEndX = 0;

function initSlideCarousel() {
    const prevBtn = document.getElementById('slide-prev');
    const nextBtn = document.getElementById('slide-next');
    const gameList = document.getElementById('game-list');

    if (!prevBtn || !nextBtn || !gameList) return;

    // Button click handlers
    prevBtn.addEventListener('click', () => slideToIndex(currentSlideIndex - 1));
    nextBtn.addEventListener('click', () => slideToIndex(currentSlideIndex + 1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            slideToIndex(currentSlideIndex - 1);
        } else if (e.key === 'ArrowRight') {
            slideToIndex(currentSlideIndex + 1);
        }
    });

    // Touch/swipe support
    gameList.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    gameList.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    // Mouse drag support
    let isMouseDown = false;
    let mouseStartX = 0;
    let mouseEndX = 0;
    let isDragged = false; // Flag to distinguish click vs drag

    gameList.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        isDragged = false;
        mouseStartX = e.pageX;
        gameList.style.cursor = 'grabbing';
    });

    gameList.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        e.preventDefault(); // Prevent text selection
        // Optional: Real-time visual feedback could be added here
    });

    gameList.addEventListener('mouseup', (e) => {
        if (!isMouseDown) return;
        isMouseDown = false;
        mouseEndX = e.pageX;
        gameList.style.cursor = 'grab'; // Reset cursor

        handleMouseSwipe(mouseStartX, mouseEndX);
    });

    gameList.addEventListener('mouseleave', () => {
        if (isMouseDown) {
            isMouseDown = false;
            gameList.style.cursor = 'grab';
        }
    });

    // Prevent link navigation if it was a drag action OR if clicking a side card
    gameList.addEventListener('click', (e) => {
        // 1. If dragged, prevent click
        if (isDragged) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // 2. Handle side card clicks
        const cardLike = e.target.closest('.card-link');
        if (cardLike) {
            // Find the index of the clicked card relative to the original filtered list
            // Note: gameList children are the visible cards. 
            // We need to match this card to the 'filteredGames' array index or use the DOM index relative to gameList.
            // Since we re-render gameList based on filteredGames, the DOM index matches the index in filteredGames.

            const childrenArray = Array.from(gameList.children);
            const clickedIndex = childrenArray.indexOf(cardLike);

            if (clickedIndex !== -1 && clickedIndex !== currentSlideIndex) {
                // It's a side card -> Slide to it
                e.preventDefault();
                slideToIndex(clickedIndex);
            }
            // If it IS currentSlideIndex, let the link work (go to detail page)
        }
    }, true); // Use capturing to intercept early

    function handleMouseSwipe(start, end) {
        const threshold = 30; // Reduced threshold for easier dragging
        const diff = start - end;
        const absDiff = Math.abs(diff);

        if (absDiff > threshold) {
            isDragged = true;

            // Calculate how many slides to move based on distance
            // e.g., every 150px moves 1 slide
            const moveCount = Math.max(1, Math.round(absDiff / 150));

            if (diff > 0) {
                // Dragged Left -> Next
                slideToIndex(currentSlideIndex + moveCount);
            } else {
                // Dragged Right -> Prev
                slideToIndex(currentSlideIndex - moveCount);
            }

            setTimeout(() => {
                isDragged = false;
            }, 100);
        }
    }
}

function handleSwipe() {
    const swipeThreshold = 30;
    const diff = touchStartX - touchEndX;
    const absDiff = Math.abs(diff);

    if (absDiff > swipeThreshold) {
        // Same logic for touch
        const moveCount = Math.max(1, Math.round(absDiff / 150));

        if (diff > 0) {
            slideToIndex(currentSlideIndex + moveCount);
        } else {
            slideToIndex(currentSlideIndex - moveCount);
        }
    }
}

function slideToIndex(newIndex) {
    if (newIndex < 0 || newIndex >= filteredGames.length) return;

    currentSlideIndex = newIndex;
    updateSlideDisplay();
    updateSlideControls();
}

function updateSlidePositions() {
    updateSlideDisplay();
    updateSlideIndicators();
}

function updateSlideControls() {
    const prevBtn = document.getElementById('slide-prev');
    const nextBtn = document.getElementById('slide-next');

    if (prevBtn) {
        prevBtn.disabled = currentSlideIndex === 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentSlideIndex === filteredGames.length - 1;
    }
}

function updateSlideIndicators() {
    const indicatorsContainer = document.getElementById('slide-indicators');
    if (!indicatorsContainer) return;

    // Only show indicators if there are multiple games
    if (filteredGames.length <= 1) {
        indicatorsContainer.innerHTML = '';
        return;
    }

    // Limit indicators to avoid clutter (show max 20)
    const maxIndicators = 20;
    if (filteredGames.length > maxIndicators) {
        indicatorsContainer.innerHTML = `<span style="color: var(--secondary-text); font-size: 0.9rem;">${currentSlideIndex + 1} / ${filteredGames.length}</span>`;
        return;
    }

    indicatorsContainer.innerHTML = '';
    filteredGames.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = 'slide-indicator';
        if (index === currentSlideIndex) {
            indicator.classList.add('active');
        }
        indicator.addEventListener('click', () => slideToIndex(index));
        indicatorsContainer.appendChild(indicator);
    });
}
