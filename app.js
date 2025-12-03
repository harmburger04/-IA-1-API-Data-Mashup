class MovieNightPlanner {
    constructor() {
        this.currentCity = '';
        this.weatherData = null;
        this.moviesData = [];
        this.rateLimitHit = false;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.searchForm = document.getElementById('searchForm');
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.retryBtn = document.getElementById('retryBtn');

        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.emptyState = document.getElementById('emptyState');
        this.resultsSection = document.getElementById('resultsSection');

        this.errorMessage = document.getElementById('errorMessage');
        this.weatherInfo = document.getElementById('weatherInfo');
        this.moviesSubtitle = document.getElementById('moviesSubtitle');
        this.moviesGrid = document.getElementById('moviesGrid');
    }

    attachEventListeners() {
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        this.retryBtn.addEventListener('click', () => {
            this.handleSearch();
        });
    }

    async handleSearch() {
        const city = this.cityInput.value.trim();

        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        if (CONFIG.OMDB_API_KEY === 'YOUR_API_KEY_HERE') {
            this.showError('Please add your OMDb API key to config.js. Get a free key at https://www.omdbapi.com/apikey.aspx');
            return;
        }

        if (this.rateLimitHit) {
            this.showError('Rate limit reached. Please wait a moment before trying again.');
            return;
        }

        this.currentCity = city;
        this.showLoading();

        try {
            const weatherData = await this.fetchWeatherData(city);
            this.weatherData = weatherData;

            const weatherCondition = this.determineWeatherCondition(weatherData);
            const moviesData = await this.fetchMovies(weatherCondition);

            if (moviesData.length === 0) {
                this.showEmpty();
                return;
            }

            this.moviesData = this.joinAndComputeData(moviesData, weatherData, weatherCondition);
            this.displayResults();

        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message);
        }
    }

    async fetchWeatherData(city) {
        try {
            const geocodingResponse = await fetch(
                `${CONFIG.GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
            );

            if (!geocodingResponse.ok) {
                throw new Error('Failed to find city. Please check the spelling and try again.');
            }

            const geocodingData = await geocodingResponse.json();

            if (!geocodingData.results || geocodingData.results.length === 0) {
                throw new Error(`City "${city}" not found. Please try a different city name.`);
            }

            const location = geocodingData.results[0];
            const { latitude, longitude, name, country } = location;

            const weatherResponse = await fetch(
                `${CONFIG.WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`
            );

            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch weather data. Please try again.');
            }

            const weatherData = await weatherResponse.json();

            return {
                city: name,
                country: country,
                temperature: weatherData.current_weather.temperature,
                weatherCode: weatherData.current_weather.weathercode,
                windSpeed: weatherData.current_weather.windspeed
            };

        } catch (error) {
            if (error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection and try again.');
            }
            throw error;
        }
    }

    determineWeatherCondition(weatherData) {
        const { temperature, weatherCode } = weatherData;

        let condition = CONFIG.WEATHER_CODE_MAP[weatherCode] || 'cloudy';

        if (condition === 'clear') {
            if (temperature < 5) {
                condition = 'cold';
            } else if (temperature > 30) {
                condition = 'hot';
            }
        }

        return condition;
    }

    async fetchMovies(weatherCondition) {
        const weatherConfig = CONFIG.WEATHER_TO_GENRE[weatherCondition];
        const genres = weatherConfig.genres;

        const searchTerms = [];
        genres.forEach(genre => {
            const terms = CONFIG.MOVIE_SEARCHES[genre] || [];
            searchTerms.push(...terms);
        });

        const uniqueSearchTerms = [...new Set(searchTerms)].slice(0, 10);

        const moviePromises = uniqueSearchTerms.map(term =>
            this.searchOMDb(term)
        );

        try {
            const results = await Promise.allSettled(moviePromises);

            const movies = [];
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    if (Array.isArray(result.value)) {
                        movies.push(...result.value);
                    } else {
                        movies.push(result.value);
                    }
                }
            }

            const uniqueMovies = this.removeDuplicateMovies(movies);
            return uniqueMovies.slice(0, 12);

        } catch (error) {
            throw new Error('Failed to fetch movie data. Please try again.');
        }
    }

    async searchOMDb(searchTerm) {
        try {
            const response = await fetch(
                `${CONFIG.OMDB_BASE_URL}?apikey=${CONFIG.OMDB_API_KEY}&s=${encodeURIComponent(searchTerm)}&type=movie`
            );

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid OMDb API key. Please check your config.js file.');
                }
                if (response.status === 429) {
                    this.rateLimitHit = true;
                    throw new Error('API rate limit reached. Please wait a moment and try again.');
                }
                return null;
            }

            const data = await response.json();

            if (data.Response === 'False') {
                return null;
            }

            return data.Search || [];

        } catch (error) {
            if (error.message.includes('API')) {
                throw error;
            }
            console.warn(`Failed to search for "${searchTerm}":`, error);
            return null;
        }
    }

    removeDuplicateMovies(movies) {
        const seen = new Set();
        return movies.filter(movie => {
            if (seen.has(movie.imdbID)) {
                return false;
            }
            seen.add(movie.imdbID);
            return true;
        });
    }

    joinAndComputeData(movies, weatherData, weatherCondition) {
        const weatherConfig = CONFIG.WEATHER_TO_GENRE[weatherCondition];
        const relevantGenres = weatherConfig.genres;

        return movies.map(movie => {
            const matchScore = this.calculateWeatherMatchScore(
                movie,
                weatherCondition,
                relevantGenres,
                weatherData
            );

            return {
                ...movie,
                weatherMatchScore: matchScore,
                weatherCondition: weatherCondition,
                temperature: weatherData.temperature
            };
        }).sort((a, b) => b.weatherMatchScore - a.weatherMatchScore);
    }

    calculateWeatherMatchScore(movie, weatherCondition, relevantGenres, weatherData) {
        let score = 50;

        const titleLower = movie.Title.toLowerCase();
        const genreKeywords = {
            action: ['mission', 'fast', 'avengers', 'war', 'fight', 'battle'],
            adventure: ['journey', 'quest', 'world', 'lost', 'island'],
            comedy: ['wedding', 'hangover', 'funny', 'crazy', 'stupid'],
            drama: ['beautiful', 'life', 'story', 'love', 'king'],
            horror: ['dark', 'dead', 'evil', 'night', 'fear'],
            mystery: ['gone', 'secret', 'unknown', 'hidden', 'truth'],
            thriller: ['silence', 'prisoner', 'dark', 'seven', 'departed'],
            fantasy: ['lord', 'magic', 'wizard', 'dragon', 'kingdom'],
            'sci-fi': ['star', 'space', 'future', 'matrix', 'alien']
        };

        let genreMatch = false;
        for (const genre of relevantGenres) {
            const keywords = genreKeywords[genre] || [];
            if (keywords.some(keyword => titleLower.includes(keyword))) {
                score += 30;
                genreMatch = true;
                break;
            }
        }

        if (!genreMatch) {
            score += 10;
        }

        const year = parseInt(movie.Year);
        if (!isNaN(year)) {
            const currentYear = new Date().getFullYear();
            const age = currentYear - year;
            if (age < 5) {
                score += 20;
            } else if (age < 15) {
                score += 10;
            } else if (age < 30) {
                score += 5;
            }
        }

        if (movie.Poster && movie.Poster !== 'N/A') {
            score += 5;
        }

        score = Math.min(100, Math.max(0, score));

        const randomVariation = (Math.random() - 0.5) * 10;
        score = Math.round(score + randomVariation);
        score = Math.min(100, Math.max(0, score));

        return score;
    }

    displayResults() {
        this.displayWeatherInfo();
        this.displayMovies();
        this.showResults();
    }

    displayWeatherInfo() {
        const weatherConfig = CONFIG.WEATHER_TO_GENRE[this.moviesData[0].weatherCondition];

        this.weatherInfo.innerHTML = `
            <div class="weather-main">
                <div class="weather-details">
                    <h3>${this.weatherData.city}, ${this.weatherData.country}</h3>
                    <div class="weather-temp">${Math.round(this.weatherData.temperature)}°C</div>
                    <div class="weather-description">${weatherConfig.description} weather</div>
                </div>
            </div>
        `;
    }

    displayMovies() {
        const weatherConfig = CONFIG.WEATHER_TO_GENRE[this.moviesData[0].weatherCondition];

        this.moviesSubtitle.textContent = `Perfect ${weatherConfig.description} weather picks for you`;

        this.moviesGrid.innerHTML = this.moviesData.map(movie => `
            <div class="movie-card">
                <img 
                    src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450/434343/ffffff?text=No+Poster'}" 
                    alt="${movie.Title} Poster"
                    class="movie-poster"
                    loading="lazy"
                >
                <div class="movie-info">
                    <h3 class="movie-title">${movie.Title}</h3>
                    <div class="movie-meta">
                        <span class="movie-year">${movie.Year}</span>
                    </div>
                    <div class="match-score-container">
                        <div class="match-label">Weather Match</div>
                        <div class="match-score-bar">
                            <div class="match-score-fill" style="width: ${movie.weatherMatchScore}%"></div>
                        </div>
                        <div class="match-score-value">${movie.weatherMatchScore}%</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showLoading() {
        this.hideAllStates();
        this.loadingState.classList.remove('hidden');
        this.searchBtn.disabled = true;
    }

    showError(message) {
        this.hideAllStates();
        this.errorMessage.textContent = message;
        this.errorState.classList.remove('hidden');
        this.searchBtn.disabled = false;
    }

    showEmpty() {
        this.hideAllStates();
        this.emptyState.classList.remove('hidden');
        this.searchBtn.disabled = false;
    }

    showResults() {
        this.hideAllStates();
        this.resultsSection.classList.remove('hidden');
        this.searchBtn.disabled = false;
    }

    hideAllStates() {
        this.loadingState.classList.add('hidden');
        this.errorState.classList.add('hidden');
        this.emptyState.classList.add('hidden');
        this.resultsSection.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MovieNightPlanner();
});
