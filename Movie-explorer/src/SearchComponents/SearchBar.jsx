import React, { useState } from 'react';
import axios from 'axios';
import MovieDetailsModal from '../Components/MovieDetailsModal';
import StarIcon from '@mui/icons-material/Star';

const API_KEY = '936f445d12fc3638b712080e3f499f43'; // Replace with your TMDb key

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const searchMovies = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError('');

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
        setResults([]);
      } else {
        setResults(response.data.results);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Something went wrong. Please try again later.');
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
          {error && <div className="error-message">{error}</div>}
          {results.length > 0 && (
            <ul className="results-list">
              {results.map((movie) => (
                <li 
                  className="result-item" 
                  key={movie.id}
                  onClick={() => setSelectedMovieId(movie.id)}
                >
                  <div className="result-link">
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
                      <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{movie.release_date?.substring(0, 4)}</span>
                        <span>|</span>
                        <StarIcon style={{ fontSize: '0.95rem', color: 'var(--star-color)' }} />
                        <span>{movie.vote_average?.toFixed(1)}</span>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Movie Details Modal */}
      {selectedMovieId && (
        <MovieDetailsModal
          movieId={selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
        />
      )}
    </div>
  );
}

export default SearchBar;
