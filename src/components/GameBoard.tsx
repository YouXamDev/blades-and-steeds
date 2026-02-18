import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { 
  ShoppingCart, 
  Swords, 
  Hand,
  Zap,
  Target,
  Rocket,
  Bomb,
  Navigation,
  Heart
} from 'lucide-react';
import { StarMap } from './StarMap';
import type { Player, GameAction, ItemType } from '../types/game';

interface GameBoardProps {
  currentPlayer: Player;
  allPlayers: Player[];
  isMyTurn: boolean;
  currentTurnPlayerId: string | null;
  onAction: (action: Partial<GameAction>) => void;
}

export function GameBoard({ currentPlayer, allPlayers, isMyTurn, currentTurnPlayerId, onAction }: GameBoardProps) {
  const { t } = useTranslation();
  const [potionSteps, setPotionSteps] = useState(1);

  const canMove = currentPlayer.stepsRemaining > 0;
  const canBuy = currentPlayer.location.type === 'city' && 
                 currentPlayer.location.cityId === currentPlayer.id && 
                 currentPlayer.stepsRemaining > 0;

  const playersAtSameLocation = allPlayers.filter(p => 
    p.id !== currentPlayer.id &&
    p.location.type === currentPlayer.location.type &&
    p.location.cityId === currentPlayer.location.cityId
  );

  const handleMoveToCity = (cityId: string) => {
    if (!canMove) return;
    
    onAction({
      type: 'move',
      targetLocation: {
        type: 'city',
        cityId: cityId,
      },
    });
  };

  const handleMoveToCentral = () => {
    if (!canMove) return;
    
    onAction({
      type: 'move',
      targetLocation: {
        type: 'central',
      },
    });
  };

  // 获取可以移动到的位置
  const getAvailableMoveTargets = () => {
    if (!canMove) return [];
    
    if (currentPlayer.location.type === 'city') {
      // 在城池中，只能去中央
      return ['central'];
    } else {
      // 在中央，可以去任何城池
      return allPlayers.map(p => p.id);
    }
  };

  const availableMoves = getAvailableMoveTargets();

  const handleAttackKnife = (targetId: string) => {
    if (!canMove) return;
    onAction({
      type: 'attack_knife',
      target: targetId,
    });
  };

  const handleAttackHorse = (targetId: string) => {
    if (!canMove || currentPlayer.location.type !== 'city') return;
    onAction({
      type: 'attack_horse',
      target: targetId,
    });
  };

  const handleRob = (targetId: string, item?: ItemType) => {
    if (!canMove) return;
    onAction({
      type: 'rob',
      target: targetId,
      item: item,
    });
  };

  return (
    <div className="space-y-6">
      {/* Star Map */}
      <div className={`rounded-xl shadow-lg p-6 border-2 transition-all duration-300 ${
        isMyTurn 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-500 dark:border-blue-400'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          {t('game.map')}
          {isMyTurn && <span className="ml-2 text-blue-600 dark:text-blue-400">({t('game.yourTurn')})</span>}
        </h3>
        <StarMap
          players={allPlayers}
          currentPlayerId={currentPlayer.id}
          currentTurnPlayerId={currentTurnPlayerId}
          highlightCities={availableMoves.filter(m => m !== 'central')}
          onCityClick={isMyTurn && availableMoves.includes('central') === false ? handleMoveToCity : undefined}
          onCentralClick={isMyTurn && availableMoves.includes('central') ? handleMoveToCentral : undefined}
        />
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isMyTurn 
              ? canMove 
                ? t('game.clickToMove')
                : t('game.noSteps')
              : t('game.waitingForTurn')}
          </p>
        </div>
      </div>

      {/* Actions */}
      {isMyTurn ? (
        <div className="space-y-4">
          {/* Purchase (only in own city) */}
          {canBuy && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingCart className="w-6 h-6 text-purple-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('action.purchase')}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {currentPlayer.purchaseRights.map((right) => (
                  <button
                    key={right}
                    onClick={() => onAction({ type: 'purchase', purchaseRight: right })}
                    disabled={!canMove}
                    className="py-2 px-4 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold transition-colors disabled:cursor-not-allowed text-sm cursor-pointer"
                  >
                    {t(`item.${right}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Combat Actions */}
          {playersAtSameLocation.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Swords className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('action.attack')}
                </h3>
              </div>
              <div className="space-y-3">
                {playersAtSameLocation.map((player) => (
                  <div key={player.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">
                      {player.name} - ❤ {player.health}/{player.maxHealth}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAttackKnife(player.id)}
                        disabled={!canMove || !currentPlayer.inventory.includes('knife')}
                        className="py-2 px-3 rounded bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold transition-colors disabled:cursor-not-allowed cursor-pointer"
                      >
                        🗡️ {t('item.knife')}
                      </button>
                      {currentPlayer.location.type === 'city' && (
                        <button
                          onClick={() => handleAttackHorse(player.id)}
                          disabled={!canMove || !currentPlayer.inventory.includes('horse')}
                          className="py-2 px-3 rounded bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold transition-colors disabled:cursor-not-allowed cursor-pointer"
                        >
                          🐴 {t('item.horse')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rob Action */}
          {playersAtSameLocation.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Hand className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('action.rob')}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('game.robHint')}
              </p>
              <div className="space-y-3">
                {playersAtSameLocation.map((player) => (
                  <div key={player.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">
                      {player.name}
                    </p>
                    {player.inventory.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {player.inventory.map((item, idx) => (
                          <button
                            key={`${item}-${idx}`}
                            onClick={() => handleRob(player.id, item)}
                            disabled={!canMove}
                            className="py-1 px-3 rounded bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold transition-colors disabled:cursor-not-allowed cursor-pointer"
                          >
                            {t(`item.${item}`)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('game.noItems')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Class-specific abilities */}
          {currentPlayer.class && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-indigo-500">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-indigo-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t(`class.${currentPlayer.class}`)} - {t('game.abilities')}
                </h3>
              </div>

              {/* Mage: Potion */}
              {currentPlayer.class === 'mage' && (
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t('ability.potionSteps')}:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={potionSteps}
                      onChange={(e) => setPotionSteps(parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 border rounded text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onAction({ type: 'use_potion', targetLocation: { type: 'central' }, value: potionSteps })}
                      disabled={!canMove}
                      className="py-2 px-3 rounded bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Heart className="w-4 h-4 inline mr-1" />
                      {t('ability.toBeCentral')}
                    </button>
                    {allPlayers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onAction({ type: 'use_potion', targetLocation: { type: 'city', cityId: p.id }, value: potionSteps })}
                        disabled={!canMove}
                        className="py-2 px-3 rounded bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold truncate cursor-pointer disabled:cursor-not-allowed"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Archer: Shoot Arrow */}
              {currentPlayer.class === 'archer' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {!currentPlayer.inventory.includes('bow') && t('ability.needBow')}
                    {!currentPlayer.inventory.includes('arrow') && ' | ' + t('ability.needArrow')}
                  </p>
                  {playersAtSameLocation.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => onAction({ type: 'shoot_arrow', target: player.id })}
                      disabled={!canMove || !currentPlayer.inventory.includes('bow') || !currentPlayer.inventory.includes('arrow')}
                      className="w-full py-2 px-3 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Target className="w-4 h-4 inline mr-1" />
                      {player.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Rocketeer: Launch Rocket */}
              {currentPlayer.class === 'rocketeer' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {!currentPlayer.inventory.includes('rocket_launcher') && t('ability.needLauncher')}
                    {!currentPlayer.inventory.includes('rocket_ammo') && ' | ' + t('ability.needAmmo')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onAction({ type: 'launch_rocket', targetLocation: { type: 'central' } })}
                      disabled={!canMove || !currentPlayer.inventory.includes('rocket_launcher') || !currentPlayer.inventory.includes('rocket_ammo')}
                      className="py-2 px-3 rounded bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Rocket className="w-4 h-4 inline mr-1" />
                      {t('ability.toBeCentral')}
                    </button>
                    {allPlayers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onAction({ type: 'launch_rocket', targetLocation: { type: 'city', cityId: p.id } })}
                        disabled={!canMove || !currentPlayer.inventory.includes('rocket_launcher') || !currentPlayer.inventory.includes('rocket_ammo')}
                        className="py-2 px-3 rounded bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold truncate cursor-pointer disabled:cursor-not-allowed"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bomber: Bombs */}
              {currentPlayer.class === 'bomber' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onAction({ type: 'place_bomb' })}
                    disabled={!canMove || !currentPlayer.inventory.includes('bomb')}
                    className="py-2 px-3 rounded bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Bomb className="w-4 h-4 inline mr-1" />
                    {t('action.place_bomb')}
                  </button>
                  <button
                    onClick={() => onAction({ type: 'detonate_bomb' })}
                    disabled={!canMove}
                    className="py-2 px-3 rounded bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
                  >
                    💥 {t('action.detonate_bomb')}
                  </button>
                </div>
              )}

              {/* Boxer: Punch */}
              {currentPlayer.class === 'boxer' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {currentPlayer.inventory.filter(i => i === 'bronze_glove' || i === 'silver_glove' || i === 'gold_glove').length === 0 && t('ability.needGlove')}
                  </p>
                  {playersAtSameLocation.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => onAction({ type: 'punch', target: player.id })}
                      disabled={!canMove || currentPlayer.inventory.filter(i => i === 'bronze_glove' || i === 'silver_glove' || i === 'gold_glove').length === 0}
                      className="w-full py-2 px-3 rounded bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
                    >
                      👊 {player.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Monk: Kick */}
              {currentPlayer.class === 'monk' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {currentPlayer.inventory.filter(i => i === 'bronze_belt' || i === 'silver_belt' || i === 'gold_belt').length === 0 && t('ability.needBelt')}
                  </p>
                  {allPlayers.filter(p => p.id !== currentPlayer.id && p.isAlive).map((player) => (
                    <button
                      key={player.id}
                      onClick={() => onAction({ type: 'kick', target: player.id })}
                      disabled={!canMove || currentPlayer.inventory.filter(i => i === 'bronze_belt' || i === 'silver_belt' || i === 'gold_belt').length === 0}
                      className="w-full py-2 px-3 rounded bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
                    >
                      🦵 {player.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Alien: Teleport */}
              {currentPlayer.class === 'alien' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {!currentPlayer.inventory.includes('ufo') && t('ability.needUFO')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onAction({ type: 'teleport', targetLocation: { type: 'central' } })}
                      disabled={!canMove || !currentPlayer.inventory.includes('ufo')}
                      className="py-2 px-3 rounded bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Navigation className="w-4 h-4 inline mr-1" />
                      {t('ability.toBeCentral')}
                    </button>
                    {allPlayers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onAction({ type: 'teleport', targetLocation: { type: 'city', cityId: p.id } })}
                        disabled={!canMove || !currentPlayer.inventory.includes('ufo')}
                        className="py-2 px-3 rounded bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-semibold truncate cursor-pointer disabled:cursor-not-allowed"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fatty: Hug Move */}
              {currentPlayer.class === 'fatty' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('ability.hugCost')}
                  </p>
                  {playersAtSameLocation.length > 0 ? (
                    playersAtSameLocation.map((player) => (
                      <div key={player.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          {player.name}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onAction({ type: 'hug', target: player.id, targetLocation: { type: 'central' } })}
                            disabled={!canMove || currentPlayer.stepsRemaining < 2}
                            className="py-1 px-2 rounded bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
                          >
                            {t('ability.toBeCentral')}
                          </button>
                          {allPlayers.slice(0, 3).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => onAction({ type: 'hug', target: player.id, targetLocation: { type: 'city', cityId: p.id } })}
                              disabled={!canMove || currentPlayer.stepsRemaining < 2}
                              className="py-1 px-2 rounded bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-xs font-semibold truncate cursor-pointer disabled:cursor-not-allowed"
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('game.noPlayersHere')}
                    </p>
                  )}
                </div>
              )}

              {/* Vampire: Passive Info */}
              {currentPlayer.class === 'vampire' && (
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    💉 {t('ability.vampirePassive')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t('game.waitingForTurn')}
          </p>
        </div>
      )}
    </div>
  );
}
