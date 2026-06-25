import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFeed, getFollowingFeed, type ReviewSummary } from "../api";
import { useAuth } from "../auth";
import Navbar from "../components/Navbar";
import MovieBanner from "../components/MovieBanner";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

type Tab = "tous" | "abonnements";

export default function Home() {
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("tous");
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchFn = tab === "tous" ? getFeed() : getFollowingFeed();
    fetchFn
      .then(setReviews)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab]);

  const lead = reviews[0];
  const rest = reviews.slice(1);

  const bannerPosters = reviews
    .filter((r) => r.poster_path !== null)
    .map((r) => ({ path: r.poster_path as string, title: r.movie_title }));

  return (
    <>
      <Navbar />
      <MovieBanner posters={bannerPosters} />
      <div className="mx-auto max-w-5xl px-6 py-8 font-sans text-neutral-900">
        {user && (
          <div className="mb-6 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("tous")}
              className={`rounded-full px-5 py-1.5 text-sm font-medium ${
                tab === "tous"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setTab("abonnements")}
              className={`rounded-full px-5 py-1.5 text-sm font-medium ${
                tab === "abonnements"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Abonnements
            </button>
          </div>
        )}

        <div aria-live="polite">
          {loading && <p className="mt-8 text-neutral-500">Chargement…</p>}
          {error && <p className="mt-8 text-red-600">{error}</p>}
        </div>

        {!loading && !error && reviews.length === 0 && (
          <p className="mt-8 text-neutral-500">
            {tab === "abonnements" ? (
              "Suivez des critiques pour voir leur feed ici."
            ) : (
              <>
                Aucune critique pour l'instant.{" "}
                {user ? (
                  <Link to="/new" className="text-neutral-900 hover:underline">
                    Publiez la première.
                  </Link>
                ) : (
                  <Link to="/login" className="text-neutral-900 hover:underline">
                    Connectez-vous pour écrire.
                  </Link>
                )}
              </>
            )}
          </p>
        )}

        {!loading && !error && reviews.length > 0 && (
          <article className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[1.8fr_1fr]">
            <div>
              {lead.poster_path && (
                <img
                  src={IMG_BASE + lead.poster_path}
                  alt={`Affiche de ${lead.movie_title}`}
                  className="mb-4 aspect-[2/3] w-full rounded-lg object-cover"
                />
              )}
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-900">
                Édito du jour
              </span>
              <h2 className="mt-1 font-serif text-4xl leading-tight">
                <Link to={`/reviews/${lead.id}`} className="hover:underline">
                  {lead.headline}
                </Link>
              </h2>
              {lead.standfirst && (
                <p className="mt-2 text-lg text-neutral-600">{lead.standfirst}</p>
              )}
              <p className="mt-3 text-sm text-neutral-500">
                <Link to={`/u/${lead.author_username}`} className="hover:underline">
                  {lead.author_name ?? lead.author_username}
                </Link>
                {lead.rating != null && ` · ${lead.rating}/10`}
              </p>
            </div>

            <aside className="border-l border-neutral-200 pl-6">
              <h3 className="text-xs uppercase tracking-wider text-neutral-400">
                Autres parutions
              </h3>
              <div className="mt-3 flex flex-col divide-y divide-neutral-200">
                {rest.map((r) => (
                  <div key={r.id} className="py-3">
                    <h4 className="font-serif text-lg leading-tight">
                      <Link to={`/reviews/${r.id}`} className="hover:underline">
                        {r.headline}
                      </Link>
                    </h4>
                    <p className="text-sm text-neutral-500">
                      <Link to={`/u/${r.author_username}`} className="hover:underline">
                        {r.author_name ?? r.author_username}
                      </Link>
                      {r.rating != null && ` · ${r.rating}/10`}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </article>
        )}
      </div>
    </>
  );
}
