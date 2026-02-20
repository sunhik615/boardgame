// Utility to get URL parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Disable native scroll restoration to handle it manually
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
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
let currentSlideIndex = 0;
let filteredGames = [];
let isSearchActive = false;
let wishlist = new Set();

// LocalStorage Utils
const WISHLIST_KEY = 'boardgame_wishlist';
const SEARCH_STATE_KEY = 'boardgame_search_state';

// State Persistence
function saveSearchState() {
    // Only save if we are on the page with filters (index page)
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    try {
        const playersVal = document.getElementById('filter-players')?.value || 'all';
        const genreVal = document.getElementById('filter-genre')?.value || 'all';
        const timeVal = document.getElementById('filter-time')?.value || 'all';
        const difficultyVal = document.getElementById('filter-difficulty')?.value || 'all';
        const sortVal = document.getElementById('sort-order')?.value || 'name';
        const searchVal = searchInput.value || '';

        const state = {
            players: playersVal,
            genre: genreVal,
            time: timeVal,
            difficulty: difficultyVal,
            sort: sortVal,
            search: searchVal,
            slideIndex: Number(currentSlideIndex) || 0,
            scrollPos: window.scrollY || 0,
            url: window.location.pathname // Helper to track if we were on index
        };
        sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save search state', e);
    }
}

function loadSearchState() {
    try {
        const saved = sessionStorage.getItem(SEARCH_STATE_KEY);
        if (!saved) return null;

        const state = JSON.parse(saved);
        if (document.getElementById('filter-players')) document.getElementById('filter-players').value = state.players || 'all';
        if (document.getElementById('filter-genre')) document.getElementById('filter-genre').value = state.genre || 'all';
        if (document.getElementById('filter-time')) document.getElementById('filter-time').value = state.time || 'all';
        if (document.getElementById('filter-difficulty')) document.getElementById('filter-difficulty').value = state.difficulty || 'all';
        if (document.getElementById('sort-order')) document.getElementById('sort-order').value = state.sort || 'name';
        if (document.getElementById('search-input')) document.getElementById('search-input').value = state.search || '';

        currentSlideIndex = Number(state.slideIndex) || 0;
        return state;
    } catch (e) {
        console.error('Failed to load search state', e);
        return null;
    }
}
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

    // 3. Handle 'name' parameter for display
    const sharerName = urlParams.get('name');
    if (sharerName) {
        const sharerContainer = document.getElementById('sharer-name-container');
        const sharerDisplay = document.getElementById('sharer-name-display');
        const ownActions = document.getElementById('own-wishlist-actions');
        const mainTitle = document.querySelector('header h1');

        if (sharerContainer && sharerDisplay) {
            sharerContainer.style.display = 'block';
            sharerDisplay.textContent = `${sharerName}님의 관심 게임 목록`;
            if (mainTitle) mainTitle.textContent = `${sharerName}님의 게임 목록`;
            if (ownActions) ownActions.style.display = 'none'; // Hide input if viewing shared list
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
        // Maintain current index when toggling wishlist
        renderGameList(gameList, filteredGames, isSearchActive, false);
    }
    const bazaarGrid = document.querySelector('.bazaar-grid');
    if (bazaarGrid) {
        // Sync bazaar with the CURRENT filtered results, not all games
        renderImageBazaar(bazaarGrid, filteredGames);
    }

    // If on Wishlist Page, re-render the whole grid to remove the item immediately
    const wishlistGrid = document.getElementById('wishlist-grid');
    if (wishlistGrid) {
        renderWishlistPage();
    }

    // If "Wishlist Only" filter is active, we might need to re-render everything
    const wishlistFilter = document.getElementById('filter-wishlist');
    if (wishlistFilter && wishlistFilter.checked) {
        applyFilters();
    }
}

