import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { searchMovies, createReview, type MovieResult } from "../api";

const IMG_BASE = "https://image.tmdb.org/t/p/w92";

export default function NewReview() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Recherche film
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieResult[]>([]);
  const [selected, setSelected] = useState<MovieResult | null>(null);

  // Champs de la critique
  const [headline, setHeadline] = useState("");
  const [standfirst, setStandfirst] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Protection : on redirige les non-connectés vers /login
  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (loading) return <p className="p-8 text-neutral-500">Chargement…</p>;
  if (!user) return null;

  async function handleSearch() {
    if (query.trim().length === 0) return;
    try {
      setResults(await searchMovies(query));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handlePublish() {
    if (!selected || !headline || !body) {
      setError("Film, titre et corps sont requis");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const review = await createReview({
        tmdb_id: selected.tmdb_id,
        headline,
        standfirst,
        body,
        rating: rating ? Number(rating) : null,
        publish: true,
      });
      navigate(`/reviews/${review.id}`); // direction l'article publié
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 font-sans text-neutral-900">
      <h1 className="font-serif text-3xl">Écrire une critique</h1>

      {/* Étape 1 : choisir le film */}
      {!selected ? (
        <div className="mt-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Chercher un film…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2"
            />
            <button
              onClick={handleSearch}
              className="rounded-md bg-neutral-900 px-4 py-2 text-white"
            >
              Chercher
            </button>
          </div>
          <ul className="mt-4 divide-y divide-neutral-200">
            {results.map((m) => (
              <li
                key={m.tmdb_id}
                onClick={() => setSelected(m)}
                className="flex cursor-pointer items-center gap-3 py-2 hover:bg-neutral-50"
              >
                {m.poster_path && (
                  <img src={IMG_BASE + m.poster_path} alt="" className="h-14 rounded" />
                )}
                <span>
                  {m.title}
                  {m.release_year && <span className="text-neutral-500"> ({m.release_year})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Étape 2 : rédiger */
        <div className="mt-6 flex flex-col gap-3">
          <p className="text-sm text-neutral-500">
            Film : <strong>{selected.title}</strong>{" "}
            <button onClick={() => setSelected(null)} className="text-blue-700 hover:underline">
              changer
            </button>
          </p>
          <input
            type="text"
            placeholder="Titre de l'article"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 font-serif text-lg"
          />
          <input
            type="text"
            placeholder="Chapô (accroche)"
            value={standfirst}
            onChange={(e) => setStandfirst(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          <textarea
            placeholder="Votre critique (markdown supporté)…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
          />
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="Note /10 (optionnel)"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-40 rounded-md border border-neutral-300 px-3 py-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handlePublish}
            disabled={submitting}
            className="self-start rounded-md bg-neutral-900 px-5 py-2 text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {submitting ? "Publication…" : "Publier"}
          </button>
        </div>
      )}
    </div>
  );
}