import type { FC } from "react";

interface Props {
  posters: { path: string; title: string }[];
}

const IMG_BASE = "https://image.tmdb.org/t/p/w342";

const MovieBanner: FC<Props> = ({ posters }) => {
  if (posters.length === 0) return null;
  const doubled = [...posters, ...posters];

  return (
    <div className="w-full overflow-hidden py-4">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="marquee-track flex gap-3 w-max">
        {doubled.map((p, i) => (
          <img
            key={i}
            src={IMG_BASE + p.path}
            alt={p.title}
            className="h-36 aspect-[2/3] rounded-lg object-cover flex-shrink-0 opacity-90"
          />
        ))}
      </div>
    </div>
  );
};

export default MovieBanner;
