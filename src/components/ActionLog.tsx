import { useTranslation } from 'react-i18next';
import { ScrollText } from 'lucide-react';
import type { ActionLog as ActionLogType, Player } from '../types/game';

interface ActionLogProps {
  logs: ActionLogType[];
  currentPlayerId: string;
  players: Map<string, Player>; 
}

export function ActionLog({ logs, currentPlayerId, players }: ActionLogProps) {
  const { t } = useTranslation();

  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'move': return '🚶';
      case 'purchase': return '🛒';
      case 'rob': return '🤝';
      case 'attack_knife': return '🗡️';
      case 'attack_horse': return '🐴';
      case 'shoot_arrow': return '🏹';
      case 'launch_rocket': return '🚀';
      case 'place_bomb': return '💣';
      case 'detonate_bomb': return '💥';
      case 'punch': return '👊';
      case 'kick': return '🦵';
      case 'teleport': return '🛸';
      case 'hug': return '🤗';
      case 'use_potion': return '🧪';
      default: return '⚡';
    }
  };

  const formatActionDescription = (log: ActionLogType) => {
    if (log.actionResult) {
      const result = log.actionResult;
      
      const getCityName = (cityId?: string) => {
        if (!cityId) return t('location.central');
        const ownerName = players.get(cityId)?.name || t('game.unknown');
        return t('log.cityOf', { name: ownerName });
      };
      
      switch (result.type) {
        case 'move':
          return result.location.type === 'central' 
            ? t('log.moveCentral') 
            : t('log.moveCity', { city: getCityName(result.location.cityId) });
        
        case 'purchase':
          return t('log.purchase', { item: t(`item.${result.item}`) });
        
        case 'rob':
          return result.success && result.item
            ? t('log.robSuccess', { target: result.targetName, item: t(`item.${result.item}`) })
            : t('log.robFail', { target: result.targetName });
        
        case 'attack':
          return result.killed
            ? t('log.attackKilled', { target: result.targetName, damage: result.damage })
            : t('log.attack', { target: result.targetName, damage: result.damage });
        
        case 'launch_rocket':
          return t('log.launchRocket', { city: getCityName(result.location.cityId), damage: result.damage });
        
        case 'rocket_hit':
          return result.killed
            ? t('log.rocketHitKilled', { city: getCityName(result.location.cityId), target: result.targetName, damage: result.damage })
            : t('log.rocketHit', { city: getCityName(result.location.cityId), target: result.targetName, damage: result.damage });
        
        case 'use_potion':
          return t('log.usePotion', { city: getCityName(result.location.cityId), steps: result.steps });
        
        case 'potion_heal':
          return t('log.potionHeal', { target: result.targetName, healed: result.healed });
        
        case 'place_bomb':
          return t('log.placeBomb', { city: getCityName(result.location.cityId) });
        
        case 'detonate_bomb':
          if (result.victims.length === 0) {
            return t('log.detonateBombEmpty');
          } else {
            const victimNames = result.victims.map(v => `${v.name} (-${v.damage}HP${v.killed ? ' ☠️' : ''})`).join(', ');
            return t('log.detonateBombHit', { victims: victimNames });
          }
        
        case 'teleport':
          return t('log.teleport', { city: getCityName(result.location.cityId) });
        
        case 'hug':
          return t('log.hug', { target: result.targetName, city: getCityName(result.location.cityId) });
      }
    }
    return t(`action.${log.type}`);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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