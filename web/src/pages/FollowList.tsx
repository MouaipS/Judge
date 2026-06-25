import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getFollowers, getFollowing, type UserSummary } from "../api";
import Navbar from "../components/Navbar";

type Mode = "followers" | "following";

export default function FollowList({ mode }: { mode: Mode }) {
  const { username } = useParams<{ username: string }>();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    const fn = mode === "followers" ? getFollowers(username) : getFollowing(username);
    fn.then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username, mode]);

  const title = mode === "followers" ? "Abonnés" : "Abonnements";

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-8 font-sans text-neutral-900">
        <Link to={`/u/${username}`} className="text-sm text-neutral-500 hover:underline">
          ← @{username}
        </Link>
        <h1 className="mt-2 font-serif text-3xl">{title}</h1>

        {loading && <p className="mt-6 text-neutral-500">Chargement…</p>}
        {error && <p className="mt-6 text-red-600">{error}</p>}

        {!loading && !error && users.length === 0 && (
          <p className="mt-6 text-neutral-500">
            {mode === "followers" ? "Aucun abonné." : "Aucun abonnement."}
          </p>
        )}

        <ul className="mt-6 divide-y divide-neutral-100">
          {users.map((u) => (
            <li key={u.username} className="py-4">
              <Link to={`/u/${u.username}`} className="flex items-center gap-4 hover:opacity-80">
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt={u.username}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 font-serif text-xl text-neutral-500">
                    {(u.display_name ?? u.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-neutral-900">
                    {u.display_name ?? u.username}
                  </p>
                  <p className="text-sm text-neutral-500">@{u.username}</p>
                  {u.bio && (
                    <p className="mt-0.5 text-sm text-neutral-600 line-clamp-1">{u.bio}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
