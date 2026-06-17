import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Mot de passe trop court (8 caractères minimum)");
      return;
    }
    try {
      await resetPassword(token, password);
      navigate("/login");
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 font-sans">
        <p className="text-red-600">Lien invalide : token manquant.</p>
        <Link to="/forgot-password" className="text-blue-700 hover:underline">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16 font-sans">
      <h1 className="font-serif text-3xl">Nouveau mot de passe</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <input
          type="password"
          placeholder="Nouveau mot de passe (8 car. min.)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700"
        >
          Réinitialiser
        </button>
      </form>
    </div>
  );
}