function renderWishlistPage() {
    const grid = document.getElementById('wishlist-grid');
    const countText = document.getElementById('wishlist-count-text');
    if (!grid) return;

    // Filter games that are in wishlist
    const wishedGames = games.filter(g => wishlist.has(g.id));

    // Sort by name
    wishedGames.sort((a, b) => a.title.localeCompare(b.title));

    grid.innerHTML = '';

    if (wishedGames.length === 0) {
        grid.innerHTML = `
            <div class="wishlist-empty-state" style="grid-column: 1/-1;">
                <h2>찜한 게임이 아직 없어요!</h2>
                <p>메인 페이지에서 관심 있는 게임들을 별표(⭐)로 찜해 보세요.</p>
                <a href="index.html" class="btn-share" style="display:inline-block; text-decoration:none;">게임 보러가기</a>
            </div>
        `;
        if (countText) countText.textContent = '현재 찜한 게임이 없습니다.';
        return;
    }

    if (countText) countText.textContent = `현재 총 ${wishedGames.length}개의 게임을 찜하셨습니다.`;

    wishedGames.forEach(game => {
        // We reuse the createGameCard logic but remove the sliding classes
        const card = createGameCard(game);
        // Remove slide-related classes since this is a normal grid
        const article = card.querySelector('article');
        if (article) {
            article.classList.remove('slide-center', 'slide-left', 'slide-right');
        }
        grid.appendChild(card);
    });
}

