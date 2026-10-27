export type StageControl = { paused: boolean; volume: number; revision: number; restart_revision: number; external: boolean };
export const defaultStageControl: StageControl = { paused: false, volume: 100, revision: 0, restart_revision: 0, external: true };
export type StageCommand = "play" | "pause" | "restart" | "volume" | "external" | "local";