import { useTranslation } from 'react-i18next';
import { ScrollText } from 'lucide-react';
import type { ActionLog as ActionLogType, Player } from '../types/game';

interface ActionLogProps {
  logs: ActionLogType[];
  currentPlayerId: string;
  players: Map<string, Player>; // Add players map to resolve city owner names
}

export function ActionLog({ logs, currentPlayerId, players }: ActionLogProps) {
  const { t } = useTranslation();

  // Sort logs by timestamp (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'move':
        return '🚶';
      case 'purchase':
        return '🛒';
      case 'rob':
        return '🤝';
      case 'attack_knife':
        return '🗡️';
      case 'attack_horse':
        return '🐴';
      case 'shoot_arrow':
        return '🏹';
      case 'launch_rocket':
        return '🚀';
      case 'place_bomb':
        return '💣';
      case 'detonate_bomb':
        return '💥';
      case 'punch':
        return '👊';
      case 'kick':
        return '🦵';
      case 'teleport':
        return '🛸';
      case 'hug':
        return '🤗';
      case 'use_potion':
        return '🧪';
      default:
        return '⚡';
    }
  };

  const formatActionDescription = (log: ActionLogType) => {
    // Use structured actionResult if available
    if (log.actionResult) {
      const result = log.actionResult;
      
      switch (result.type) {
        case 'move':
          if (result.location.type === 'central') {
            return t('log.movedToCentral');
          } else {
            const cityOwner = players.get(result.location.cityId || '');
            return t('log.movedToCity', { city: cityOwner?.name || '?' });
          }
        
        case 'purchase':
          return t('log.purchased', { item: t(`item.${result.item}`) });
        
        case 'rob':
          if (result.success && result.item) {
            return t('log.robbed', { target: result.targetName, item: t(`item.${result.item}`) });
          } else {
            return t('log.robbedFailed', { target: result.targetName });
          }
        
        case 'attack': {
          const killed = result.killed ? t('log.killed') : '';
          return t('log.attackedWithDamage', {
            target: result.targetName,
            damage: result.damage,
            killed,
          });
        }
        
        case 'launch_rocket':{
          const locationOwner = result.location.cityId 
            ? players.get(result.location.cityId)?.name
            : undefined;
          const cityName = result.location.type === 'central' 
            ? t('game.central') 
            : locationOwner || '?';
          return t('log.launchedRocketToCityWithDamage', {
            city: cityName,
            damage: result.damage,
          });
        }
        
        case 'rocket_hit': {
          const locationOwner = result.location.cityId 
            ? players.get(result.location.cityId)?.name
            : undefined;
          const locationName = result.location.type === 'central'
            ? t('game.central')
            : locationOwner || '?';
          const killed = result.killed ? t('log.killed') : '';
          return t('log.rocketHit', {
            location: locationName,
            target: result.targetName,
            damage: result.damage,
            killed,
          });
        }
        
        case 'use_potion': {
          const locationOwner = result.location.cityId 
            ? players.get(result.location.cityId)?.name
            : undefined;
          const cityName = result.location.type === 'central'
            ? t('game.central')
            : locationOwner || '?';
          return t('log.usedPotionToCity', { city: cityName });
        }
        
        case 'potion_heal': {
          const locationOwner = result.location.cityId 
            ? players.get(result.location.cityId)?.name
            : undefined;
          const locationName = result.location.type === 'central'
            ? t('game.central')
            : locationOwner || '?';
          return t('log.potionHealed', {
            location: locationName,
            target: result.targetName,
            healed: result.healed,
          });
        }
        
        case 'place_bomb': {
          const locationOwner = result.location.cityId 
            ? players.get(result.location.cityId)?.name
            : undefined;
          const cityName = result.location.type === 'central'
            ? t('game.central')
            : locationOwner || '?';
          return t('log.placedBomb', { location: cityName });
        }
        
        case 'detonate_bomb':
          if (result.victims.length === 0) {
            return t('log.detonatedBombNoVictims');
          } else {
            const victimNames = result.victims.map(v => `${v.name} (${v.damage}${v.killed ? ', ' + t('log.killed') : ''})`).join(', ');
            return t('log.detonatedBomb', { victims: victimNames });
          }
        
        case 'teleport': {
          const locationOwner = result.location.cityId 
            ? players.get(result.location.cityId)?.name
            : undefined;
          if (result.location.type === 'central') {
            return t('log.teleportedToCentral');
          } else {
            return t('log.teleportedToCity', { city: locationOwner || '?' });
          }
        }
        
        case 'hug': {
          const locationOwner = result.location.cityId 
            ? players.get(result.location.cityId)?.name
            : undefined;
          if (result.location.type === 'central') {
            return t('log.huggedToCentral', { target: result.targetName });
          } else {
            return t('log.huggedToCity', { target: result.targetName, city: locationOwner || '?' });
          }
        }
      }
    }
    
    // Fallback to legacy parsing for backward compatibility
    return t(`action.${log.type}`);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <ScrollText className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {t('game.actionLog')}
        </h3>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedLogs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {t('game.noActionsYet')}
          </p>
        ) : (
          sortedLogs.map((log) => (
            <div
              key={log.id}
              className={`text-sm p-2 rounded-lg ${
                log.playerId === currentPlayerId
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getActionIcon(log.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 dark:text-white">
                    <span className="font-semibold">{log.playerName}</span>
                    <span className="mx-1">·</span>
                    <span>{formatActionDescription(log)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {t('game.turn')} {log.turn} · {formatTimestamp(log.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
