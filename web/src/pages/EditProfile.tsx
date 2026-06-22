import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { getProfile, updateProfile, uploadAvatar } from "../api";
import Navbar from "../components/Navbar";

export default function EditProfile() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();

  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");          // URL affichée (serveur ou aperçu local)
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);       // sauvegarde de la bio
  const [uploading, setUploading] = useState(false); // upload de l'avatar
  const [ready, setReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    getProfile(user.username)
      .then((p) => {
        setBio(p.user.bio ?? "");
        setAvatar(p.user.avatar_url ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
  }, [user]);

  if (loading || !user) return null;

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    // Aperçu local instantané, le temps de l'aller-retour réseau
    const localPreview = URL.createObjectURL(file);
    setAvatar(localPreview);

    try {
      const updated = await uploadAvatar(file);
      setUser(updated);                    // user global à jour (navbar, etc.)
      setAvatar(updated.avatar_url ?? "");
    } catch (err: any) {
      setError(err.message);
      setAvatar(user.avatar_url ?? "");    // échec → on revient à l'avatar courant
    } finally {
      URL.revokeObjectURL(localPreview);   // libère l'aperçu
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // re-sélection du même fichier possible
    }
  }

  async function handleSaveBio() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ bio: bio.trim() || null });
      navigate(`/u/${user.username}`);
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
          <div className="mt-6 flex flex-col gap-6">
            {/* --- Avatar --- */}
            <div className="flex items-center gap-4">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-200 font-serif text-3xl text-neutral-500">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <input
                  ref={fileInputRef}
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-input"
                  className="cursor-pointer self-start rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
                >
                  {uploading ? "Envoi…" : "Changer l'avatar"}
                </label>
                <span className="text-xs text-neutral-500">
                  JPEG, PNG ou WebP · 5 Mo max
                </span>
              </div>
            </div>

            {/* --- Bio --- */}
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={handleSaveBio}
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