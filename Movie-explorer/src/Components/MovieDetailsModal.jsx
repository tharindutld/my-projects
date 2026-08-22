import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import Button from '@mui/material/Button';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';

const API_KEY = '936f445d12fc3638b712080e3f499f43';

const MovieDetailsModal = ({ movieId, onClose }) => {
  const { user, addToWatchlist, removeFromWatchlist, isInWatchlist } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New review form state
  const [rating, setRating] = useState(10);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
        );
        setMovie(res.data);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details.');
      } finally {
        setLoading(false);
      }
    };

    const fetchMovieReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await api.get(`/reviews/${movieId}`);
        setReviews(res.data);
      } catch (err) {
        console.error('Error fetching movie reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
      fetchMovieReviews();
    }
  }, [movieId]);

  if (!movieId) return null;

  const handleWatchlistToggle = async () => {
    if (!user) {
      alert('Please log in to manage your watchlist.');
      return;
    }

    if (isInWatchlist(movie.id)) {
      await removeFromWatchlist(movie.id);
    } else {
      await addToWatchlist(movie);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (!user) {
      setReviewError('You must be logged in to submit a review.');
      return;
    }

    if (!reviewText.trim()) {
      setReviewError('Review text cannot be empty.');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post('/reviews', {
        movie_id: movie.id,
        rating,
        review_text: reviewText
      });

      // Insert new review at the beginning of the list
      setReviews(prev => [res.data.review, ...prev]);
      setReviewText('');
      setRating(10);
    } catch (err) {
      console.error('Error posting review:', err);
      setReviewError(err.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Loading movie details...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px' }} className="error-message">
            {error}
          </div>
        ) : (
          movie && (
            <>
              {/* Hero Banner Section */}
              <div className="modal-hero">
                <img
                  src={movie.backdrop_path 
                    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
                    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280'
                  }
                  alt={movie.title}
                  className="modal-backdrop"
                />
                <div className="modal-hero-overlay"></div>
              </div>

              {/* Main Body */}
              <div className="modal-body">
                {/* Header: Poster + Title Info */}
                <div className="modal-header-section">
                  <img
                    src={movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : 'https://via.placeholder.com/500x750?text=No+Image'
                    }
                    alt={movie.title}
                    className="modal-poster"
                  />
                  <div className="modal-title-info">
                    <h2>{movie.title}</h2>
                    {movie.tagline && <p className="modal-tagline">"{movie.tagline}"</p>}
                    
                    <div className="modal-meta-row">
                      <span className="modal-meta-badge">{movie.release_date?.slice(0, 4)}</span>
                      <span className="modal-meta-badge">{formatRuntime(movie.runtime)}</span>
                      <div className="modal-rating">
                        <StarIcon fontSize="small" />
                        <span>{movie.vote_average?.toFixed(1)} / 10</span>
                      </div>
                    </div>

                    <div className="modal-actions">
                      <Button
                        className="watchlist-btn"
                        variant={isInWatchlist(movie.id) ? "outlined" : "contained"}
                        color={isInWatchlist(movie.id) ? "secondary" : "primary"}
                        onClick={handleWatchlistToggle}
                        startIcon={isInWatchlist(movie.id) ? <BookmarkRemoveIcon /> : <BookmarkAddIcon />}
                        sx={{
                          borderRadius: '30px',
                          textTransform: 'none',
                          padding: '8px 24px',
                          fontWeight: 600,
                          backgroundColor: isInWatchlist(movie.id) ? 'transparent' : 'var(--accent)',
                          color: '#ffffff',
                          borderColor: isInWatchlist(movie.id) ? '#ff3e6c' : 'transparent',
                          '&:hover': {
                            backgroundColor: isInWatchlist(movie.id) ? 'rgba(255, 62, 108, 0.08)' : 'var(--accent-hover)',
                            borderColor: isInWatchlist(movie.id) ? '#ff3e6c' : 'transparent',
                          }
                        }}
                      >
                        {isInWatchlist(movie.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Genre Tag Section */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '-10px' }}>
                  {movie.genres?.map(genre => (
                    <span key={genre.id} className="modal-meta-badge" style={{ borderRadius: '20px', padding: '4px 14px', fontSize: '0.8rem' }}>
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Overview / Plot */}
                <div className="modal-overview">
                  <h3>Overview</h3>
                  <p>{movie.overview || 'No synopsis available for this movie.'}</p>
                </div>

                {/* Cast Section */}
                {movie.credits?.cast && movie.credits.cast.length > 0 && (
                  <div className="modal-overview">
                    <h3>Principal Cast</h3>
                    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                      {movie.credits.cast.slice(0, 6).map(actor => (
                        <div key={actor.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px', textAlign: 'center' }}>
                          <img
                            src={actor.profile_path
                              ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                              : 'https://via.placeholder.com/185x278?text=No+Photo'
                            }
                            alt={actor.name}
                            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)', marginBottom: '8px' }}
                          />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-primary)' }}>
                            {actor.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {actor.character}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews Section */}
                <div className="modal-reviews">
                  <h3>User Reviews ({reviews.length})</h3>

                  {reviewsLoading ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading reviews...</p>
                  ) : reviews.length === 0 ? (
                    <p className="no-reviews">No reviews yet. Be the first to review this movie!</p>
                  ) : (
                    <div className="reviews-list-container">
                      {reviews.map(review => (
                        <div key={review.id} className="review-card-item">
                          <div className="review-header">
                            <div className="review-user-info">
                              <span className="review-username">{review.username}</span>
                              <div className="review-rating-badge">
                                <StarIcon style={{ fontSize: '0.9rem' }} />
                                <span>{review.rating}/10</span>
                              </div>
                            </div>
                            <span className="review-date">
                              {new Date(review.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <p className="review-text">{review.review_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Write Review Form */}
                <div className="modal-write-review">
                  <h3>Write a Review</h3>

                  {user ? (
                    <form onSubmit={handleReviewSubmit} className="review-form">
                      {reviewError && (
                        <div className="error-message" style={{ margin: '0 0 10px 0', fontSize: '0.85rem' }}>
                          {reviewError}
                        </div>
                      )}
                      
                      <div className="review-form-row">
                        <label htmlFor="rating-select" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Your Rating:</label>
                        <div className="rating-select-container">
                          <select
                            id="rating-select"
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                          >
                            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(num => (
                              <option key={num} value={num}>{num} ★</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <textarea
                        placeholder="Share your thoughts about this movie..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        required
                      ></textarea>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="submit-review-btn"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  ) : (
                    <div className="login-to-review">
                      <p style={{ margin: '0 0 12px 0' }}>You need to be logged in to leave a review.</p>
                      <a href="/Login" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none' }}>
                        Log In Now
                      </a>
                    </div>
                  )}
                </div>

              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default MovieDetailsModal;
