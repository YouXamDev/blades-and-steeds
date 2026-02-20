import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RulesModal } from '../components/RulesModal';
import { Users, Heart, Footprints, Power, RotateCcw, LogOut, Eye, BookOpen } from 'lucide-react'; 
import { useWebSocket } from '../hooks/useWebSocket';
import { getUserId, getUserProfile } from '../utils/auth';
import { PlayerList } from '../components/PlayerList';
import { GameBoard } from '../components/GameBoard';
import { ActionLog } from '../components/ActionLog';
import type { GameState, Player, PlayerClass, GameAction, ItemType, GameSettings } from '../types/game';

export function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isConnected, lastMessage, messageTimestamp, send } = useWebSocket(roomId || null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isModalHidden, setIsModalHidden] = useState(false);
  const pendingAlien = gameState?.phase === 'playing' && gameState.pendingAlienTeleports?.includes(getUserId());
  const pendingLoot = gameState?.phase === 'playing' && !pendingAlien && (gameState?.pendingLoots?.filter(p => p.killerId === getUserId()) || []).length > 0;
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  
  useEffect(() => {
    setIsModalHidden(false);
  }, [pendingAlien, pendingLoot]);

  useEffect(() => {
    if (gameState) {
      const phaseTitle = gameState.phase === 'waiting' 
        ? t('room.waiting')
        : gameState.phase === 'ended'
        ? t('game.phase.ended')
        : t('game.phase.playing');
      document.title = `${phaseTitle} - ${t('app.title')}`;
    } else {
      document.title = `${t('common.loading')} - ${t('app.title')}`;
    }
  }, [gameState?.phase, t]);

  useEffect(() => {
    if (!isConnected) return;
    const profile = getUserProfile();
    if (!profile) {
      navigate('/profile');
      return;
    }
    send({
      type: 'join_room',
      playerId: getUserId(),
      playerName: profile.name,
      avatar: profile.avatar,
    });
  }, [isConnected, navigate, send]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'room_state') {
      const state = lastMessage.state as any;
      const processedState = {
        ...state,
        players: Array.isArray(state.players) 
          ? new Map(state.players.map((p: Player) => [p.id, p]))
          : state.players
      };
      
      if (state.actionLogs !== undefined) {
        setGameState(processedState);
      } else {
        setGameState(prevState => ({
          ...processedState,
          actionLogs: prevState?.actionLogs || [],
        }));
      }
      
      const userId = getUserId();
      const player = processedState.players.get(userId);
      setCurrentPlayer(player || null);
    } else if (lastMessage.type === 'new_action_logs') {
      if (lastMessage.logs) {
        setGameState(prevState => {
          if (!prevState) return prevState;
          return {
            ...prevState,
            actionLogs: [...(prevState.actionLogs || []), ...lastMessage.logs],
          };
        });
      }
    } else if (lastMessage.type === 'error') {
      alert(lastMessage.message);
    }
  }, [lastMessage, messageTimestamp]);

  const handleSelectClass = (selectedClass: PlayerClass) => {
    if (!currentPlayer) return;
    send({
      type: 'select_class',
      playerId: getUserId(),
      selectedClass,
    });
  };

  const handleStartGame = () => {
    send({
      type: 'start_game',
      playerId: getUserId(),
    });
  };

  const handleUpdateSettings = (settings: Partial<GameSettings>) => {
    send({
      type: 'update_settings',
      playerId: getUserId(),
      settings,
    });
  };

  const handleForceEnd = () => {
    if (window.confirm(t('game.confirmForceEnd'))) {
      send({
        type: 'force_end_game',
        playerId: getUserId(),
      });
    }
  };

  const handleReturnToRoom = () => {
    send({
      type: 'return_to_room',
      playerId: getUserId(),
    });
  };

  const handleLeaveRoom = () => {
    if (window.confirm(t('room.confirmLeave'))) {
      send({
        type: 'leave_room',
        playerId: getUserId()
      });
      setTimeout(() => {
        navigate('/');
      }, 100);
    }
  };

  const handleAction = (action: Partial<GameAction>) => {
    send({
      type: 'perform_action',
      playerId: getUserId(),
      action: {
        id: crypto.randomUUID(),
        playerId: getUserId(),
        type: action.type!,
        target: action.target,
        targetLocation: action.targetLocation,
        item: action.item,
        purchaseRight: action.purchaseRight,
        value: action.value,
      },
    });
  };

  if (!isConnected || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-lg dark:text-white">{t('common.loading')}</div>
      </div>
    );
  }

  const isHost = gameState.hostId === getUserId();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative">
      
      {(pendingAlien || pendingLoot) && isModalHidden && (
        <button
          onClick={() => setIsModalHidden(false)}
          className="fixed bottom-8 right-8 z-[100] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl font-bold flex items-center gap-2 animate-bounce cursor-pointer"
        >
          {t('game.backToPanel')}
        </button>
      )}

      {pendingAlien && !isModalHidden && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in border-2 border-cyan-500 relative">
            <button 
              onClick={() => setIsModalHidden(true)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 text-sm font-semibold cursor-pointer"
            >
              <Eye className="w-4 h-4" /> {t('game.viewBoard')}
            </button>

            <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-2 mt-4">{t('game.alienPassiveTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">
              {t('game.alienPassiveDesc')}
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => handleAction({ type: 'alien_passive_teleport', targetLocation: { type: 'central' } })}
                className="py-2 px-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold transition-colors shadow-md cursor-pointer"
              >
                {t('location.central')}
              </button>
              {Array.from(gameState.players.values()).filter(p => p.isAlive).map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAction({ type: 'alien_passive_teleport', targetLocation: { type: 'city', cityId: p.id } })}
                  className="py-2 px-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold transition-colors shadow-md truncate cursor-pointer"
                >
                  {t('log.cityOf', { name: p.name })}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleAction({ type: 'alien_passive_teleport', targetLocation: currentPlayer?.location })}
              className="w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              {t('game.stayHere')}
            </button>
          </div>
        </div>
      )}

      {pendingLoot && !isModalHidden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in border-2 border-yellow-500 relative">
            <button 
              onClick={() => setIsModalHidden(true)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 text-sm font-semibold cursor-pointer"
            >
              <Eye className="w-4 h-4" /> {t('game.viewBoard')}
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 mt-4">{t('game.killRewardTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('game.killRewardPrefix')} <span className="font-bold text-red-500">
                {gameState.pendingLoots.filter(p => p.killerId === getUserId())[0].victimName}
              </span> {t('game.killRewardSuffix')}
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {Object.entries(
                gameState.pendingLoots.filter(p => p.killerId === getUserId())[0].items.reduce((acc, item) => {
                  acc[item] = (acc[item] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([item, count]) => (
                <button
                  key={item}
                  onClick={() => handleAction({ 
                    type: 'claim_loot', 
                    target: gameState.pendingLoots.filter(p => p.killerId === getUserId())[0].victimId, 
                    item: item as ItemType 
                  })}
                  className="py-2 px-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-colors shadow-md cursor-pointer"
                >
                  {t(`item.${item}`)} {count > 1 ? `x${count}` : ''}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleAction({ 
                type: 'claim_loot', 
                target: gameState.pendingLoots.filter(p => p.killerId === getUserId())[0].victimId 
              })}
              className="w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              {t('game.giveUpLoot')}
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors cursor-pointer font-semibold"
          >
            <LogOut className="w-5 h-5" />
            {t('room.leave')}
          </button>
          
          <div className="flex items-center gap-4">
            
            <button
              onClick={() => setIsRulesOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors text-sm font-semibold cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{t('app.rules', '游戏规则')}</span>
            </button>

            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Users className="w-5 h-5" />
              <span>{gameState.players.size}/{gameState.settings.maxPlayers}</span>
            </div>
            
            {isHost && (gameState.phase === 'playing' || gameState.phase === 'class_selection') && (
              <button
                onClick={handleForceEnd}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors text-sm font-semibold cursor-pointer"
                title={t('game.forceEnd')}
              >
                <Power className="w-4 h-4" />
                <span className="hidden sm:inline">{t('game.forceEnd')}</span>
              </button>
            )}
          </div>
        </div>

        {gameState.phase === 'waiting' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 mb-6">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                {t('room.waiting')}
              </h2>

              <PlayerList 
                players={Array.from(gameState.players.values())} 
                showStatus={false}
              />

              <div className="mt-8 mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  {t('room.advancedSettings')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('room.initialHealth')}
                    </label>
                    {isHost ? (
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={gameState.settings.initialHealth ?? 10}
                        onChange={(e) => handleUpdateSettings({ initialHealth: parseInt(e.target.value) || 10 })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                      />
                    ) : (
                      <div className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white font-medium">
                        {gameState.settings.initialHealth ?? 10}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('room.classOptionsCount')}
                    </label>
                    {isHost ? (
                      <input
                        type="number"
                        min="1"
                        max="9"
                        value={gameState.settings.classOptionsCount ?? 3}
                        onChange={(e) => handleUpdateSettings({ classOptionsCount: parseInt(e.target.value) || 3 })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                      />
                    ) : (
                      <div className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white font-medium">
                        {gameState.settings.classOptionsCount ?? 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={gameState.players.size < gameState.settings.minPlayers}
                  className="w-full mt-2 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t('room.startGame')}
                </button>
              )}
            </div>
          </div>
        )}

        {gameState.phase === 'class_selection' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                {t('game.selectClass')}
              </h2>

              {currentPlayer?.class ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('game.classSelected')}: {t(`class.${currentPlayer.class}`)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t('game.waitingForOthers')}
                  </p>
                  
                  <PlayerList 
                    players={Array.from(gameState.players.values())}
                    highlightPlayerId={getUserId()}
                    showStatus={true}
                    compact={true}
                  />
                </div>
              ) : currentPlayer?.classOptions ? (
                <div>
                  <p className="text-center text-lg font-semibold text-blue-600 dark:text-blue-400 mb-6">
                    {t('game.yourTurn')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {currentPlayer.classOptions.map((classType) => (
                      <button
                        key={classType}
                        onClick={() => handleSelectClass(classType)}
                        className="p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                      >
                        <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                          {t(`class.${classType}`)}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {t('common.confirm')}
                        </p>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {t('game.allPlayersStatus')}
                    </h4>
                    <PlayerList 
                      players={Array.from(gameState.players.values())}
                      currentPlayerId={gameState.currentClassSelectionPlayerId}
                      highlightPlayerId={getUserId()}
                      showStatus={true}
                      compact={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {gameState.currentClassSelectionPlayerId && (
                      <>
                        <span className="font-semibold">
                          {gameState.players.get(gameState.currentClassSelectionPlayerId)?.name || ''}
                        </span>
                        {' '}{t('game.selecting')}
                      </>
                    )}
                  </p>
                  
                  <PlayerList 
                    players={Array.from(gameState.players.values())}
                    currentPlayerId={gameState.currentClassSelectionPlayerId}
                    highlightPlayerId={getUserId()}
                    showStatus={true}
                    compact={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {gameState.phase === 'playing' && currentPlayer && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {t('room.players')}
              </h3>
              <PlayerList 
                players={Array.from(gameState.players.values())}
                currentPlayerId={gameState.currentPlayerId}
                highlightPlayerId={getUserId()}
                showStatus={false}
                compact={true}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{currentPlayer.name}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span>{t('game.health')}</span>
                      </div>
                      <span className="font-bold">
                        {currentPlayer.health}/{currentPlayer.maxHealth}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Footprints className="w-5 h-5 text-blue-500" />
                        <span>{t('game.steps')}</span>
                      </div>
                      <span className="font-bold">{currentPlayer.stepsRemaining}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {t('game.inventory')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          currentPlayer.inventory.reduce((acc, item) => {
                            acc[item] = (acc[item] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([item, count], idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          >
                            {t(`item.${item}`)}{count > 1 ? ` x${count}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <ActionLog
                  logs={gameState.actionLogs || []}
                  currentPlayerId={getUserId()}
                  players={gameState.players}
                />
              </div>

              <div className="lg:col-span-2">
                <GameBoard
                  currentPlayer={currentPlayer}
                  allPlayers={Array.from(gameState.players.values())}
                  isMyTurn={gameState.currentPlayerId === getUserId()}
                  currentTurnPlayerId={gameState.currentPlayerId}
                  onAction={handleAction}
                  bombs={gameState.bombs}
                  delayedEffects={gameState.delayedEffects}
                  currentTurn={gameState.currentTurn}
                />
              </div>
            </div>
          </div>
        )}

        {gameState.phase === 'ended' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                {t('game.phase.ended')}
              </h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-center text-gray-900 dark:text-white">
                  {t('game.finalRankings')}
                </h3>
                <div className="space-y-3">
                  {Array.from(gameState.players.values())
                    .filter((p: Player) => p.rank)
                    .sort((a: Player, b: Player) => (a.rank || 999) - (b.rank || 999))
                    .map((player: Player, index: number) => (
                      <div
                        key={player.id}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          index === 0
                            ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 border-2 border-yellow-400'
                            : index === 1
                            ? 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-400'
                            : index === 2
                            ? 'bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 border-2 border-orange-400'
                            : 'bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center font-bold text-lg">
                          {player.rank}
                        </div>
                        
                        {player.avatar ? (
                          <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {player.name[0]?.toUpperCase()}
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {player.name}
                          </p>
                          {player.class && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t(`class.${player.class}`)}
                            </p>
                          )}
                        </div>
                        
                        {index === 0 && (
                          <div className="flex-shrink-0 px-3 py-1 rounded-full bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-100 text-sm font-bold">
                            🏆 {t('game.winner')}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleLeaveRoom}
                  className="w-full px-8 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  {t('room.leave')}
                </button>
                
                {isHost && (
                  <button
                    onClick={handleReturnToRoom}
                    className="w-full px-8 py-3 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer flex justify-center items-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    {t('game.playAgain')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
}