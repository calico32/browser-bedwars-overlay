import React, { useEffect, useState } from 'react';
import { PlayerTable } from './PlayerTable';
import { PlayerRow } from './types';

const randomRow = (): PlayerRow => {
  return {
    username: (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    ).substring(0, 20),
    fkdr: Math.round(Math.random() * 20 * 100) / 100,
    wl: Math.round(Math.random() * 10 * 100) / 100,
    level: Math.round(Math.random() * 100),
  };
};

const App = (): JSX.Element => {
  const [players, setPlayers] = useState<PlayerRow[]>([]);

  useEffect(() => {
    if (!process.env.WS_URL) throw new Error('no websocket url provided');

    const ws = new WebSocket(process.env.WS_URL);

    ws.addEventListener('message', event => {
      const [command, ...args] = (event.data as string).toString().trim().split('|');

      console.log(`rx ${event.data}`);

      if (command === 'add') {
        const [username, error, errorMessage] = args;

        const existing = players.find(row => row.username === username);

        if (error === 'error')
          return setPlayers(players => {
            const arr = [...players];
            if (existing) arr.splice(arr.indexOf(existing), 1);
            arr.push({ username, error: errorMessage });
            // console.log('state', arr);
            return arr;
          });

        const [, level, fkdr, wl] = args;

        const parsedLevel = parseInt(level);
        const parsedFkdr = parseFloat(fkdr);
        const parsedWl = parseFloat(wl);

        const row: PlayerRow = {
          username,
          level: parsedLevel,
          fkdr: parsedFkdr,
          wl: parsedWl,
        };

        setPlayers(players => {
          const arr = [...players];
          if (existing) arr.splice(arr.indexOf(existing), 1);
          arr.push(row);
          // console.log('state', arr);
          return arr;
        });
      } else if (command === 'remove') {
        const existing = players.find(row => row.username === args[0]);
        if (!existing) return;

        setPlayers(players => {
          const arr = [...players];
          arr.splice(arr.indexOf(existing), 1);
          // console.log('state', arr);
          return arr;
        });
      } else if (command === 'reset') {
        setPlayers(() => {
          const arr: PlayerRow[] = [];
          // console.log('state', arr);
          return arr;
        });
      }
    });
  }, []);

  // console.log(players);

  return (
    <main className="flex items-center justify-center m-4">
      <PlayerTable players={players} className="max-w-lg" />
    </main>
  );
};

export default App;
