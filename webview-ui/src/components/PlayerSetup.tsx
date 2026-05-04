interface PlayerProfile {
  name: string;
  palette: number;
  avatarTitle?: string;
}

interface PlayerSetupProps {
  onStart: (profile: PlayerProfile) => void;
}

const avatarChoices = [
  { palette: 0, title: '迷路外星使者' },
  { palette: 1, title: '會發光的魚人' },
  { palette: 2, title: '竹林機器精靈' },
  { palette: 3, title: '桃花風暴巫師' },
  { palette: 4, title: '笑點超低史萊姆' },
  { palette: 5, title: '跨維度旅人' },
];

export function PlayerSetup({ onStart }: PlayerSetupProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim() || 'Visitor';
    const palette = Number(form.get('palette') || 0);
    const avatarTitle =
      avatarChoices.find((choice) => choice.palette === palette)?.title ?? '跨維度旅人';
    onStart({ name, palette, avatarTitle });
  }

  return (
    <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/75 px-8">
      <form className="pixel-panel w-[min(1200px,100%)] px-14 py-12 text-text" onSubmit={handleSubmit}>
        <p className="text-base uppercase tracking-wide text-accent-bright mb-4">Enter Peach Blossom Spring</p>
        <h1 className="text-3xl leading-none mb-8">創建異世界旅人 / Create your protagonist</h1>
        <label className="block text-base text-text-muted mb-4" htmlFor="player-name">
          Name
        </label>
        <input
          id="player-name"
          name="name"
          className="w-full bg-bg border-2 border-border px-6 py-5 text-2xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={32}
          placeholder="輸入你的角色名 / Your traveler name"
          autoFocus
        />
        <p className="text-lg text-text-muted mb-5">異世界角色樣式 / Isekai avatar collection</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-12">
          {avatarChoices.map((choice) => (
            <label key={choice.title} className="border border-border bg-bg/70 px-6 py-6 cursor-pointer">
              <input
                className="mr-4"
                type="radio"
                name="palette"
                value={choice.palette}
                defaultChecked={choice.palette === 0}
              />
              <span className="text-lg">{choice.title}</span>
            </label>
          ))}
        </div>
        <button className="w-full bg-accent text-white border-2 border-accent px-8 py-5 text-2xl shadow-pixel" type="submit">
          繼續 / Continue
        </button>
        <p className="mt-8 text-base text-text-muted leading-snug">
          你將以奇異旅人身份誤入桃花源。Use WASD / arrows to wander, Shift or Ctrl to sprint.
        </p>
      </form>
    </div>
  );
}

export type { PlayerProfile };
