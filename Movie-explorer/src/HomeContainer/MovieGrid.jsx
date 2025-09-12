import React from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
} from '@mui/material';

const MovieGrid = ({ movies }) => {
  return (
    <Box className="movie-grid-container">
      <Typography variant="h4" className="movie-grid-title">
        Popular Movies
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {movies.map((movie) => (
          <Grid item key={movie.id} xs={12} sm={6} md={4} lg={3}>
            <a
              href={`https://www.themoviedb.org/movie/${movie.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Card className="movie-card" sx={{ height: '100%' }}>
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
                    {movie.release_date?.substring(0, 4)} • ⭐ {movie.vote_average}
                  </Typography>
                </CardContent>
              </Card>
            </a>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MovieGrid;
