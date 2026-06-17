const API_URL = "http://localhost:3000";

export interface ReviewSummary {
  id: string;
  headline: string;
  standfirst: string | null;
  cover_url: string | null;
  rating: number | null;
  published_at: string;
  author_username: string;
  author_name: string | null;
  tmdb_id: number;
  movie_title: string;
  release_year: number | null;
  poster_path: string | null;
}

export async function getFeed(): Promise<ReviewSummary[]> {
  const res = await fetch(`${API_URL}/api/reviews`);
  if (!res.ok) throw new Error("échec du chargement du feed");
  const data = await res.json();
  return data.reviews;
}


///////////////////////////


export interface ReviewFull extends ReviewSummary {
  body: string;
  created_at: string;
  author_avatar: string | null;
  author_bio: string | null;
}

export async function getReview(id: string): Promise<ReviewFull> {
  const res = await fetch(`${API_URL}/api/reviews/${id}`);
  if (res.status === 404) throw new Error("Critique introuvable");
  if (!res.ok) throw new Error("échec du chargement");
  const data = await res.json();
  return data.review;
}

///////////////////

const TOKEN_KEY = "judge_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
}

export async function loginRequest(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Identifiants invalides");
  return res.json();
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Session expirée");
  const data = await res.json();
  return data.user;
}

////////////////////////////// Recherche et publication 

export interface MovieResult {
  tmdb_id: number;
  title: string;
  release_year: number | null;
  poster_path: string | null;
}

export async function searchMovies(query: string): Promise<MovieResult[]> {
  const res = await fetch(`${API_URL}/api/movies/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("échec de la recherche");
  const data = await res.json();
  return data.movies;
}

export interface NewReviewInput {
  tmdb_id: number;
  headline: string;
  standfirst: string;
  body: string;
  rating: number | null;
  publish: boolean;
}

export async function createReview(input: NewReviewInput): Promise<{ id: string }> {
  const token = getToken();
  if (!token) throw new Error("Non connecté");

  const res = await fetch(`${API_URL}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("échec de la publication");
  const data = await res.json();
  return data.review;
}