function copyWishlistLink() {
    if (wishlist.size === 0) {
        alert('찜한 게임이 없습니다. 먼저 별을 눌러 게임을 추가해 주세요!');
        return;
    }

    const ids = Array.from(wishlist).join(',');
    const baseUrl = window.location.origin + window.location.pathname;

    // Get name if provided
    const nameInput = document.getElementById('user-name-input');
    const name = nameInput ? nameInput.value.trim() : '';

    let shareUrl = `${baseUrl}?wished=${ids}`;
    if (name) {
        shareUrl += `&name=${encodeURIComponent(name)}`;
    }

    navigator.clipboard.writeText(shareUrl).then(() => {
        const btn = document.getElementById('btn-share-wishlist');
        if (!btn) return;
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
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, storage, ref, uploadBytes, getDownloadURL, query, where, orderBy } from "./firebase-config.js";

let currentGameList = [];
// Make games globally available for compatibility
window.games = [];

// Fetch data from Firestore
// Fetch data from Firestore
async function fetchGamesData() {
    const startTime = performance.now();
    console.log("Starting data fetch...");

    try {
        // Note: With offline persistence enabled, getDocs will first try to return results from cache.
        const querySnapshot = await getDocs(collection(db, "games"));
        const fetchedGames = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.id) data.id = doc.id;
            fetchedGames.push(data);
        });

        const fetchTime = performance.now();
        console.log(`Data fetched in ${(fetchTime - startTime).toFixed(2)}ms. Items: ${fetchedGames.length}`);

        // Update global games array
        window.games = fetchedGames;
        currentGames = [...window.games];

        // Re-run initialization logic now that data is loaded
        loadWishlist();

        const gameListContainer = document.getElementById('game-list');
        const detailContainer = document.getElementById('game-detail');

        // Index Page
        if (gameListContainer) {
            if (typeof initFilters === 'function') initFilters();
            if (typeof initSlideCarousel === 'function') initSlideCarousel();
        }

        // Detail Page
        if (detailContainer) {
            renderGameDetail();
        }
        // Restore state if available
        const savedState = loadSearchState();
        if (savedState && gameListContainer) {
            applyFilters(true); // Explicitly say state is being restored

            // Restore scroll position after a short delay
            if (savedState.scrollPos) {
                let attempts = 0;
                const restoreScroll = () => {
                    window.scrollTo(0, savedState.scrollPos);
                    // Check if we actually reached the target position
                    // (Allow small difference for sub-pixel rendering or elastic scrolling)
                    if (Math.abs(window.scrollY - savedState.scrollPos) < 2 || attempts > 15) {
                        console.log(`Scroll restored to ${window.scrollY} after ${attempts} attempts`);
                    } else {
                        attempts++;
                        setTimeout(restoreScroll, 50 * attempts); // Increasingly wait more
                    }
                };
                setTimeout(restoreScroll, 100);
            }
        } else {
            applyFilters(false);
        }

        // Remove loading message
        const loadingMsg = document.querySelector('#game-list p');
        if (loadingMsg && loadingMsg.textContent === '게임 목록을 불러오는 중...') {
            loadingMsg.remove();
        }

        // Wishlist Page
        const wishlistGrid = document.getElementById('wishlist-grid');
        if (wishlistGrid) {
            console.log("Wishlist grid found, rendering wishlist...");
            renderWishlistPage();
        }

        const endTime = performance.now();
        console.log(`Initialization complete in ${(endTime - startTime).toFixed(2)}ms`);

    } catch (err) {
        console.error("Firestore error:", err);
        // Fallback or error UI
        const gameListContainer = document.getElementById('game-list');
        if (gameListContainer) {
            gameListContainer.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:red;">데이터를 불러오는데 실패했습니다.<br>${err.message}</p>`;
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Initial UI Setup (Logic that doesn't depend on data)
    console.log("DOM Content Loaded. Starting app...");

    // Scroll-to-Top FAB Logic
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        // Initial state check
        if (window.scrollY > 400) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }

            // Also save search state to remember scroll position periodically
            // Throttled using requestAnimationFrame for performance
            // Also save search state to remember scroll position periodically
            // Throttled using requestAnimationFrame for performance
            const gameListContainer = document.getElementById('game-list');
            if (gameListContainer && !document.getElementById('game-detail')) {
                if (!window._scrollTimer) {
                    window._scrollTimer = requestAnimationFrame(() => {
                        saveSearchState();
                        window._scrollTimer = null;
                    });
                }
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Start Data Fetch
    fetchGamesData();

    // Ensure state is saved before leaving
    window.addEventListener('beforeunload', saveSearchState);
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

    const filterInputs = [filterPlayers, filterGenre, filterTime, filterDifficulty, sortOrder];

    // Event Listener for all changes
    filterInputs.forEach(input => {
        if (input) {
            input.addEventListener('change', () => applyFilters());
        }
    });

    // Search Input Listener (Real-time)
    // Search Input Listener (Debounced)
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                applyFilters();
            }, 300);
        });
    }

    // Reset Button
    const resetLogic = () => {
        if (filterPlayers) filterPlayers.value = 'all';
        if (filterGenre) filterGenre.value = 'all';
        if (filterTime) filterTime.value = 'all';
        if (filterDifficulty) filterDifficulty.value = 'all';
        if (sortOrder) sortOrder.value = 'name';
        if (searchInput) searchInput.value = '';
        currentSlideIndex = 0;
        sessionStorage.removeItem(SEARCH_STATE_KEY); // Clear saved state
        applyFilters(true);
    };

    if (btnReset) {
        btnReset.addEventListener('click', resetLogic);
    }

    const btnRandom = document.getElementById('btn-random');
    const randomFab = document.getElementById('random-fab');

    const handleRandomClick = () => {
        if (filteredGames.length > 0) {
            // Scroll to center the slide container so the result is highly visible
            const slideContainer = document.querySelector('.slide-container');
            if (slideContainer) {
                slideContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }

            const randomIndex = Math.floor(Math.random() * filteredGames.length);
            slideToIndex(randomIndex);

            // Apply winner effect after slide animation completes
            setTimeout(() => {
                const centerCardLink = document.querySelector('.slide-center');
                if (centerCardLink) {
                    // 1. Add focal class for sizing/z-index
                    centerCardLink.classList.add('winner-parent');

                    // 2. Clear any existing effect
                    const oldEffect = centerCardLink.querySelector('.winner-effect-container');
                    if (oldEffect) oldEffect.remove();

                    // 3. Inject SVG Element
                    const effectDiv = document.createElement('div');
                    effectDiv.className = 'winner-effect-container';

                    // SVG for the precise path along the border
                    effectDiv.innerHTML = `
                        <svg class="border-beam-svg">
                            <rect class="border-beam-path" x="4" y="4" width="calc(100% - 8px)" height="calc(100% - 8px)" rx="12" pathLength="1000"></rect>
                        </svg>
                    `;
                    centerCardLink.appendChild(effectDiv);

                    // 4. Remove after duration (animation is 1.8s + small buffer)
                    setTimeout(() => {
                        if (centerCardLink) {
                            centerCardLink.classList.remove('winner-parent');
                            setTimeout(() => {
                                if (effectDiv) effectDiv.remove();
                            }, 500); // Wait for scale back animation
                        }
                    }, 2200);
                }
            }, 650);
        } else {
            alert('추천할 게임이 없습니다. 필터를 조정해 보세요!');
        }
    };

    if (btnRandom) {
        btnRandom.addEventListener('click', handleRandomClick);
    }
    if (randomFab) {
        randomFab.addEventListener('click', handleRandomClick);
    }

    // Header Title Click to Reset
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.style.cursor = 'pointer'; // Make it look clickable
        headerTitle.addEventListener('click', resetLogic);
    }
}

