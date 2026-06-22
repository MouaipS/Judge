import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { likeReview, unlikeReview } from "../api";

interface Props {
  reviewId: string;
  initialCount: number;
  initialLiked: boolean;
}

export default function LikeButton({ reviewId, initialCount, initialLiked }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle(e: React.MouseEvent) {
    // Le bouton est souvent dans un <Link> (cartes du feed) :
    // on empêche la navigation au clic sur le cœur
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }
    if (pending) return;

    // On garde l'état actuel pour pouvoir revenir en arrière si erreur
    const prevLiked = liked;
    const prevCount = count;

    // Mise à jour optimiste : l'UI réagit immédiatement
    setLiked(!prevLiked);
    setCount(prevCount + (prevLiked ? -1 : 1));
    setPending(true);

    try {
      const res = prevLiked
        ? await unlikeReview(reviewId)
        : await likeReview(reviewId);
      // On réaligne sur la vérité du serveur (compteur exact)
      setLiked(res.liked);
      setCount(res.like_count);
    } catch {
      // Échec → rollback
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={liked}
      className={`inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70 disabled:opacity-50 ${
        liked ? "text-red-600" : "text-neutral-500"
      }`}
    >
      <span className="text-base leading-none">{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}