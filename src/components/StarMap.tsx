import { useTranslation } from 'react-i18next';
import type { Player, Bomb, DelayedEffect } from '../types/game';

interface StarMapProps {
  players: Player[];
  onCityClick?: (cityId: string) => void;
  onCentralClick?: () => void;
  currentPlayerId?: string;  
  currentTurnPlayerId?: string | null; 
  highlightCities?: string[];
  bombs?: Bomb[];
  delayedEffects?: DelayedEffect[];
  currentTurn?: number;
}

export function StarMap({ 
  players, 
  onCityClick, 
  onCentralClick,
  currentPlayerId,
  currentTurnPlayerId,
  highlightCities = [],
  bombs = [],
  delayedEffects = [],
  currentTurn = 0
}: StarMapProps) {
  const { t } = useTranslation();

  const getCityPosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2; 
    const radius = 180; 
    const centerX = 250; 
    const centerY = 250; 
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const getPlayersAtLocation = (type: 'city' | 'central', cityId?: string) => {
    return players.filter(p => {
      if (!p.isAlive) return false;
      if (type === 'central') {
        return p.location.type === 'central';
      } else {
        return p.location.type === 'city' && p.location.cityId === cityId;
      }
    });
  };

  const renderLocationIndicators = (type: 'city' | 'central', cityId?: string, startX: number = 250, startY: number = 250) => {
    const locBombs = bombs.filter(b => b.location.type === type && b.location.cityId === cityId);
    const locEffects = delayedEffects.filter(e => e.targetLocation.type === type && e.targetLocation.cityId === cityId);

    if (locBombs.length === 0 && locEffects.length === 0) return null;

    let currentY = startY;

    return (
      <g>
        {locBombs.map((bomb) => {
          const bomber = players.find(p => p.id === bomb.playerId)?.name || t('game.unknown');
          const label = t('game.bomberBomb', { player: bomber, count: bomb.count });
          currentY += 14;
          return (
            <text key={`bomb-${bomb.id}`} x={startX} y={currentY} textAnchor="middle" className="text-[11px] fill-orange-500 dark:fill-orange-400 font-bold">
              {label}
            </text>
          );
        })}
        {locEffects.map((effect) => {
          const caster = players.find(p => p.id === effect.playerId)?.name || t('game.unknown');
          const resolveRound = (effect as any).resolveAtRound ?? (effect as any).createdAtTurn + (effect as any).turnDelay;
          const turnsLeft = resolveRound - currentTurn;
          const turnStr = turnsLeft <= 0 ? t('game.endOfThisTurn') : t('game.endOfNextTurn');

          const isHeal = effect.type === 'potion';
          const icon = isHeal ? '💚' : '🚀';
          const colorClass = isHeal ? 'fill-green-600 dark:fill-green-400' : 'fill-red-600 dark:fill-red-400';
          const actionStr = isHeal ? `+${effect.value} HP` : `-${effect.value} HP`;

          const label = `${icon} ${caster}: ${actionStr} (${turnStr})`;
          currentY += 14;

          return (
            <text key={`effect-${effect.id}`} x={startX} y={currentY} textAnchor="middle" className={`text-[11px] font-bold ${colorClass}`}>
              {label}
            </text>
          );
        })}
      </g>
    );
  };

  const centerX = 250;
  const centerY = 250;
  const cityRadius = 40;
  const centralRadius = 50;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <svg
        viewBox="0 0 500 500"
        className="w-full h-auto"
        style={{ maxHeight: '500px' }}
      >
        <rect width="500" height="500" fill="transparent" />

        {players.map((player, index) => {
          const pos = getCityPosition(index, players.length);
          return (
            <line
              key={`line-${player.id}`}
              x1={centerX}
              y1={centerY}
              x2={pos.x}
              y2={pos.y}
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-300 dark:text-gray-600"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* 中央 */}
        <g>
          <circle
            cx={centerX}
            cy={centerY}
            r={centralRadius}
            fill="currentColor"
            className={`transition-colors ${
              onCentralClick 
                ? 'cursor-pointer text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300' 
                : 'cursor-not-allowed text-blue-300 dark:text-blue-700'
            }`}
            onClick={onCentralClick}
          />
          {onCentralClick && (
            <circle
              cx={centerX}
              cy={centerY}
              r={centralRadius + 5}
              fill="none"
              strokeWidth={2}
              stroke="currentColor"
              className="text-blue-500 dark:text-blue-400 animate-pulse"
            />
          )}
          <text
            x={centerX}
            y={centerY - centralRadius - 10}
            textAnchor="middle"
            className="text-sm font-bold fill-current text-gray-900 dark:text-white"
          >
            {t('location.central')}
          </text>

          {renderLocationIndicators('central', undefined, centerX, centerY + centralRadius + 15)}

          {getPlayersAtLocation('central').map((player, idx) => {
            const offsetX = (idx - (getPlayersAtLocation('central').length - 1) / 2) * 30;
            const isCurrentTurnPlayer = currentTurnPlayerId !== null && player.id === currentTurnPlayerId;
            return (
              <g key={`central-${player.id}`}>
                {isCurrentTurnPlayer && (
                  <circle
                    cx={centerX + offsetX}
                    cy={centerY}
                    r="16"
                    fill="none"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="text-yellow-400 dark:text-yellow-300 animate-pulse"
                  />
                )}
                <clipPath id={`clip-central-${player.id}`}>
                  <circle cx={centerX + offsetX} cy={centerY} r="12" />
                </clipPath>
                {player.avatar ? (
                  <image
                    href={player.avatar}
                    x={centerX + offsetX - 12}
                    y={centerY - 12}
                    width="24"
                    height="24"
                    clipPath={`url(#clip-central-${player.id})`}
                  />
                ) : (
                  <>
                    <circle
                      cx={centerX + offsetX}
                      cy={centerY}
                      r="12"
                      fill="currentColor"
                      className="text-indigo-500"
                    />
                    <text
                      x={centerX + offsetX}
                      y={centerY + 4}
                      textAnchor="middle"
                      className="text-xs font-bold fill-white"
                    >
                      {player.name[0]?.toUpperCase()}
                    </text>
                  </>
                )}
                <text
                  x={centerX + offsetX}
                  y={centerY + 25}
                  textAnchor="middle"
                  className="text-[10px] fill-current text-gray-900 dark:text-white"
                >
                  {player.name.substring(0, 6)}
                </text>
              </g>
            );
          })}
        </g>

        {/* 各玩家的城池 */}
        {players.map((cityOwner, index) => {
          const pos = getCityPosition(index, players.length);
          const playersInCity = getPlayersAtLocation('city', cityOwner.id);
          const isHighlighted = highlightCities.includes(cityOwner.id);
          const isOwnCity = cityOwner.id === currentPlayerId;
          const isClickable = onCityClick !== undefined && isHighlighted;

          return (
            <g key={`city-${cityOwner.id}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={cityRadius}
                fill="currentColor"
                className={`transition-all ${
                  isOwnCity
                    ? 'text-purple-500 dark:text-purple-400'
                    : 'text-gray-400 dark:text-gray-600'
                } ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                onClick={() => isClickable && onCityClick?.(cityOwner.id)}
                strokeWidth={isHighlighted ? 3 : (isOwnCity ? 2 : 0)}
                stroke={isHighlighted ? 'currentColor' : (isOwnCity ? 'currentColor' : 'none')}
                strokeDasharray={isOwnCity ? '5,3' : '0'}
                style={{
                  strokeOpacity: isHighlighted ? 1 : (isOwnCity ? 0.5 : 0),
                }}
              />
              {isHighlighted && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={cityRadius + 5}
                  fill="none"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="text-blue-500 dark:text-blue-400 animate-pulse"
                />
              )}

              <text
                x={pos.x}
                y={pos.y - cityRadius - 5}
                textAnchor="middle"
                className="text-xs font-bold fill-current text-gray-900 dark:text-white"
              >
                {cityOwner.name}
                {isOwnCity && ` (${t('common.your')})`}
              </text>

              {renderLocationIndicators('city', cityOwner.id, pos.x, pos.y + cityRadius + 15)}

              {playersInCity.length > 0 && (
                <g>
                  {playersInCity.map((player, idx) => {
                    const angle = (idx * 2 * Math.PI) / playersInCity.length;
                    const offset = 15;
                    const playerX = pos.x + offset * Math.cos(angle);
                    const playerY = pos.y + offset * Math.sin(angle);
                    const isCurrentTurnPlayer = currentTurnPlayerId !== null && player.id === currentTurnPlayerId;

                    return (
                      <g key={`city-player-${player.id}`}>
                        {isCurrentTurnPlayer && (
                          <circle
                            cx={playerX}
                            cy={playerY}
                            r="16"
                            fill="none"
                            strokeWidth="2"
                            stroke="currentColor"
                            className="text-yellow-400 dark:text-yellow-300 animate-pulse"
                          />
                        )}
                        <clipPath id={`clip-city-${cityOwner.id}-${player.id}`}>
                          <circle cx={playerX} cy={playerY} r="12" />
                        </clipPath>
                        {player.avatar ? (
                          <image
                            href={player.avatar}
                            x={playerX - 12}
                            y={playerY - 12}
                            width="24"
                            height="24"
                            clipPath={`url(#clip-city-${cityOwner.id}-${player.id})`}
                          />
                        ) : (
                          <>
                            <circle
                              cx={playerX}
                              cy={playerY}
                              r="12"
                              fill="currentColor"
                              className="text-indigo-500"
                            />
                            <text
                              x={playerX}
                              y={playerY + 4}
                              textAnchor="middle"
                              className="text-xs font-bold fill-white"
                            >
                              {player.name[0]?.toUpperCase()}
                            </text>
                          </>
                        )}
                        <text
                          x={playerX}
                          y={playerY + 25}
                          textAnchor="middle"
                          className="text-[10px] fill-current text-gray-900 dark:text-white"
                        >
                          {player.name.substring(0, 6)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500"></div>
          <span className="text-gray-700 dark:text-gray-300">{t('game.yourCity')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-400"></div>
          <span className="text-gray-700 dark:text-gray-300">{t('game.otherCity')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span className="text-gray-700 dark:text-gray-300">{t('location.central')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-transparent animate-pulse"></div>
          <span className="text-gray-700 dark:text-gray-300">{t('game.canMoveTo')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-yellow-400 bg-transparent animate-pulse"></div>
          <span className="text-gray-700 dark:text-gray-300">{t('game.currentTurnPlayer')}</span>
        </div>
      </div>
    </div>
  );
}