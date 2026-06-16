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