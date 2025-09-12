import React, { useState } from 'react';
import axios from 'axios';

const API_KEY = '936f445d12fc3638b712080e3f499f43'; // Replace with your TMDb key

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // New state to hold error message

  const searchMovies = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError(''); // Reset error message before making the request

    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie`,
        {
          params: {
            api_key: API_KEY,
            query: query,
          },
        }
      );

      if (response.data.results.length === 0) {
        setError('No movies found for your search. Please try again!');
      } else {
        setResults(response.data.results);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Something went wrong. Please try again later.'); // Display error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={searchMovies} className="search-form">
        <input
          type="text"
          placeholder="Search for a movie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
      </form>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          {error && <div className="error-message">{error}</div>} {/* Display error message */}
          <ul className="results-list">
            {results.map((movie) => (
              <li className="result-item" key={movie.id}>
                <a
                  href={`https://www.themoviedb.org/movie/${movie.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-link"
                >
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                        : 'https://via.placeholder.com/92x138?text=No+Image'
                    }
                    alt={movie.title}
                    className="poster"
                  />
                  <div className="movie-info">
                    <h3>{movie.title}</h3>
                    <p>
                      {movie.release_date?.substring(0, 4)} | ⭐ {movie.vote_average}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default SearchBar;
