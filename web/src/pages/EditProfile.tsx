import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { getProfile, updateProfile, uploadAvatar } from "../api";
import Navbar from "../components/Navbar";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 Mo, comme multer
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function EditProfile() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();

  const [bio, setBio] = useState("");
  const [serverAvatar, setServerAvatar] = useState("");        // avatar côté serveur
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // fichier en attente d'envoi
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // aperçu local
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);                 // un seul état : avatar + bio
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
        setServerAvatar(p.user.avatar_url ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
  }, [user]);

  // Génère un aperçu local quand un fichier est choisi, et le révoque tout seul.
  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  if (loading || !user) return null;

  const avatar = previewUrl ?? serverAvatar;

function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validation côté client, alignée sur le serveur
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    setError("Format non supporté : choisis un JPEG, PNG ou WebP.");
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }
  if (file.size > MAX_AVATAR_BYTES) {
    setError("Image trop lourde : 5 Mo maximum.");
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }

  setError(null);
  setAvatarFile(file);                                  // on mémorise, on n'upload PAS
  if (fileInputRef.current) fileInputRef.current.value = ""; // re-sélection du même fichier possible
}

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // 1) Si un nouvel avatar a été choisi, on l'envoie maintenant
      if (avatarFile) {
        const updated = await uploadAvatar(avatarFile);
        setUser(updated);                            // user global à jour (navbar, etc.)
        setServerAvatar(updated.avatar_url ?? "");   // le state reflète l'avatar persisté
        setAvatarFile(null);                         // consommé → pas de ré-upload au prochain clic
      }
      // 2) Mise à jour de la bio
      await updateProfile({ bio: bio.trim() || null });
      navigate(`/u/${user.username}`);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);                    // on reste sur la page pour corriger
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
                  Changer l'avatar
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