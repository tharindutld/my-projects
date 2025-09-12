import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MovieGrid from './MovieGrid';

const API_KEY = '936f445d12fc3638b712080e3f499f43';

const Home = () => {
  const [movies, setMovies] = useState([]);

  

  useEffect(() => {
    const fetchTrending = async () => {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`
      );
      setMovies(response.data.results);
    };
    fetchTrending();
  }, []);

  return <MovieGrid movies={movies} />;
};

export default Home;
