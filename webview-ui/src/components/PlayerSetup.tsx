interface PlayerProfile {
  name: string;
  palette: number;
}

interface PlayerSetupProps {
  onStart: (profile: PlayerProfile) => void;
}

const paletteLabels = ['Red', 'Blue', 'Green', 'Gold', 'Purple', 'Teal'];

export function PlayerSetup({ onStart }: PlayerSetupProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim() || 'Visitor';
    const palette = Number(form.get('palette') || 0);
    onStart({ name, palette });
  }

  return (
    <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/75 px-8">
      <form className="pixel-panel w-[min(520px,100%)] px-14 py-12 text-text" onSubmit={handleSubmit}>
        <p className="text-xs uppercase tracking-wide text-accent-bright mb-4">Enter Peach Blossom Spring</p>
        <h1 className="text-3xl leading-none mb-8">Create your protagonist</h1>
        <label className="block text-sm text-text-muted mb-4" htmlFor="player-name">
          Name
        </label>
        <input
          id="player-name"
          name="name"
          className="w-full bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={32}
          placeholder="Your name"
          autoFocus
        />
        <p className="text-sm text-text-muted mb-5">Character color</p>
        <div className="grid grid-cols-3 gap-4 mb-12">
          {paletteLabels.map((label, palette) => (
            <label key={label} className="border border-border bg-bg/70 px-5 py-4 cursor-pointer">
              <input className="mr-3" type="radio" name="palette" value={palette} defaultChecked={palette === 0} />
              {label}
            </label>
          ))}
        </div>
        <button className="w-full bg-accent text-white border-2 border-accent px-8 py-5 text-xl shadow-pixel" type="submit">
          Start
        </button>
        <p className="mt-8 text-xs text-text-muted leading-snug">
          Use arrow keys or WASD to wander. Approach a persona and press Space to talk.
        </p>
      </form>
    </div>
  );
}

export type { PlayerProfile };
