import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { Fragment, useState, useRef, useEffect } from "react";

// Les éléments du centre. `to: null` = bulle placeholder tant que la route
// n'existe pas (Films, Critiques, Listes ne sont pas encore branchées).
const NAV_ITEMS: { label: string; to: string | null }[] = [
  { label: "Accueil", to: "/" },
  { label: "Films", to: null },
  { label: "Critiques", to: null },
  { label: "Listes", to: null },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Ferme le menu quand on clique en dehors (comportement GitHub)
	useEffect(() => {
	  function handleClickOutside(e: MouseEvent) {
	    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
	      setMenuOpen(false);
	    }
	  }
	  document.addEventListener("mousedown", handleClickOutside);
	  return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// "Écrire" rejoint les bulles du milieu, seulement si connecté
	const middleItems = [
	  ...NAV_ITEMS,
	  ...(user ? [{ label: "Écrire", to: "/new" }] : []),
	];

  // Style commun à toutes les bulles
const bubble = "rounded-full px-8 py-2.5 text-sm font-medium transition-colors";

  return (
    <header className="sticky top-0 z-50 px-6 py-4">
	<nav className="flex w-full items-start mt-2 justify-between gap-4">
		{/* Bulle logo — haut à gauche */}
		<Link
		  to="/"
		  className="relative inline-flex items-center justify-center text-neutral-900"
		>
		  <svg
		    viewBox="235 35 208 135"
		    className="h-32 w-auto"
		    aria-hidden="true"
		  >
		    <path
		      d="M252,70 C268,46 290,40 314,45 C334,49 356,37 384,43 C412,49 433,62 436,88 C438,106 433,117 425,127 C417,136 402,128 405,142 C407,154 393,158 372,161 C340,166 300,164 270,155 C250,149 241,133 241,112 C241,93 244,78 252,70 Z"
		      fill="currentColor"
		    />
		  </svg>
		  <span className="absolute font-aa-triple text-5xl text-white">Judge</span>
		</Link>
		


        {/* Bulles du milieu */}
        <div className="hidden items-center gap-2 md:flex">
		  {middleItems.map((item, i) => {
		    const active = item.to !== null && item.to === pathname;
		    const classes = `${bubble} ${
		      active
		        ? "bg-neutral-900 text-white"
		        : "bg-white text-neutral-900 hover:bg-neutral-100"
		    } shadow-sm`;
		
		    return (
		      <Fragment key={item.label}>
		        {i > 0 && (
		          <span className="select-none text-2xl leading-none text-neutral-400">
		            ·
		          </span>
		        )}
		        {item.to ? (
		          <Link to={item.to} className={classes}>
		            {item.label}
		          </Link>
		        ) : (
		          <span
		            className={`${classes} cursor-not-allowed opacity-50`}
		            title="Bientôt"
		          >
		            {item.label}
		          </span>
		        )}
		      </Fragment>
		    );
		  })}
		</div>

	        {/* Bulles de droite */}
	        <div className="flex items-center gap-2">
			  {user ? (
			    <div className="relative" ref={menuRef}>
			      <button
			        onClick={() => setMenuOpen((o) => !o)}
			        className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-sm transition-colors hover:bg-neutral-100"
			      >
			        {user.avatar_url ? (
						  <img
						    src={user.avatar_url}
						    alt={user.username}
						    className="h-9 w-9 rounded-full object-cover"
						  />
						) : (
						  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-medium text-white">
						    {(user.display_name ?? user.username).charAt(0).toUpperCase()}
						  </span>
						)}
			        <span className="text-sm font-medium text-neutral-900">
			          {user.display_name ?? user.username}
			        </span>
			        <svg
			          viewBox="0 0 20 20"
			          fill="currentColor"
			          className={`h-4 w-4 text-neutral-500 transition-transform ${
			            menuOpen ? "rotate-180" : ""
			          }`}
			        >
			          <path
			            fillRule="evenodd"
			            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
			            clipRule="evenodd"
			          />
			        </svg>
			      </button>
				  
			      {menuOpen && (
			        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
			          <div className="px-4 py-2 text-xs text-neutral-500">
			            Connecté en tant que{" "}
			            <span className="font-medium text-neutral-900">{user.username}</span>
			          </div>
			          <div className="my-1 border-t border-neutral-100" />
			          <Link
			            to={`/u/${user.username}`}
			            onClick={() => setMenuOpen(false)}
			            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
			          >
			            Mon profil
			          </Link>
			          <Link
			            to="/new"
			            onClick={() => setMenuOpen(false)}
			            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
			          >
			            Écrire une critique
			          </Link>
					  <Link
						  to="/settings"
						  onClick={() => setMenuOpen(false)}
						  className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
						>
						  Éditer le profil
						</Link>
			          <div className="my-1 border-t border-neutral-100" />
			          <button
			            onClick={() => {
			              setMenuOpen(false);
			              logout();
			            }}
			            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-neutral-100"
			          >
			            Déconnexion
			          </button>
			        </div>
			      )}
			    </div>
			  ) : (
			    <>
			      <Link
			        to="/login"
			        className={`${bubble} bg-white text-neutral-900 shadow-sm hover:bg-neutral-100`}
			      >
			        Connexion
			      </Link>
			      <Link
			        to="/register"
			        className={`${bubble} bg-neutral-900 text-white hover:bg-neutral-700`}
			      >
			        Inscription
			      </Link>
			    </>
			  )}
			</div>
      </nav>
    </header>
  );
}