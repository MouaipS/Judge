import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { getProfile, updateProfile } from "../api";
import Navbar from "../components/Navbar";

export default function EditProfile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  // Redirige les non-connectés
  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  // Pré-remplit avec les valeurs actuelles
  useEffect(() => {
    if (!user) return;
    getProfile(user.username)
      .then((p) => {
        setBio(p.user.bio ?? "");
        setAvatarUrl(p.user.avatar_url ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
  }, [user]);

  if (loading || !user) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
      navigate(`/u/${user.username}`); // retour sur le profil mis à jour
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-8 font-sans text-neutral-900">
        <h1 className="font-serif text-3xl">Éditer le profil</h1>

        {!ready ? (
          <p className="mt-6 text-neutral-500">Chargement…</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-neutral-600">Bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Quelques mots sur vous…"
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-neutral-600">URL de l'avatar</span>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>

            {/* Aperçu live */}
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="Aperçu"
                className="h-20 w-20 rounded-full object-cover"
              />
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="self-start rounded-md bg-neutral-900 px-5 py-2 text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}