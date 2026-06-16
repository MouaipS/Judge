import { useEffect, useState } from "react";
import { getFeed, type ReviewSummary } from "../api";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

export default function Home() {
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFeed()
      .then(setReviews)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8 text-neutral-500">Chargement…</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (reviews.length === 0)
    return <p className="p-8 text-neutral-500">Aucune critique pour l’instant.</p>;

  const [lead, ...rest] = reviews;
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 font-sans text-neutral-900">
     <header className="flex items-end justify-between border-b-2 border-neutral-900 pb-3">
		  <div>
		    <h1 className="font-serif text-5xl leading-none">Judge</h1>
		    <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500">
		      La critique de cinéma, par tous
		    </p>
		  </div>
		  <div className="text-sm">
		    {user ? (
		      <span className="flex items-center gap-3">
		        <span className="text-neutral-600">{user.display_name ?? user.username}</span>
		        <button onClick={logout} className="text-neutral-500 hover:text-neutral-900">
		          Déconnexion
		        </button>
		      </span>
		    ) : (
		      <Link to="/login" className="text-neutral-500 hover:text-neutral-900">
		        Connexion
		      </Link>
		    )}
		  </div>
		</header>

      <article className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[1.8fr_1fr]">
        <div>
          {lead.poster_path && (
            <img
              src={IMG_BASE + lead.poster_path}
              alt={lead.movie_title}
              className="mb-4 aspect-video w-full rounded-lg object-cover"
            />
          )}
          <span className="text-xs font-medium uppercase tracking-wider text-blue-700">
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
            {lead.author_name ?? lead.author_username}
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
                  {r.author_name ?? r.author_username}
                  {r.rating != null && ` · ${r.rating}/10`}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </article>
    </div>
  );
}