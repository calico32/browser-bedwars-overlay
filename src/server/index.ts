import { createServer } from 'http';
import { Socket } from 'net';
import { URL } from 'url';
import WebSocket, { Server } from 'ws';
import { StatsProvider } from './StatsProvider';
import { getLevelForExp } from './util';

const inputServer = new Server({ noServer: true });
const outputServer = new Server({ noServer: true });
const httpServer = createServer();
const statsProvider = new StatsProvider(process.env.HYPIXEL_API_KEY!);

httpServer.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url!, `http://${request.headers.host}`);

  if (pathname === '/submit') {
    inputServer.handleUpgrade(request, socket as Socket, head, ws => {
      inputServer.emit('connection', ws, request);
    });
  } else if (pathname === '/listen') {
    outputServer.handleUpgrade(request, socket as Socket, head, ws => {
      outputServer.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

inputServer.on('connection', (socket, request) => {
  console.log(`[is] connection from ${request.socket.remoteAddress}`);

  const emitAll = (message: string) => {
    console.log(`[os] emitAll | ${message}`);
    outputServer.clients.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message, { binary: false });
      }
    });
  };

  socket.on('message', async message => {
    const [command, ...args] = message.toString().trim().split('|');

    console.log(`[is] rx ${command} | ${args.join(' | ')}`);

    if (command === 'add') {
      try {
        const player = await statsProvider.get(args[0]);

        const bedwars = player?.stats.Bedwars;

        if (!bedwars) throw new Error('NO_BEDWARS_STATS');

        const round = (n: number) => Math.round(n * 100) / 100;

        const fkdr = round(
          (bedwars.final_kills_bedwars ?? 0) / (bedwars.final_deaths_bedwars ?? 0)
        );
        const wl = round((bedwars.wins_bedwars ?? 0) / (bedwars.losses_bedwars ?? 0));
        const level = Math.floor(getLevelForExp(bedwars.Experience ?? 0));

        emitAll(`add|${args[0]}|${level}|${fkdr}|${wl}`);
      } catch (err) {
        emitAll(`add|${args[0]}|error|${err.message}`);
      }
    } else if (command === 'remove') {
      emitAll(`remove|${args[0]}`);
    } else if (command === 'reset') {
      emitAll('reset');
    }
  });

  socket.on('close', () => {
    console.log(`[is] connection from ${request.socket.remoteAddress} closed`);
  });
});

outputServer.on('connection', (socket, request) => {
  console.log(`[os] connection from ${request.socket.remoteAddress}`);

  socket.on('message', message => {
    // const [command, ...args] = message.toString().trim().split('|');

    if (message.toString() === 'hb') return;

    console.log(`[os] rx | ${message.toString()}`);
  });

  socket.on('close', () => {
    console.log(`[os] connection from ${request.socket.remoteAddress} closed`);
  });
});

httpServer.listen(8081);