function applyFilters(isStateRestored = false) {
    // Only apply if we are on the index page
    const container = document.getElementById('game-list');
    if (!container) return;

    const filters = {
        players: document.getElementById('filter-players'),
        genre: document.getElementById('filter-genre'),
        time: document.getElementById('filter-time'),
        difficulty: document.getElementById('filter-difficulty'),
        sort: document.getElementById('sort-order'),
        search: document.getElementById('search-input')
    };

    const values = {
        players: filters.players?.value || 'all',
        genre: filters.genre?.value || 'all',
        time: filters.time?.value || 'all',
        difficulty: filters.difficulty?.value || 'all',
        sort: filters.sort?.value || 'name',
        search: filters.search?.value.toLowerCase().trim() || ''
    };

    let filtered = currentGames.filter(game => {
        // 0. Search Filter
        if (values.search && !game.title.toLowerCase().includes(values.search)) return false;

        // 1. Players Filter
        if (values.players !== 'all') {
            if (values.players === '7+') {
                if (game.maxPlayers < 7) return false;
            } else {
                const p = parseInt(values.players);
                if (p < game.minPlayers || p > game.maxPlayers) return false;
            }
        }

        // 2. Genre Filter
        if (values.genre !== 'all' && game.genre !== values.genre) return false;

        // 3. Time Filter
        if (values.time !== 'all') {
            const times = game.playTime.match(/\d+/g);
            if (!times) return true;
            const maxTime = Math.max(...times.map(Number));

            if (values.time === '30' && maxTime > 30) return false;
            if (values.time === '60' && (maxTime <= 30 || maxTime > 60)) return false;
            if (values.time === 'over60' && maxTime <= 60) return false;
        }

        // 4. Difficulty Filter
        if (values.difficulty !== 'all') {
            const diff = game.difficulty;
            if (values.difficulty === 'easy' && diff >= 2.0) return false;
            if (values.difficulty === 'normal' && (diff < 2.0 || diff >= 3.0)) return false;
            if (values.difficulty === 'hard' && (diff < 3.0 || diff >= 4.0)) return false;
            if (values.difficulty === 'expert' && diff < 4.0) return false;
        }

        return true;
    });

    // 5. Sorting
    filtered.sort((a, b) => {
        if (values.search) {
            const aStart = a.title.toLowerCase().startsWith(values.search);
            const bStart = b.title.toLowerCase().startsWith(values.search);
            if (aStart && !bStart) return -1;
            if (!aStart && bStart) return 1;
        }

        if (values.sort === 'difficulty-asc') {
            return (a.difficulty || 0) - (b.difficulty || 0) || a.title.localeCompare(b.title);
        } else if (values.sort === 'difficulty-desc') {
            return (b.difficulty || 0) - (a.difficulty || 0) || a.title.localeCompare(b.title);
        }
        return a.title.localeCompare(b.title);
    });

    const isFilterActive = !!(values.search || values.players !== 'all' || values.genre !== 'all' || values.time !== 'all' || values.difficulty !== 'all');
    isSearchActive = isFilterActive;

    // Only save if it's NOT a restoration call (otherwise we save while scrolling to position)
    if (!isStateRestored) {
        saveSearchState();
    }

    const bazaarContainer = document.getElementById('image-bazaar');

    if (container) renderGameList(container, filtered, isFilterActive, !isStateRestored);
    if (bazaarContainer) renderImageBazaar(bazaarContainer, filtered);

    const resultsCountEl = document.getElementById('results-count');
    if (resultsCountEl && typeof games !== 'undefined') {
        const total = games.length;
        const count = filtered.length;
        resultsCountEl.textContent = isFilterActive ? `${total}개 중에 ${count}개를 찾았습니다.` : `총 ${total}개 보유중입니다.`;
    }
}

