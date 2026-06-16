import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getReview, type ReviewFull } from "../api";

const IMG_BASE = "https://image.tmdb.org/t/p/w780";

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getReview(id)
      .then(setReview)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-8 text-neutral-500">Chargement…</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!review) return null;

  const cover = review.cover_url ?? (review.poster_path ? IMG_BASE + review.poster_path : null);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 font-sans text-neutral-900">
      <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Retour à la une
      </Link>

      <p className="mt-6 text-sm uppercase tracking-wider text-neutral-500">
        {review.movie_title}
        {review.release_year && ` (${review.release_year})`}
      </p>
      <h1 className="mt-2 font-serif text-4xl leading-tight">{review.headline}</h1>
      {review.standfirst && (
        <p className="mt-3 text-xl text-neutral-600">{review.standfirst}</p>
      )}

      <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
        <span>{review.author_name ?? review.author_username}</span>
        {review.rating != null && (
          <>
            <span>·</span>
            <span className="font-medium text-neutral-900">{review.rating}/10</span>
          </>
        )}
      </div>

      {cover && (
        <img
          src={cover}
          alt={review.movie_title}
          className="mt-6 w-full rounded-lg object-cover"
        />
      )}

      <div className="prose prose-neutral mt-8 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{review.body}</ReactMarkdown>
      </div>
    </div>
  );
}