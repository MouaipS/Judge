import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
      await register(username, email, password);
      navigate("/"); // succès → on est connecté, retour à la une
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16 font-sans">
      <h1 className="font-serif text-3xl">Inscription</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        <input
          type="password"
          placeholder="Mot de passe (8 caractères min.)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700"
        >
          Créer mon compte
        </button>
      </form>
      <p className="mt-4 text-sm text-neutral-600">
        Déjà inscrit ?{" "}
        <Link to="/login" className="text-blue-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}