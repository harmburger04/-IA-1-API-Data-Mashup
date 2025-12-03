const CONFIG = {
    OMDB_API_KEY: 'YOUR_API_KEY_HERE',
    OMDB_BASE_URL: 'https://www.omdbapi.com/',
    GEOCODING_URL: 'https://geocoding-api.open-meteo.com/v1/search',
    WEATHER_URL: 'https://api.open-meteo.com/v1/forecast',

    WEATHER_TO_GENRE: {
        clear: { genres: ['action', 'adventure', 'family'], emoji: '', description: 'sunny' },
        rainy: { genres: ['drama', 'romance', 'comedy'], emoji: '', description: 'rainy' },
        cloudy: { genres: ['mystery', 'thriller', 'crime'], emoji: '', description: 'cloudy' },
        snowy: { genres: ['fantasy', 'animation', 'family'], emoji: '', description: 'snowy' },
        stormy: { genres: ['horror', 'thriller', 'sci-fi'], emoji: '', description: 'stormy' },
        cold: { genres: ['horror', 'thriller', 'mystery'], emoji: '', description: 'cold' },
        hot: { genres: ['action', 'adventure', 'comedy'], emoji: '', description: 'hot' }
    },

    WEATHER_CODE_MAP: {
        0: 'clear',
        1: 'clear',
        2: 'cloudy',
        3: 'cloudy',
        45: 'cloudy',
        48: 'cloudy',
        51: 'rainy',
        53: 'rainy',
        55: 'rainy',
        61: 'rainy',
        63: 'rainy',
        65: 'rainy',
        71: 'snowy',
        73: 'snowy',
        75: 'snowy',
        77: 'snowy',
        80: 'rainy',
        81: 'rainy',
        82: 'stormy',
        85: 'snowy',
        86: 'snowy',
        95: 'stormy',
        96: 'stormy',
        99: 'stormy'
    },

    MOVIE_SEARCHES: {
        action: ['avengers', 'mission', 'fast', 'john wick', 'transformers'],
        adventure: ['indiana jones', 'jurassic', 'journey', 'pirates', 'avatar'],
        comedy: ['hangover', 'wedding', 'home alone', 'deadpool', 'austin powers'],
        drama: ['godfather', 'shawshank', 'forrest gump', 'beautiful mind', 'prestige'],
        horror: ['conjuring', 'exorcist', 'halloween', 'scream', 'shining'],
        mystery: ['inception', 'shutter island', 'gone girl', 'memento', 'usual suspects'],
        romance: ['notebook', 'titanic', 'love actually', 'eternal sunshine', 'proposiasl'],
        'sci-fi': ['matrix', 'blade runner', 'interstellar', 'arrival', 'star wars'],
        thriller: ['dark knight', 'silence lambs', 'seven', 'prisoners', 'departed'],
        fantasy: ['lord rings', 'harry potter', 'hobbit', 'chronicles narnia', 'alice wonderland'],
        animation: ['toy story', 'finding nemo', 'frozen', 'lion king', 'up'],
        family: ['incredibles', 'moana', 'despicable', 'shrek', 'minions'],
        crime: ['goodfellas', 'casino', 'heat', 'reservoir dogs', 'pulp fiction']
    }
};
