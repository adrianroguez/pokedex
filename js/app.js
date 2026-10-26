// Application configuration
const TOTAL_POKEMON = 151;
const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon';
const CACHE_STORAGE_KEY = 'pokedex_kanto_151_cache';

// Type color definitions
const TYPE_COLORS = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    grass: '#78C850',
    electric: '#F8D030',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
};

// Spanish translations for UI display
const TYPE_NAMES_ES = {
    normal: 'Normal',
    fire: 'Fuego',
    water: 'Agua',
    grass: 'Planta',
    electric: 'Eléctrico',
    ice: 'Hielo',
    fighting: 'Lucha',
    poison: 'Veneno',
    ground: 'Tierra',
    flying: 'Volador',
    psychic: 'Psíquico',
    bug: 'Bicho',
    rock: 'Roca',
    ghost: 'Fantasma',
    dragon: 'Dragón',
    steel: 'Acero',
    fairy: 'Hada'
};

// Application state
let allPokemon = [];
let activeTypeFilter = 'all';
let currentSearchTerm = '';

// DOM references
let searchInput;
let searchBtn;
let clearSearchBtn;
let typeFilterSelect;
let pokemonCountEl;
let loaderContainer;
let loaderTextEl;
let progressBarEl;
let errorContainer;
let errorTextEl;
let retryBtn;
let noResultsContainer;
let resetFilterBtn;
let pokemonContainer;

// Utility to darken or lighten hex colors
function shadeHexColor(color, percent) {
    let num = parseInt(color.replace('#', ''), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;

    return '#' + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

// Format name helper
function formatPokemonName(name) {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1);
}

// Build card DOM element
function createPokemonCard(pokemon) {
    const card = document.createElement('article');
    card.className = 'pokemon-card';
    card.setAttribute('data-id', pokemon.id);

    const primaryType = pokemon.types[0];
    const secondaryType = pokemon.types[1];
    const color1 = TYPE_COLORS[primaryType] || '#777777';

    // Set dynamic card background color based on Pokemon type
    if (secondaryType && TYPE_COLORS[secondaryType]) {
        const color2 = TYPE_COLORS[secondaryType];
        card.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
    } else {
        const darker = shadeHexColor(color1, -25);
        card.style.background = `linear-gradient(135deg, ${color1} 0%, ${darker} 100%)`;
    }

    const paddedId = String(pokemon.id).padStart(3, '0');
    const frontImg = pokemon.sprites.front || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="20">?</text></svg>';
    const backImg = pokemon.sprites.back || frontImg;

    // Build types badges HTML
    const typesHtml = pokemon.types.map(typeKey => {
        const bg = TYPE_COLORS[typeKey] || '#666666';
        const label = TYPE_NAMES_ES[typeKey] || typeKey;
        return `<span class="type-pill" style="background-color: ${bg};">${label}</span>`;
    }).join('');

    card.innerHTML = `
        <div class="card-header">
            <h3 class="pokemon-name">${formatPokemonName(pokemon.name)}</h3>
            <span class="pokemon-number">#${paddedId}</span>
        </div>
        <div class="sprites-wrapper">
            <div class="sprite-box" title="Vista frontal de ${pokemon.name}">
                <img class="sprite-img" src="${frontImg}" alt="${pokemon.name} por delante" loading="lazy">
                <span class="sprite-tag">Frente</span>
            </div>
            <div class="sprite-box" title="Vista dorsal de ${pokemon.name}">
                <img class="sprite-img" src="${backImg}" alt="${pokemon.name} por detras" loading="lazy">
                <span class="sprite-tag">Espalda</span>
            </div>
        </div>
        <div class="types-wrapper">
            ${typesHtml}
        </div>
        <div class="card-details">
            <span class="detail-item"><span class="detail-label">Alt:</span> ${pokemon.height} m</span>
            <span class="detail-item"><span class="detail-label">Peso:</span> ${pokemon.weight} kg</span>
        </div>
    `;

    return card;
}

// Render cards into container
function renderPokemonList(list) {
    pokemonContainer.innerHTML = '';

    if (list.length === 0) {
        noResultsContainer.classList.remove('hidden');
        pokemonCountEl.textContent = '0 de 151 Pokémon';
        return;
    }

    noResultsContainer.classList.add('hidden');
    pokemonCountEl.textContent = `Mostrando ${list.length} de 151 Pokémon`;

    const fragment = document.createDocumentFragment();
    list.forEach(pokemon => {
        const card = createPokemonCard(pokemon);
        fragment.appendChild(card);
    });

    pokemonContainer.appendChild(fragment);
}

// Filter and search logic
function applyFilters() {
    const term = currentSearchTerm.trim().toLowerCase();
    const cleanIdTerm = term.replace(/^#+/, '');

    const filtered = allPokemon.filter(pokemon => {
        // Search term check
        const matchesName = pokemon.name.toLowerCase().includes(term);
        const matchesId = pokemon.id.toString() === cleanIdTerm || String(pokemon.id).padStart(3, '0') === cleanIdTerm;
        const matchesSearch = term === '' || matchesName || matchesId;

        // Type filter check
        const matchesType = activeTypeFilter === 'all' || pokemon.types.includes(activeTypeFilter);

        return matchesSearch && matchesType;
    });

    renderPokemonList(filtered);
}

// Batch fetch helper
async function fetchBatch(items) {
    const promises = items.map(async item => {
        const res = await fetch(item.url);
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }
        const data = await res.json();
        return {
            id: data.id,
            name: data.name,
            sprites: {
                front: data.sprites.front_default,
                back: data.sprites.back_default || data.sprites.front_default
            },
            types: data.types.map(t => t.type.name),
            height: (data.height / 10).toFixed(1),
            weight: (data.weight / 10).toFixed(1)
        };
    });

    return Promise.all(promises);
}

// Load Pokemon from PokeAPI or Cache
async function loadPokemonData() {
    loaderContainer.classList.remove('hidden');
    errorContainer.classList.add('hidden');
    noResultsContainer.classList.add('hidden');
    pokemonContainer.innerHTML = '';
    progressBarEl.style.width = '0%';
    loaderTextEl.textContent = 'Conectando a PokeAPI...';

    // Check localStorage cache first
    try {
        const cached = localStorage.getItem(CACHE_STORAGE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length === TOTAL_POKEMON) {
                allPokemon = parsed;
                progressBarEl.style.width = '100%';
                loaderContainer.classList.add('hidden');
                applyFilters();
                return;
            }
        }
    } catch (cacheErr) {
        // Ignore cache parse errors and fetch from network
    }

    try {
        loaderTextEl.textContent = 'Obteniendo catalogo de 151 Pokemon...';
        progressBarEl.style.width = '10%';

        const listResponse = await fetch(`${POKEAPI_URL}?limit=${TOTAL_POKEMON}&offset=0`);
        if (!listResponse.ok) {
            throw new Error(`Fallo de conexion: codigo ${listResponse.status}`);
        }

        const listData = await listResponse.json();
        const results = listData.results;

        // Fetch detailed pokemon info in concurrent batches
        const batchSize = 25;
        const fetchedPokemon = [];

        for (let i = 0; i < results.length; i += batchSize) {
            const batch = results.slice(i, i + batchSize);
            const batchResults = await fetchBatch(batch);
            fetchedPokemon.push(...batchResults);

            const progress = Math.min(100, Math.round(((i + batch.length) / TOTAL_POKEMON) * 100));
            progressBarEl.style.width = `${progress}%`;
            loaderTextEl.textContent = `Descargando informacion: ${fetchedPokemon.length} / ${TOTAL_POKEMON}...`;
        }

        // Sort by ID to guarantee order
        fetchedPokemon.sort((a, b) => a.id - b.id);
        allPokemon = fetchedPokemon;

        // Cache normalized data in localStorage
        try {
            localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(allPokemon));
        } catch (storageErr) {
            // Storage quota reached or disabled
        }

        loaderContainer.classList.add('hidden');
        applyFilters();

    } catch (err) {
        loaderContainer.classList.add('hidden');
        errorContainer.classList.remove('hidden');
        errorTextEl.textContent = `No se pudo conectar a PokeAPI (${err.message || 'Error de red'}). Por favor comprueba tu conexion.`;
    }
}

