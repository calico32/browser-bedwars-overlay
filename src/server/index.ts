import axios from 'axios';
import { createServer } from 'http';
import { HypixelCacheResponse } from 'hypixel-cache';
import { Socket } from 'net';
import { URL } from 'url';
import WebSocket, { Server } from 'ws';
import { getLevelForExp, getRankPlaintext } from './util';

const inputServer = new Server({ noServer: true });
const outputServer = new Server({ noServer: true });
const httpServer = createServer();

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
        const response = await axios.get(`${process.env.HYPIXEL_CACHE_URL}/name/${args[0]}`, {
          headers: { 'X-Secret': process.env.HYPIXEL_CACHE_SECRET },
          validateStatus: () => true,
        });

        const data = response.data as HypixelCacheResponse;

        if (response.status === 429) return emitAll(`add|${args[0]}|error|RATELIMIT`);

        if (!data.success)
          return emitAll(`add|${args[0]}|error|${data.error.toUpperCase().replace(/ /g, '_')}`);

        const player = data.player;
        if (player === null || response.status === 404) throw new Error('NOT_FOUND');

        const bedwars = player?.stats.Bedwars;
        if (!bedwars) throw new Error('NO_BEDWARS_STATS');

        const round = (n: number) => Math.round(n * 100) / 100;

        let fkdr = round((bedwars.final_kills_bedwars ?? 0) / (bedwars.final_deaths_bedwars ?? 0));
        let wl = round((bedwars.wins_bedwars ?? 0) / (bedwars.losses_bedwars ?? 0));
        const level = Math.floor(getLevelForExp(bedwars.Experience ?? 0));
        const ws = bedwars.winstreak ?? 0;

        if (isNaN(fkdr) && !bedwars.final_kills_bedwars && !bedwars.final_deaths_bedwars) fkdr = 0;
        if (isNaN(wl) && !bedwars.wins_bedwars && !bedwars.losses_bedwars) wl = 0;

        emitAll(`add|${args[0]}|${getRankPlaintext(player!)}|${level}|${fkdr}|${wl}|${ws}`);
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
