# Movie Night Planner

A web app that picks movies based on your city's weather. Simple idea: if its raining outside, maybe you want something cozy to watch.

## What it does

Combines two APIs to make movie suggestions:
* Open-Meteo for weather data
* OMDb for movie info

Type in your city, get the current weather, and the app recommends movies that fit the vibe. Each movie gets a "weather match score" so you can see how well it fits.

## APIs Used

**Open-Meteo Weather API**
* Link: https://open-meteo.com/
* Free to use, no API key needed
* Gets weather data and converts city names to coordinates
* Query params: city name, latitude, longitude, current_weather flag

**OMDb API (Open Movie Database)**  
* Link: https://www.omdbapi.com/
* Movie database with titles, years, posters, ratings
* Free tier gives you 1000 requests per day
* Needs an API key (get one at https://www.omdbapi.com/apikey.aspx)
* Query params: search term, movie type filter, your API key

## Setup

You need a modern browser and internet. Also grab a free OMDb API key.

1. Get your API key from https://www.omdbapi.com/apikey.aspx (pick the FREE option)
2. Clone or download this repo
3. Open config.js and replace 'YOUR_API_KEY_HERE' with your actual key
4. Open index.html in your browser

Thats it. No server, no build step, nothing fancy.

## How to Use

Open index.html, type a city name like "London" or "Tokyo", hit the button. You'll see movies that match the weather.

## How the Data Join Works

The app does this in a few steps:

**Step 1: Get Weather**
```
You type: "London"
Geocoding API converts "London" to coordinates (51.5N, 0.1W)
Weather API uses those coords to get current weather
Returns: temp 12°C, weather code 61 (rain)
```

**Step 2: Map Weather to Genres**

I set up a mapping between weather and movie genres that make sense:

| Weather | Genres | Why |
|---------|--------|-----|
| Sunny | Action, Adventure, Family | Energietic vibes |
| Rainy | Drama, Romance, Comedy | Cozy indoor mood |
| Cloudy | Mystery, Thriller, Crime | Moody atmosphere |
| Snowy | Fantasy, Animation, Family | Magical feeling |
| Stormy | Horror, Thriller, Sci-Fi | Intense stuff |
| Cold | Horror, Thriller, Mystery | Chilling |
| Hot | Action, Adventure, Comedy | High energy |

**Step 3: Find Movies**

Once we know the weather, we search OMDb using keywords from those genres.

**Step 4: Calculate Match Scores**

Each movie gets scored 0-100 based on:

* Genre keywords in title (50% weight): Does the title have words related to the weather's genres? +30 if yes, +10 baseline
* How recent (25% weight): Newer movies score higher. Under 5 yrs = +20, 5-15 yrs = +10, 15-30 yrs = +5
* Has a poster (5%): +5 if it has one
* Random variation: Small randomness so results aren't identical every time

Example:
```
Movie: "The Dark Knight" (2008)  
Weather: Rainy (drama/romance/comedy genres)

Base: 50 points
"dark" keyword matches mystery genre: +30
Age is 17 years: +5
Has poster: +5
Random: +3
Total: 93/100
```

**Step 5: Display Everything**

Final output shows:
* Weather info: city, temp, condition
* Movie info: title, year, poster
* Match score for each movie

Movies sorted by score, best matches first.

## Features

What the assignment wanted:
* Two separate API calls (weather then movies)
* Query paramters used everywhere
* Data joined via weather-to-genre mapping
* Computed field (the match score)
* Shows 2-3 things from each API
* Loading spinner
* Error handling with retry
* Empty state if no results
* Rate limit detection

Extra stuff I added:
* Dark theme with gradients
* Animations
* Works on mobile
* Progress bars for scores
* Multiple search terms per genre for variety

## Error Handling

Handles these situations:

* Invalid city: tells you to check spelling
* Network problems: suggests retry
* Missing API key: reminds you to add one
* Invalid key: specific error message
* Rate limiting: detects 429 errors from OMDb, shows message, stops sending more requests
* No results: empty state message
* API down: fallback error with retry option

## Known Issues

Some things to watch out for:

1. **Rate Limits**: Free OMDb is 1000 req/day. Each search uses multiple requests so you can hit the limit if you test a lot.

2. **Genre Matching**: The weather-to-genre thing is just my best guess, not science. Some suggestions might seem weird.

3. **City Names**: If theres multiple cities with same name, it picks the first one. "Portland" gets you Oregon not Maine.

4. **No Auto-Refresh**: You gotta manually search again to get updated weather.

5. **Limited Movie Data**: OMDb search doesn't return full genre tags, so I match by keywords in titles which isn't perfect.

6. **API Key in Code**: Its visible in config.js. Fine for free tier but for real production you'd want a backend.

## Tech Stack

Built with plain HTML, CSS, and JavaScript. No frameworks, no build tools.

* HTML5
* CSS3 (gradients, custom props, animations)
* Vanilla JS (ES6+)
* Open-Meteo API
* OMDb API

## Files

```
index.html - main page
styles.css - all the styling  
config.js - API keys and mappings
app.js - the actual logic
README.md - this file
```

## Development Process

Built this using vanilla JavaScript without frameworks. Got help from various sources including AI for initial structure and debugging. All code tested and verified to work properly.

## Sources and References

**API Documentation:**
* Open-Meteo API docs: https://open-meteo.com/en/docs
* OMDb API reference: https://www.omdbapi.com/
* Geocoding API guide: https://open-meteo.com/en/docs/geocoding-api

**Technical Resources:**
* MDN Web Docs for JavaScript Fetch API and Promises
* Stack Overflow for error handling patterns
* CSS-Tricks for the glassmorphism effects
* W3Schools for responsive grid layouts

**Development Tools:**
* Chrome DevTools for debugging
* GitHub for version control
* VS Code as editor

Weather data from Open-Meteo (https://open-meteo.com/)
Movie data from OMDb (https://www.omdbapi.com/)
Using Inter font from Google Fonts
