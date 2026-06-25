CREATE INDEX IF NOT EXISTS idx_reviews_tmdb_id ON reviews (tmdb_id);
CREATE INDEX IF NOT EXISTS idx_likes_review_id ON likes (review_id);
