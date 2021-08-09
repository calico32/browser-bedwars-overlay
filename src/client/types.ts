export type PlayerRow = PlayerRowError | PlayerRowSuccess;

export interface PlayerRowError {
  username: string;
  error: string;
}

export interface PlayerRowSuccess {
  username: string;
  level: number;
  fkdr: number;
  wl: number;
}
