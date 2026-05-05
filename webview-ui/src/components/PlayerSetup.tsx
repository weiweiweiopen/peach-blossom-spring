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
    const name = String(form.get('name') ?? '').trim() || 'Visitor';
    const palette = Number(form.get('palette') ?? 0);
    const avatarTitle =
      avatarChoices.find((choice) => choice.palette === palette)?.title ?? '跨維度旅人';
    onStart({ name, palette, avatarTitle });
  }

  return (
    <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/80 px-8 py-8 overflow-auto">
      <form
        className="pixel-panel w-[min(1200px,100%)] px-14 py-12 text-text"
        onSubmit={handleSubmit}
      >
        <p className="text-base uppercase tracking-wide text-accent-bright mb-3">
          Non-Governmental Matters
        </p>
        <h1 className="text-3xl leading-tight mb-5">
          桃花源─一個沒有政府的小誌
          <span className="block text-xl text-text-muted mt-2">
            Peach Blossom Spring - A non Governmental Matters
          </span>
        </h1>
        <p className="text-base leading-relaxed text-text-muted mb-10 max-w-[760px]">
          桃花源是一個互動寓言維度，許多仙人住在此，你一舉一動都會影響這個自由開源科技藝術世界的發展！
          <span className="block mt-3 text-text">
            你也可以在這裡面發現這個寓言世界與目前現實世的耦合。
          </span>
        </p>

        <hr className="border-border mb-10" />

        <p className="text-base uppercase tracking-wide text-accent-bright mb-4">
          Create your protagonist
        </p>
        <h2 className="text-2xl leading-none mb-8">創建異世界旅人</h2>

        <label className="block text-base text-text-muted mb-3" htmlFor="player-name">
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
            <label
              key={choice.title}
              className="border border-border bg-bg/70 px-6 py-6 cursor-pointer"
            >
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

        <button
          className="w-full bg-accent text-white border-2 border-accent px-8 py-5 text-2xl shadow-pixel"
          type="submit"
        >
          進入桃花源 / Enter
        </button>

        <p className="mt-8 text-base text-text-muted leading-snug">
          Use WASD or arrow keys to wander. Hold Shift while moving to sprint. Approach a persona and
          press Space to talk. Pinch / scroll to zoom.
        </p>
      </form>
    </div>
  );
}

export type { PlayerProfile };
