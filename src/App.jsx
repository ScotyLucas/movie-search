import { useEffect, useState } from 'react'
import { useDebounce } from 'react-use';
import Search from "./components/Search";
import './index.css'
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';

const URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [movielist, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useDebounce(() => setDebouncedSearch(searchTerm), 500, [searchTerm]);

  const fetchStreamingProviders = async (movieId) => {
    try {
      const response = await fetch(`${URL}/movie/${movieId}/watch/providers`, API_OPTIONS);
      const data = await response.json();
      const providers = data.results?.HU?.flatrate || data.results?.HU?.buy || data.results?.HU?.rent;

      if (providers && providers.length > 0) {
        return providers.map(provider => provider.provider_name).join(', ');
      } else {
        return "Sorry, we can't provide platform";
      }
    } catch (error) {
      console.error('Error fetching streaming providers:', error);
      return "Sorry, we can't provide platform";
    }
  };

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const endpoint = query
          ? `${URL}/search/movie?query=${encodeURIComponent(query)}`
          : `${URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      if (data.Response === 'False') {
        setErrorMsg(data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }

      // Minden filmhez lekéri a streaming adatokat
      const moviesWithStreams = await Promise.all(
          data.results.map(async (movie) => {
            const stream = await fetchStreamingProviders(movie.id);
            return { ...movie, stream };
          })
      );

      setMovieList(moviesWithStreams);
    } catch (error) {
      console.error(error);
      setErrorMsg('Something went wrong!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearch);
  }, [debouncedSearch]);

  return (
      <main>
        <div className='pattern' />

        <div className='wrapper'>
          <header>
            <img src='./hero.png' alt='Hero banner' />
            <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>
          </header>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <section className='all-movies'>
            <h2 className='mt-[40px]'>All Movies</h2>

            {isLoading ? (
                <Spinner />
            ) : errorMsg ? (
                <p className='text-red-500'>{errorMsg}</p>
            ) : (
                <ul>
                  {movielist.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                  ))}
                </ul>
            )}
          </section>
        </div>
      </main>
  );
};

export default App;