// --- Image Bazaar (Grid View) Logic ---
function renderImageBazaar(container, matches) {
    container.innerHTML = '';

    const gamesWithImages = matches.filter(game => {
        const gameImg = game.image || game.images;
        return Array.isArray(gameImg) ? gameImg.length > 0 : !!gameImg;
    });

    if (gamesWithImages.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1; opacity:0.6;">이미지가 있는 게임이 없습니다.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    gamesWithImages.forEach(game => {
        const gameImages = game.image || game.images;
        const img = Array.isArray(gameImages) ? gameImages[0] : gameImages;

        // Smart Path Logic (Matches createGameCard)
        let imgSrc = img;
        if (!img.startsWith('http') && !img.startsWith('data:')) {
            if (!img.includes('/')) {
                imgSrc = `assets/images/games/${img}`;
            }
        }

        const card = document.createElement('a');
        card.href = `detail.html?id=${game.id}`;
        card.className = 'bazaar-card';
        card.innerHTML = `
            <div class="bazaar-img-container">
                <img src="${imgSrc}" alt="${game.title}" class="bazaar-img" loading="lazy" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/150?text=No+Image';">
                ${wishlist.has(game.id) ? '<span class="bazaar-badge">찜</span>' : ''}
            </div>
            <div class="bazaar-info">
                <h3>${game.title}</h3>
            </div>
        `;
        fragment.appendChild(card);
    });
    container.appendChild(fragment);
}


