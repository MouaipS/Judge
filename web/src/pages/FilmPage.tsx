import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMovie, type MoviePage } from "../api";

const IMG_BASE = "https://image.tmdb.org/t/p/w342";

export default function FilmPage() {
  const { tmdbId } = useParams<{ tmdbId: string }>();
  const [data, setData] = useState<MoviePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tmdbId) return;
    getMovie(tmdbId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tmdbId]);

  if (loading) return <p className="p-8 text-neutral-500">Chargement…</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!data) return null;

  const { movie, reviews } = data;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 font-sans text-neutral-900">
      <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Retour à la une
      </Link>

      <div className="mt-6 flex gap-6">
        {movie.poster_path && (
          <img
            src={IMG_BASE + movie.poster_path}
            alt={movie.title}
            className="h-48 rounded-lg"
          />
        )}
        <div>
          <h1 className="font-serif text-4xl leading-tight">{movie.title}</h1>
          {movie.release_year && (
            <p className="text-neutral-500">{movie.release_year}</p>
          )}

          {/* La note cumulée */}
          <div className="mt-4 flex items-baseline gap-2">
            {movie.average_rating != null ? (
              <>
                <span className="font-serif text-4xl">{movie.average_rating}</span>
                <span className="text-neutral-500">/10</span>
              </>
            ) : (
              <span className="text-neutral-500">Pas encore noté</span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {movie.review_count} critique{movie.review_count > 1 ? "s" : ""}
            {movie.rating_count > 0 &&
              ` · moyenne sur ${movie.rating_count} note${
                movie.rating_count > 1 ? "s" : ""
              }`}
          </p>
        </div>
      </div>

      <h2 className="mt-10 border-b border-neutral-300 pb-2 font-serif text-2xl">
        Les critiques
      </h2>

      <ul className="mt-4 divide-y divide-neutral-200">
        {reviews.map((r) => (
          <li key={r.id} className="py-4">
            <Link to={`/reviews/${r.id}`} className="group">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl group-hover:underline">
                  {r.headline}
                </h3>
                {r.rating != null && (
                  <span className="font-medium">{r.rating}/10</span>
                )}
              </div>
              {r.standfirst && (
                <p className="mt-1 text-neutral-600">{r.standfirst}</p>
              )}
              <p className="mt-1 text-sm text-neutral-500">
                par {r.author_name ?? r.author_username}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}