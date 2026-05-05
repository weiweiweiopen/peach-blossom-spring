export interface VideoEncounterState {
  enabled: boolean;
  encounterPartnerId: string | null;
}

export const defaultVideoEncounterState: VideoEncounterState = {
  enabled: false,
  encounterPartnerId: null,
};

// Placeholder for future multiplayer/WebRTC encounter activation.
// We keep the module so future video encounter logic has a stable home,
// but the single-player build does not request camera access or show a monitor.
export function shouldEnableVideoEncounter(): boolean {
  return false;
}
