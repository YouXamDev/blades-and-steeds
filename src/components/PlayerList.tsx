import { useTranslation } from 'react-i18next';
import { Circle, Clock } from 'lucide-react';
import type { Player } from '../types/game';

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string | null;
  highlightPlayerId?: string;
  showStatus?: boolean;
  compact?: boolean;
}

export function PlayerList({ 
  players, 
  currentPlayerId, 
  highlightPlayerId,
  showStatus = false,
  compact = false 
}: PlayerListProps) {
  const { t } = useTranslation();

  return (
    <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
      {players.map((player) => {
        const isCurrentTurn = currentPlayerId === player.id;
        const isHighlighted = highlightPlayerId === player.id;
        
        return (
          <div
            key={player.id}
            className={`p-4 rounded-lg transition-all ${
              isCurrentTurn
                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 shadow-lg'
                : isHighlighted
                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-3">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className={`rounded-full ${compact ? 'w-12 h-12' : 'w-16 h-16'} object-cover border-2 ${
                      isCurrentTurn ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    onError={(e) => {
                      // Fallback to initial if image fails to load
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className={`${player.avatar ? 'hidden' : 'flex'} ${compact ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-white font-bold ${compact ? 'text-lg' : 'text-2xl'}`}
                  style={{ display: player.avatar ? 'none' : 'flex' }}
                >
                  {player.name[0]?.toUpperCase() || '?'}
                </div>
                
                {/* Current turn indicator - top right */}
                {isCurrentTurn && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1.5 shadow-lg">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                )}
                
                {/* Connection status indicator - bottom right */}
                <div className="absolute -bottom-1 -right-1">
                  <Circle
                    className={`w-3 h-3 ${
                      player.isConnected ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Name */}
              <p className={`font-semibold text-gray-900 dark:text-white ${compact ? 'text-sm' : 'text-base'} truncate w-full`}>
                {player.name}
              </p>

              {/* Class */}
              {player.class && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t(`class.${player.class}`)}
                </p>
              )}

              {/* Current turn text (optional, since we have icon now) */}

              {/* Ready status (for class selection) */}
              {showStatus && player.isReady !== undefined && (
                <p className={`text-xs mt-1 ${
                  player.isReady 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {player.isReady ? `✓ ${t('room.ready')}` : t('game.selecting')}
                </p>
              )}

              {/* Health (in playing phase) */}
              {player.health !== undefined && player.class && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-red-500">❤</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {player.health}/{player.maxHealth}
                  </span>
                </div>
              )}

              {/* Inventory (in playing phase) */}
              {player.class && (player.inventory?.length > 0 || player.purchaseRights?.length > 0) && (
                <div className="mt-2 w-full">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {/* Display inventory items */}
                    {player.inventory?.map((item, idx) => (
                      <span
                        key={`inv-${idx}`}
                        className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-xs"
                      >
                        {t(`item.${item}`)}
                      </span>
                    ))}
                    {/* Display purchase rights with a different style */}
                    {player.purchaseRights?.map((right, idx) => (
                      <span
                        key={`right-${idx}`}
                        className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs border border-blue-300 dark:border-blue-700"
                        title={t('game.purchaseRight')}
                      >
                        {t(`item.${right}`)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
