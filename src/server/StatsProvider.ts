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

  async get(identifier: string): Promise<Player | undefined> {
    identifier = identifier.trim();

    const isUuid = uuidRegex.test(identifier);

    const potentialUuid = isUuid ? identifier.replace(/-/g, '') : this.uuidCache.get(identifier);

    if (!this.map.has(potentialUuid ?? '')) {
      const response = await axios.get('https://api.hypixel.net/player', {
        params: {
          key: this.key,
          uuid: isUuid ? encodeURIComponent(identifier) : undefined,
          name: isUuid ? undefined : encodeURIComponent(identifier),
        },
        validateStatus: () => true,
      });

      const data = response.data as PlayerResponse;

      if (response.status !== 200 || !data.success)
        throw new Error(`REQUEST_FAILED|${response.status}|${response.statusText}`);

      if (!data.player) throw new Error('NOT_FOUND');

      this.map.set(data.player.uuid, data.player);
      setTimeout(() => this.map.delete(data.player!.uuid!), 1000 * 60 * 5);

      this.uuidCache.set(data.player.playername, data.player.uuid);
      setTimeout(() => this.uuidCache.delete(data.player!.playername), 1000 * 60 * 15);
    }

    return this.map.get(isUuid ? identifier.replace(/-/g, '') : this.uuidCache.get(identifier)!);
  }
}
