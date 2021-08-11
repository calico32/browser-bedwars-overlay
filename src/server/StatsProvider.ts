import axios from 'axios';
import { Player, PlayerResponse } from 'hypixel-types';

const insertUuidDashes = (uuid: string): string =>
  `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(
    16,
    20
  )}-${uuid.slice(20, 32)}`;

const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

export class UuidCache extends Map<string, string> {
  has(username: string): boolean {
    return super.has(username.toLowerCase().trim());
  }

  get(username: string, dashed = false): string | undefined {
    const plainUuid = super.get(username.toLowerCase().trim());
    return dashed ? plainUuid && insertUuidDashes(plainUuid) : plainUuid;
  }

  set(username: string, uuid: string): this {
    if (!uuidRegex.test(uuid)) throw new Error(`Invalid UUID "${uuid}" for "${username}"`);
    super.set(username.toLowerCase().trim(), uuid.replace(/-/g, ''));
    return this;
  }

  delete(username: string): boolean {
    return super.delete(username.toLowerCase().trim());
  }
}

export class StatsProvider {
  map = new Map<string, Player>();
  uuidCache = new UuidCache();

  constructor(private key: string) {}

  async get(username: string): Promise<Player | undefined> {
    username = username.trim();

    if (!this.map.has(username)) {
      const response = await axios.get('https://api.hypixel.net/player', {
        params: {
          key: this.key,
          name: encodeURIComponent(username),
        },
        validateStatus: () => true,
      });

      const data = response.data as PlayerResponse;

      if (response.status !== 200 || !data.success)
        throw new Error(`REQUEST_FAILED_${response.status}|${response.statusText}`);

      if (!data.player) throw new Error('NOT_FOUND');

      this.map.set(username, data.player);
      setTimeout(() => this.map.delete(data.player!.uuid!), 1000 * 60 * 5);
    }

    return this.map.get(username);
  }
}