// Setup user interactions
function initEventListeners() {
    // Search input typing
    searchInput.addEventListener('input', e => {
        currentSearchTerm = e.target.value;
        if (currentSearchTerm.length > 0) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        applyFilters();
    });

    // Clear search button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        applyFilters();
    });

    // Search button click
    searchBtn.addEventListener('click', () => {
        applyFilters();
    });

    // Search input Enter key
    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });

    // Type filter dropdown change
    typeFilterSelect.addEventListener('change', e => {
        activeTypeFilter = e.target.value;
        applyFilters();
    });

    // Reset filters button
    resetFilterBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        clearSearchBtn.style.display = 'none';
        typeFilterSelect.value = 'all';
        activeTypeFilter = 'all';
        applyFilters();
    });

    // Retry button on error
    retryBtn.addEventListener('click', () => {
        loadPokemonData();
    });
}

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    searchInput = document.getElementById('search-input');
    searchBtn = document.getElementById('search-btn');
    clearSearchBtn = document.getElementById('clear-search-btn');
    typeFilterSelect = document.getElementById('type-filter');
    pokemonCountEl = document.getElementById('pokemon-count');
    loaderContainer = document.getElementById('loader');
    loaderTextEl = document.getElementById('loader-text');
    progressBarEl = document.getElementById('progress-bar');
    errorContainer = document.getElementById('error-container');
    errorTextEl = document.getElementById('error-message');
    retryBtn = document.getElementById('retry-btn');
    noResultsContainer = document.getElementById('no-results');
    resetFilterBtn = document.getElementById('reset-filter-btn');
    pokemonContainer = document.getElementById('pokemon-container');

    initEventListeners();
    loadPokemonData();
});
