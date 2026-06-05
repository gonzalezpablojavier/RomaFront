import React from 'react';
import { homeCard } from '../Home/homeSurface';

interface RankingRow {
  position: number;
  nombre: string;
  totalPoints: number;
  isMe: boolean;
}

interface RankingTableProps {
  myPosition: number | null;
  myPoints: number;
  totalPlayers: number;
  ranking: RankingRow[];
}

const RankingTable: React.FC<RankingTableProps> = ({
  myPosition,
  myPoints,
  totalPlayers,
  ranking,
}) => (
  <div className="space-y-4">
    <div className={`p-4 ${homeCard}`}>
      <p className="text-sm text-slate-600">
        Tu posición:{' '}
        <span className="font-bold text-slate-900">
          {myPosition != null ? `#${myPosition}` : '—'} de {totalPlayers}
        </span>
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Puntos: <span className="font-bold text-[#009ee3]">{myPoints}</span>
      </p>
    </div>

    <div className={`overflow-hidden ${homeCard}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs text-slate-500">
            <th className="px-3 py-2 font-semibold">#</th>
            <th className="px-3 py-2 font-semibold">Colaborador</th>
            <th className="px-3 py-2 text-right font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {ranking.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                Aún no hay puntos cargados
              </td>
            </tr>
          ) : (
            ranking.map((row) => (
              <tr
                key={row.position}
                className={
                  row.isMe ? 'bg-[#009ee3]/10 font-medium' : 'border-t border-slate-50'
                }
              >
                <td className="px-3 py-2.5">{row.position}</td>
                <td className="px-3 py-2.5">
                  {row.nombre}
                  {row.isMe && (
                    <span className="ml-1 text-xs text-[#0077b3]">(vos)</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">{row.totalPoints}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default RankingTable;
