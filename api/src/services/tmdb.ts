const TMDB_BASE = "https://api.themoviedb.org/3"

export interface TmdbMovie {
	tmdb_id: number;
	title: string;
	release_year: number | null;
	poster_path: string | null;
}

export async function fetchMovie(tmdbId: number): Promise<TmdbMovie | null> {
 const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?language=fr-FR`, {  //connexion to tmdb
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
      Accept: "application/json",
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);

  const data = await res.json(); 					//parsing of the answer
  return {
    tmdb_id: data.id,
    title: data.title,
    release_year: data.release_date
      ? Number(data.release_date.slice(0, 4))
      : null,
    poster_path: data.poster_path,
  };
}

async function fetchSearchPage(query: String, page: number): Promise<TmdbMovie[]> {
  const res = await fetch(
    `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
        Accept: "application/json",
      },
    }
  );
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  const data = await res.json();
  return data.results.map((m: any) => ({
    tmdb_id: m.id,
    title: m.title,
    release_year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    poster_path: m.poster_path,
  }));
}

export async function searchMovies(query: String): Promise<TmdbMovie[]> {
  const [page1, page2] = await Promise.all([
    fetchSearchPage(query, 1),
    fetchSearchPage(query, 2),
  ]);
  const seen = new Set<number>();
  return [...page1, ...page2].filter((m) => {
    if (seen.has(m.tmdb_id)) return false;
    seen.add(m.tmdb_id);
    return true;
  });
}