import React, { useState, useContext } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import MovieDetailsModal from '../Components/MovieDetailsModal';
import { AuthContext } from '../context/AuthContext';
import StarIcon from '@mui/icons-material/Star';

const MovieGrid = ({ movies }) => {
  const { user, watchlist } = useContext(AuthContext);
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const handleWatchlistCardClick = (watchlistItem) => {
    setSelectedMovieId(watchlistItem.movie_id);
  };

  return (
    <Box className="movie-grid-container">
      {/* Watchlist Section (Only visible to logged-in users who have items in it) */}
      {user && watchlist.length > 0 && (
        <Box sx={{ mb: 6 }} className="watchlist-section">
          <Typography variant="h4" className="movie-grid-title" sx={{ mb: 3 }}>
            My Watchlist
          </Typography>
          <Grid container spacing={3} justifyContent="flex-start">
            {watchlist.map((movie) => (
              <Grid item key={movie.movie_id} xs={6} sm={4} md={3} lg={2.4}>
                <Card 
                  className="movie-card" 
                  sx={{ height: '100%' }}
                  onClick={() => handleWatchlistCardClick(movie)}
                >
                  <CardMedia
                    component="img"
                    image={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : 'https://via.placeholder.com/500x750?text=No+Image'
                    }
                    alt={movie.title}
                    sx={{ height: '240px' }}
                  />
                  <CardContent className="movie-card-content" sx={{ p: '12px !important' }}>
                    <Typography 
                      variant="h6" 
                      className="movie-title"
                      sx={{ fontSize: '0.95rem !important', fontWeight: '700 !important' }}
                    >
                      {movie.title}
                    </Typography>
                    <Typography className="movie-info" sx={{ fontSize: '0.8rem !important' }}>
                      {movie.release_date?.substring(0, 4)} • <StarIcon style={{ fontSize: '0.9rem', color: 'var(--star-color)', marginRight: '2px' }} /> {Number(movie.vote_average).toFixed(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Popular Movies Section */}
      <Typography variant="h4" className="movie-grid-title">
        Popular Movies
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {movies.map((movie) => (
          <Grid item key={movie.id} xs={12} sm={6} md={4} lg={3}>
            <Card 
              className="movie-card" 
              sx={{ height: '100%' }}
              onClick={() => setSelectedMovieId(movie.id)}
            >
              <CardMedia
                component="img"
                image={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : 'https://via.placeholder.com/500x750?text=No+Image'
                }
                alt={movie.title}
              />
              <CardContent className="movie-card-content">
                <Typography variant="h6" className="movie-title">
                  {movie.title}
                </Typography>
                <Typography className="movie-info">
                  {movie.release_date?.substring(0, 4)} • <StarIcon style={{ fontSize: '1rem', color: 'var(--star-color)', marginRight: '2px' }} /> {Number(movie.vote_average).toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Details Modal */}
      {selectedMovieId && (
        <MovieDetailsModal
          movieId={selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
        />
      )}
    </Box>
  );
};

export default MovieGrid;
