CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(30) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  VARCHAR(60),
  bio           TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE movies (
  tmdb_id      INTEGER PRIMARY KEY,
  title        TEXT NOT NULL,
  release_year INTEGER,
  poster_path  TEXT,
  cached_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id      INTEGER NOT NULL REFERENCES movies(tmdb_id),
  headline     VARCHAR(140) NOT NULL,
  standfirst   VARCHAR(280),
  body         TEXT NOT NULL,
  cover_url    TEXT,
  rating       NUMERIC(3,1) CHECK (rating BETWEEN 0 AND 10),
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

CREATE TABLE likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id  UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(80) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE list_items (
  list_id  UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  tmdb_id  INTEGER NOT NULL REFERENCES movies(tmdb_id),
  position INTEGER,
  PRIMARY KEY (list_id, tmdb_id)
);

CREATE INDEX idx_reviews_published ON reviews(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_reviews_author ON reviews(author_id);
CREATE INDEX idx_comments_review ON comments(review_id);