// --- Rendering Logic ---
// --- Rendering Logic (Optimized Windowing) ---
function renderGameList(container, matches, isSearchActive, resetIndex = true) {
    container.innerHTML = '';
    filteredGames = matches;

    // Handle index: 
    // Only reset if explicitly requested (e.g., filter changed)
    if (resetIndex) {
        currentSlideIndex = 0;
    }

    // Safety: ensure index is within current matches bounds and is a number
    if (isNaN(currentSlideIndex) || currentSlideIndex < 0) {
        currentSlideIndex = 0;
    } else if (matches.length > 0 && currentSlideIndex >= matches.length) {
        currentSlideIndex = matches.length - 1;
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
            // Logic to prevent duplicates even if selector fails
            const existing = container.querySelector(`[data-id="${game.id}"]`);
            if (existing) {
                card = existing;
            } else {
                card = createGameCard(game);
                card.setAttribute('data-id', game.id);

                // Insert at correct relative position
                const successors = Array.from(container.children).filter(child => {
                    const idx = filteredGames.findIndex(g => g.id === child.getAttribute('data-id'));
                    return idx !== -1 && idx > i;
                });

                if (successors.length > 0) {
                    container.insertBefore(card, successors[0]);
                } else {
                    container.appendChild(card);
                }
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
    card.className = 'card-link'; // Critical: Add this class for querySelector to work
    card.href = `detail.html?id=${game.id}`;
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

    // --- Restore Image Handling Logic ---
    const gameImages = game.images || game.image; // Handle array(new) or string(old)
    let firstImage = null;

    if (Array.isArray(gameImages) && gameImages.length > 0) {
        firstImage = gameImages[0];
    } else if (typeof gameImages === 'string' && gameImages.trim() !== '') {
        firstImage = gameImages;
    }

    // Determine Background & Icon Color
    // If image exists -> White bg, black icon color (if any text)
    // If no image -> Gradient bg, white icon color
    let imageContent = '';
    let bgStyle = `background: ${getGradient(game.id)};`; // Default gradient
    let iconColor = 'color: white;';

    if (firstImage) {
        let imgSrc = firstImage;
        if (!firstImage.startsWith('http') && !firstImage.startsWith('data:')) {
            // Only prepend path if it's a simple filename (no slashes)
            if (!firstImage.includes('/')) {
                imgSrc = `assets/images/games/${firstImage}`;
            }
        }

        bgStyle = 'background: #fff;';
        iconColor = 'color: #333;';
        imageContent = `<img src="${imgSrc}" alt="${game.title}" class="card-game-image" loading="lazy" onerror="this.onerror=null; this.parentElement.style.background='${getGradient(game.id)}'; this.parentElement.innerHTML='<span>${game.icon || '🎲'}</span>';">`;
    } else {
        imageContent = `<span>${game.icon || '🎲'}</span>`;
    }


    card.innerHTML = `
        <article class="game-card ${wishlist.has(game.id) ? 'is-wished' : ''}">
            <div class="card-image-container">
                <div class="card-image" style="${bgStyle} ${iconColor}">
                    ${game.averageRating ? `<div class="card-rating-badge">⭐ ${game.averageRating}</div>` : ''}
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

        // Smart Path Logic
        let imgSrc = firstImg;
        if (!firstImg.startsWith('http') && !firstImg.startsWith('data:')) {
            if (!firstImg.includes('/')) {
                imgSrc = `assets/images/games/${firstImg}`;
            }
        }

        heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${imgSrc}')`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';

        if (miniImgContainer) {
            miniImgContainer.innerHTML = `<img src="${imgSrc}" alt="${game.title}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150?text=No+Image';">`;
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
        // Check for pending updates in localStorage
        const pendingUpdates = JSON.parse(localStorage.getItem('boardgame_pending_updates') || '[]');
        const pendingUpdate = pendingUpdates.find(u => u.id === game.id);

        const displayValue = pendingUpdate ? pendingUpdate.bestPlayers : game.bestPlayers;

        if (displayValue) {
            bestPlayersEl.innerHTML = `⭐ 추천: ${displayValue === 99 ? 'N/A' : `${displayValue}인`}`;
            if (pendingUpdate) {
                bestPlayersEl.innerHTML += ` <span style="font-size:0.8em; color:#e67e22;">(저장 대기중)</span>`;
            }
            bestPlayersEl.style.display = 'inline-block';
        } else {
            // No data and no pending update -> Show Quick Edit Input
            bestPlayersEl.innerHTML = `
                <span style="margin-right:5px;">⭐ 추천인원 없음</span>
                <input type="number" id="quick-best-input" style="width:50px; padding:2px;" placeholder="인원">
                <button onclick="saveBestPlayers('${game.id}')" style="padding:2px 5px; cursor:pointer; margin-left:5px;">저장</button>
            `;
            bestPlayersEl.style.display = 'inline-block';
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
        const expansions = game.expansion.split(',').map(e => e.trim());
        expText.innerHTML = expansions.join('<br>');
        expEl.style.display = 'block';
    } else if (expEl) {
        expEl.style.display = 'none';
    }

    // Load Reviews
    loadReviews(gameId);
    initReviewSystem();
}

// Carousel functionality
function initCarousel(images, gameTitle) {
    if (!images || images.length === 0) return;

    const carouselImages = document.getElementById('carousel-images');
    const carouselIndicators = document.getElementById('carousel-indicators');
    const carouselContainer = document.getElementById('image-carousel');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (!carouselContainer || !carouselImages) return;

    // Show carousel
    carouselContainer.style.display = 'block';

    let currentIndex = 0;

    // Create image elements
    carouselImages.innerHTML = '';
    images.forEach((img, index) => {
        // Smart Path Logic
        let imgSrc = img;
        if (!img.startsWith('http') && !img.startsWith('data:')) {
            if (!img.includes('/')) {
                imgSrc = `assets/images/games/${img}`;
            }
        }

        const imgEl = document.createElement('img');
        imgEl.src = imgSrc;
        imgEl.alt = `${gameTitle} - 이미지 ${index + 1}`;
        imgEl.className = 'carousel-image';
        imgEl.style.transform = `translateX(${index * 100}%)`;
        imgEl.onerror = function () {
            this.onerror = null;
            this.src = 'https://via.placeholder.com/600x400?text=No+Image';
        };
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
    // Prevent link navigation if it was a drag action OR if clicking a side card
    gameList.addEventListener('click', (e) => {
        // 0. If clicking wishlist button, let the toggle handler handle it
        if (e.target.closest('.wishlist-toggle-btn')) {
            return;
        }

        // 1. If dragged, prevent click
        if (isDragged) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // 2. Handle side card clicks
        const cardLike = e.target.closest('.card-link');
        if (cardLike) {
            const gameId = cardLike.getAttribute('data-id');
            const realIndex = filteredGames.findIndex(g => g.id === gameId);

            if (realIndex !== -1 && realIndex !== currentSlideIndex) {
                // It's a side card -> Slide to it
                e.preventDefault();
                slideToIndex(realIndex);
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
    saveSearchState(); // Save new index position
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

// Quick Edit Save Function
function saveBestPlayers(gameId) {
    const input = document.getElementById('quick-best-input');
    if (!input || !input.value) return;

    const val = parseInt(input.value);
    if (isNaN(val) || val < 1) {
        alert('올바른 인원수를 입력해주세요.');
        return;
    }

    const pendingUpdates = JSON.parse(localStorage.getItem('boardgame_pending_updates') || '[]');

    // Remove existing update for this game if any
    const filtered = pendingUpdates.filter(u => u.id !== gameId);

    // Add new update
    filtered.push({ id: gameId, bestPlayers: val, timestamp: new Date().toISOString() });

    localStorage.setItem('boardgame_pending_updates', JSON.stringify(filtered));

    alert('임시 저장되었습니다! \n나중에 관리자 페이지(admin.html)에 접속하면 파일로 저장할 수 있습니다.');
    location.reload(); // Refresh to show the "Pending Save" state
}

// Expose functions to window for HTML onclick attributes
window.toggleWishlist = toggleWishlist;
window.saveBestPlayers = saveBestPlayers;
window.copyWishlistLink = copyWishlistLink;

// --- Review System Logic ---
async function loadReviews(gameId) {
    const listEl = document.getElementById('review-list');
    const countEl = document.getElementById('review-count');
    const avgRatingEl = document.getElementById('average-rating-value');

    if (!listEl) return;

    listEl.innerHTML = '<div style="text-align:center; padding:20px;">리뷰를 불러오는 중...</div>';

    try {
        const q = query(collection(db, "reviews"), where("gameId", "==", gameId), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        const reviews = [];
        let totalRating = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            reviews.push(data);
            totalRating += Number(data.rating);
        });

        // Update Summary
        if (countEl) countEl.textContent = `(${reviews.length})`;
        if (avgRatingEl) {
            const avg = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";
            avgRatingEl.textContent = avg;
        }

        renderReviewList(listEl, reviews);

    } catch (error) {
        console.error("Error loading reviews:", error);
        listEl.innerHTML = '<div style="text-align:center; color:red;">리뷰를 불러오는데 실패했습니다.</div>';
    }
}

function renderReviewList(container, reviews) {
    container.innerHTML = '';

    if (reviews.length === 0) {
        container.innerHTML = '<div class="review-empty">첫 번째 리뷰를 남겨보세요!</div>';
        return;
    }

    reviews.forEach(review => {
        const date = new Date(review.timestamp?.toDate ? review.timestamp.toDate() : review.timestamp).toLocaleDateString();
        const stars = '★'.repeat(review.rating) + '☆'.repeat(10 - review.rating);

        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <div class="review-card-header">
                <span class="review-author">${escapeHtml(review.nickname)}</span>
                <div class="review-meta">
                    <span class="review-stars">${stars}</span>
                    <span class="review-date">${date}</span>
                    <button class="btn-delete-review" onclick="deleteReview('${review.id}', '${review.password}')" title="삭제">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="review-text">${escapeHtml(review.comment)}</div>
        `;
        container.appendChild(card);
    });
}

async function addReview(event) {
    event.preventDefault();

    const gameId = getQueryParam('id');
    const nickname = document.getElementById('review-nickname').value;
    const password = document.getElementById('review-password').value;
    const rating = document.getElementById('review-rating').value;
    const comment = document.getElementById('review-comment').value;
    const btn = event.target.querySelector('button');

    if (!gameId) return;

    btn.disabled = true;
    btn.textContent = '등록 중...';

    try {
        await addDoc(collection(db, "reviews"), {
            gameId: gameId,
            nickname: nickname,
            password: password,
            rating: Number(rating),
            comment: comment,
            timestamp: new Date()
        });

        // Reset form
        document.getElementById('review-form').reset();
        document.getElementById('review-rating').value = 10;
        updateStarWidget(10);

        // Reload reviews
        loadReviews(gameId);
        // Update game stats
        await updateGameStats(gameId);

    } catch (error) {
        console.error("Error adding review:", error);
        alert("리뷰 등록에 실패했습니다.");
    } finally {
        btn.disabled = false;
        btn.textContent = '리뷰 등록';
    }
}

async function deleteReview(reviewId, correctPassword) {
    const inputPassword = prompt("리뷰 작성 시 입력한 비밀번호를 입력하세요:");
    if (inputPassword === null) return;

    if (inputPassword !== correctPassword) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
    }

    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
        await deleteDoc(doc(db, "reviews", reviewId));
        alert("삭제되었습니다.");
        const gameId = getQueryParam('id');
        if (gameId) {
            loadReviews(gameId);
            await updateGameStats(gameId);
        }
    } catch (error) {
        console.error("Error deleting review:", error);
        alert("삭제 중 오류가 발생했습니다.");
    }
}

function updateStarWidget(value) {
    const stars = document.querySelectorAll('#star-rating-widget span');
    stars.forEach(star => {
        const starVal = parseInt(star.getAttribute('data-value'));
        if (starVal <= value) {
            star.classList.add('active');
            star.style.color = '#f1c40f';
        } else {
            star.classList.remove('active');
            star.style.color = '#ddd';
        }
    });
}

function initReviewSystem() {
    const form = document.getElementById('review-form');
    const starWidget = document.getElementById('star-rating-widget');

    if (form) {
        form.addEventListener('submit', addReview);
    }

    if (starWidget) {
        // Star Click
        starWidget.addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN') {
                const value = e.target.getAttribute('data-value');
                document.getElementById('review-rating').value = value;
                updateStarWidget(value);
            }
        });

        // Initialize with default 10 stars
        updateStarWidget(10);
    }
}

// Helper to prevent XSS
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.deleteReview = deleteReview; // Expose for onclick

// Feature: Update Game Stats (Denormalization)
async function updateGameStats(gameId) {
    try {
        const q = query(collection(db, "reviews"), where("gameId", "==", gameId));
        const snapshot = await getDocs(q);
        let totalRating = 0;
        let count = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalRating += Number(data.rating);
            count++;
        });

        const average = count > 0 ? Number((totalRating / count).toFixed(1)) : 0;

        // Update game document
        const gameRef = doc(db, "games", gameId);
        await updateDoc(gameRef, {
            averageRating: average,
            reviewCount: count
        });
        console.log(`Updated stats for ${gameId}: Avg ${average}, Count ${count}`);
    } catch (e) {
        console.error("Failed to update game stats", e);
    }
}
window.updateGameStats = updateGameStats; // Expose for Admin
