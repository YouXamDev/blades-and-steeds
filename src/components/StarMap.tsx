import { useTranslation } from 'react-i18next';
import type { Player } from '../types/game';

interface StarMapProps {
  players: Player[];
  onCityClick?: (cityId: string) => void;
  onCentralClick?: () => void;
  currentPlayerId?: string;  // 当前用户的ID，用于标识自己的城池
  currentTurnPlayerId?: string | null;  // 当前回合的玩家ID，用于高亮显示
  highlightCities?: string[];
}

export function StarMap({ 
  players, 
  onCityClick, 
  onCentralClick,
  currentPlayerId,
  currentTurnPlayerId,
  highlightCities = []
}: StarMapProps) {
  const { t } = useTranslation();

  // 计算城池在圆周上的位置
  const getCityPosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // 从顶部开始
    const radius = 180; // 圆的半径
    const centerX = 250; // SVG 中心 X
    const centerY = 250; // SVG 中心 Y
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // 获取在某个位置的玩家
  const getPlayersAtLocation = (type: 'city' | 'central', cityId?: string) => {
    return players.filter(p => {
      if (type === 'central') {
        return p.location.type === 'central';
      } else {
        return p.location.type === 'city' && p.location.cityId === cityId;
      }
    });
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
        {/* 背景 */}
        <rect width="500" height="500" fill="transparent" />

        {/* 绘制连接线（从中央到各城池）*/}
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

          {/* 中央的玩家头像 */}
          {getPlayersAtLocation('central').map((player, idx) => {
            const offsetX = (idx - (getPlayersAtLocation('central').length - 1) / 2) * 30;
            const isCurrentTurnPlayer = currentTurnPlayerId !== null && player.id === currentTurnPlayerId;
            return (
              <g key={`central-${player.id}`}>
                {/* 高亮当前回合玩家 */}
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
                {/* 名字标签 */}
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
              {/* 城池圆圈 */}
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

              {/* 城池名称 */}
              <text
                x={pos.x}
                y={pos.y - cityRadius - 5}
                textAnchor="middle"
                className="text-xs font-bold fill-current text-gray-900 dark:text-white"
              >
                {cityOwner.name}
                {isOwnCity && ` (${t('common.your')})`}
              </text>

              {/* 城池中的玩家 */}
              {playersInCity.length > 0 && (
                <g>
                  {playersInCity.map((player, idx) => {
                    // 在城池内排列多个玩家
                    const angle = (idx * 2 * Math.PI) / playersInCity.length;
                    const offset = 15;
                    const playerX = pos.x + offset * Math.cos(angle);
                    const playerY = pos.y + offset * Math.sin(angle);
                    const isCurrentTurnPlayer = currentTurnPlayerId !== null && player.id === currentTurnPlayerId;

                    return (
                      <g key={`city-player-${player.id}`}>
                        {/* 高亮当前回合玩家 */}
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
                        {/* 玩家名字 */}
                        {playersInCity.length === 1 && (
                          <text
                            x={playerX}
                            y={playerY + 25}
                            textAnchor="middle"
                            className="text-[10px] fill-current text-gray-900 dark:text-white"
                          >
                            {player.name.substring(0, 6)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* 图例 */}
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
