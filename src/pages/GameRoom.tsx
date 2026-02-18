import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Heart, Footprints } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { getUserId, getUserProfile } from '../utils/auth';
import { PlayerList } from '../components/PlayerList';
import { GameBoard } from '../components/GameBoard';
import { ActionLog } from '../components/ActionLog';
import type { GameState, Player, PlayerClass, GameAction } from '../types/game';

export function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isConnected, lastMessage, messageTimestamp, send } = useWebSocket(roomId || null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  useEffect(() => {
    // Set page title based on game phase
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

    // Join room
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
      
      // Convert players array back to Map if needed
      const processedState = {
        ...state,
        players: Array.isArray(state.players) 
          ? new Map(state.players.map((p: Player) => [p.id, p]))
          : state.players
      };
      
      // If logs are included in this update, use them; otherwise keep existing logs
      if (state.actionLogs !== undefined) {
        setGameState(processedState);
      } else {
        // Incremental update without logs - preserve existing logs
        setGameState(prevState => ({
          ...processedState,
          actionLogs: prevState?.actionLogs || [],
        }));
      }
      
      // Find current player
      const userId = getUserId();
      const player = processedState.players.get(userId);
      setCurrentPlayer(player || null);
    } else if (lastMessage.type === 'new_action_logs') {
      // Handle incremental log updates
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
  }, [lastMessage, messageTimestamp]); // Don't include gameState to avoid circular dependencies

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

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-lg dark:text-white">{t('common.loading')}</div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-lg dark:text-white">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Users className="w-5 h-5" />
            <span>{gameState.players.size}/{gameState.settings.maxPlayers}</span>
          </div>
        </div>

        {/* Waiting Phase */}
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

              {gameState.hostId === getUserId() && (
                <button
                  onClick={handleStartGame}
                  disabled={gameState.players.size < gameState.settings.minPlayers}
                  className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t('room.startGame')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Class Selection Phase */}
        {gameState.phase === 'class_selection' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                {t('game.selectClass')}
              </h2>

              {currentPlayer?.class ? (
                // Player has selected a class
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
                  
                  {/* Show all players' status */}
                  <PlayerList 
                    players={Array.from(gameState.players.values())}
                    highlightPlayerId={getUserId()}
                    showStatus={true}
                    compact={true}
                  />
                </div>
              ) : currentPlayer?.classOptions ? (
                // Player needs to select (it's their turn)
                <div>
                  <p className="text-center text-lg font-semibold text-blue-600 dark:text-blue-400 mb-6">
                    {t('game.yourTurn')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  
                  {/* Show all players' status */}
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
                // Waiting for turn
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
                  
                  {/* Show all players' status */}
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

        {/* Playing Phase */}
        {gameState.phase === 'playing' && currentPlayer && (
          <div className="space-y-6">
            {/* All Players Overview */}
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
              {/* Player Info and Action Log */}
              <div className="lg:col-span-1 space-y-6">
                {/* Player Info */}
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
                        {currentPlayer.inventory.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          >
                            {t(`item.${item}`)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Log */}
                <ActionLog
                  logs={gameState.actionLogs || []}
                  currentPlayerId={getUserId()}
                  players={gameState.players}
                />
              </div>

              {/* Game Board */}
              <div className="lg:col-span-2">
                <GameBoard
                  currentPlayer={currentPlayer}
                  allPlayers={Array.from(gameState.players.values())}
                  isMyTurn={gameState.currentPlayerId === getUserId()}
                  currentTurnPlayerId={gameState.currentPlayerId}
                  onAction={handleAction}
                />
              </div>
            </div>
          </div>
        )}

        {/* Game Ended */}
        {gameState.phase === 'ended' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                {t('game.phase.ended')}
              </h2>
              
              {/* Rankings */}
              <div className="mb-6">
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
                        {/* Rank */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center font-bold text-lg">
                          {player.rank}
                        </div>
                        
                        {/* Avatar */}
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
                        
                        {/* Name and Class */}
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
                        
                        {/* Winner badge */}
                        {index === 0 && (
                          <div className="flex-shrink-0 px-3 py-1 rounded-full bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-100 text-sm font-bold">
                            🏆 {t('game.winner')}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
              
              <button
                onClick={() => navigate('/')}
                className="w-full px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
