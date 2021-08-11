import classnames from 'classnames';
import React from 'react';
import { PlayerRow, PlayerRowError } from './types';

const headerClasses: string = (
  <div className="sticky top-0 p-2 font-bold border border-separate border-sky-500 bg-sky-200 text-sky-600 drop-shadow-md"></div>
).props.className;

const bodyClasses = (i: number): string =>
  (
    <div
      className={`p-2 font-medium border border-sky-500 bg-sky-50 text-sky-600 ${
        i % 2 === 0 ? 'bg-sky-50' : 'bg-sky-100'
      }`}
    ></div>
  ).props.className;

const threatOf = (player: PlayerRow): number =>
  isError(player) ? Infinity : (player.level * player.fkdr * player.fkdr) / 10;

const isError = (player: PlayerRow): player is PlayerRowError =>
  (player as PlayerRowError).error !== undefined;

export const PlayerTable = ({
  players,
  className,
}: {
  players: PlayerRow[];
  className?: string;
}): JSX.Element => {
  const sortedPlayers = [...players].sort((a, b) => threatOf(b) - threatOf(a));

  return (
    <table
      className={classnames(className, 'w-full font-sans text-gray-800 border-separate table-auto')}
    >
      <thead>
        <tr>
          <th className={`${headerClasses} w-full rounded-tl-lg`}>Player</th>
          <th className={`${headerClasses} px-4`}>Level</th>
          <th className={`${headerClasses} px-4`}>FKDR</th>
          <th className={`${headerClasses} px-4 rounded-tr-lg `}>W/L</th>
        </tr>
      </thead>
      <tbody>
        {sortedPlayers.map((row, i) =>
          isError(row) ? (
            <tr key={i}>
              <td className={`${bodyClasses(i)}`} colSpan={4}>
                {row.username} <span className="font-bold text-red-600">{row.error}</span>
              </td>
            </tr>
          ) : (
            <tr key={i}>
              <td className={`${bodyClasses(i)}`}>
                {row.rank !== '' ? `${row.rank} ${row.username}` : row.username}
              </td>
              <td className={`${bodyClasses(i)}`}>{row.level}</td>
              <td className={`${bodyClasses(i)}`}>{row.fkdr}</td>
              <td className={`${bodyClasses(i)}`}>{row.wl}</td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
};
