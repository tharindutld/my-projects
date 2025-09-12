// BrowseMovies.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_KEY = '936f445d12fc3638b712080e3f499f43'; // Replace with your TMDB API key
const CATEGORY = 'popular'; // or 'top_rated', 'upcoming', etc.

const BrowseMovies = () => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMovies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`https://api.themoviedb.org/3/movie/${CATEGORY}`, {
        params: {
          api_key: API_KEY,
          page,
        },
      });
      setMovies(prev => [...prev, ...res.data.results]);
    } catch (err) {
      setError('Failed to load movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [page]);

  return (
    <div className="browse-container">
      <h1 className="browse-title">Browse Movies</h1>

      {error && <p className="error-message">{error}</p>}

      <div className="movies-grid">
        {movies.map(movie => (
          <a
            key={movie.id}
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="movie-card"
          >
            <img
              src={movie.poster_path
                ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                : 'https://via.placeholder.com/300x450?text=No+Image'}
              alt={movie.title}
              className="movie-poster"
            />
            <div className="movie-info">
              <h3>{movie.title}</h3>
              <p>{movie.release_date?.slice(0, 4)} | ⭐ {movie.vote_average}</p>
            </div>
          </a>
        ))}
      </div>

      {loading && <p className="loading">Loading...</p>}

      <button className="load-more" onClick={() => setPage(prev => prev + 1)}>
        Load More
      </button>
    </div>
  );
};

export default BrowseMovies;
