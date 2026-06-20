import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProfile, type AuthorProfile } from "../api";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth";




const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function excerpt(markdown: string, max = 200): string {
  const plain = markdown
    .replace(/[#>*_`~]/g, "")        // enlève les marqueurs Markdown courants
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [texte](url) -> texte
    .replace(/\s+/g, " ")            // écrase les sauts de ligne
    .trim();
  return plain.length > max ? plain.slice(0, max).trimEnd() + "…" : plain;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getProfile(username)
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  const { user } = useAuth();
const isOwnProfile = !!user && !!profile && user.username === profile.user.username;


  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-8 font-sans text-neutral-900">
        {loading && <p className="text-neutral-500">Chargement…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {profile && (
          <>
            {/* En-tête du profil */}
            <header className="flex items-center gap-5 border-b border-neutral-200 pb-8">
              {profile.user.avatar_url ? (
                <img
                  src={profile.user.avatar_url}
                  alt={profile.user.username}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-200 font-serif text-3xl text-neutral-500">
                  {(profile.user.display_name ?? profile.user.username)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
			  
			  
              <div>
                <h1 className="font-serif text-4xl leading-none">
                  {profile.user.display_name ?? profile.user.username}
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  @{profile.user.username} · {profile.review_count}{" "}
                  {profile.review_count > 1 ? "critiques" : "critique"}
                </p>
				{isOwnProfile && (
    <Link to="/settings" className="mt-1 inline-block text-sm text-blue-700 hover:underline">
      Éditer le profil
    </Link>
  )}
                {profile.user.bio && (
                  <p className="mt-3 max-w-xl text-sm text-neutral-700">
                    {profile.user.bio}
                  </p>
                )}
              </div>
            </header>

            {/* Liste des critiques */}
            <section className="mt-8 space-y-6">
              {profile.reviews.length === 0 && (
                <p className="text-neutral-500">Aucune critique publiée.</p>
              )}

              {profile.reviews.map((r) => (
                <Link
                  key={r.id}
                  to={`/reviews/${r.id}`}
                  className="flex gap-4 border-b border-neutral-100 pb-6 hover:opacity-80"
                >
                  {r.poster_path && (
                    <img
                      src={`${IMG_BASE}${r.poster_path}`}
                      alt={r.movie_title}
                      className="h-28 w-20 flex-shrink-0 rounded object-cover"
                    />
                  )}
                  <div>
                    <h2 className="font-serif text-2xl leading-tight">
                      {r.headline}
                    </h2>
                    <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500">
                      {r.movie_title}
                      {r.release_year ? ` (${r.release_year})` : ""}
                      {r.rating != null ? ` · ${r.rating}/10` : ""}
                    </p>
					{r.standfirst ? (
					  <p className="mt-2 text-sm text-neutral-700">{r.standfirst}</p>
					) : (
					  <p className="mt-2 text-sm text-neutral-700">{excerpt(r.body)}</p>
					)}
                    {r.standfirst && (
                      <p className="mt-2 text-sm text-neutral-700">
                        {r.standfirst}
                      </p>
					  
                    )}						
                  </div>
                </Link>
              ))}
            </section>
          </>
        )}
      </div>
    </>
  );
}