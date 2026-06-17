import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16 font-sans">
      <h1 className="font-serif text-3xl">Mot de passe oublié</h1>
      {sent ? (
        <p className="mt-6 text-neutral-700">
          Si un compte est associé à cette adresse, un lien de réinitialisation
          vient d'être envoyé.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700"
          >
            Envoyer le lien
          </button>
        </form>
      )}
      <p className="mt-4 text-sm text-neutral-600">
        <Link to="/login" className="text-blue-700 hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}