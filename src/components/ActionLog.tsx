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

  // 彻底重写格式化函数，直接组装包含数值信息的详细中文战报
  const formatActionDescription = (log: ActionLogType) => {
    if (log.actionResult) {
      const result = log.actionResult;
      
      switch (result.type) {
        case 'move':
          if (result.location.type === 'central') {
            return '移动到了 中央';
          } else {
            const cityOwner = players.get(result.location.cityId || '');
            return `移动到了 ${cityOwner?.name || '?'} 的城池`;
          }
        
        case 'purchase':
          return `购买了 ${t(`item.${result.item}`)}`;
        
        case 'rob':
          if (result.success && result.item) {
            return `从 ${result.targetName} 那里获得了 ${t(`item.${result.item}`)}`;
          } else {
            return `尝试抢夺 ${result.targetName} 但失败了`;
          }
        
        case 'attack': {
          const killedText = result.killed ? '，并将其击杀！' : '';
          return `对 ${result.targetName} 发起攻击，造成了 ${result.damage} 点伤害${killedText}`;
        }
        
        case 'launch_rocket': {
          const locationOwner = result.location.cityId ? players.get(result.location.cityId)?.name : undefined;
          const cityName = result.location.type === 'central' ? '中央' : `${locationOwner || '?'} 的城池`;
          return `向 ${cityName} 发射了火箭（将造成 ${result.damage} 点伤害，下轮结束生效）`;
        }
        
        case 'rocket_hit': {
          const locationOwner = result.location.cityId ? players.get(result.location.cityId)?.name : undefined;
          const locationName = result.location.type === 'central' ? '中央' : `${locationOwner || '?'} 的城池`;
          const killedText = result.killed ? '，并将其击杀！' : '';
          return `火箭命中了 ${locationName} 的 ${result.targetName}，造成了 ${result.damage} 点伤害${killedText}`;
        }
        
        case 'use_potion': {
          const locationOwner = result.location.cityId ? players.get(result.location.cityId)?.name : undefined;
          const cityName = result.location.type === 'central' ? '中央' : `${locationOwner || '?'} 的城池`;
          return `向 ${cityName} 投掷了恢复药水（将恢复 ${result.steps} 点生命，下轮结束生效）`;
        }
        
        case 'potion_heal': {
          return `药水生效，为 ${result.targetName} 恢复了 ${result.healed} 点生命`;
        }
        
        case 'place_bomb': {
          const locationOwner = result.location.cityId ? players.get(result.location.cityId)?.name : undefined;
          const cityName = result.location.type === 'central' ? '中央' : `${locationOwner || '?'} 的城池`;
          return `在 ${cityName} 埋下了一颗炸弹`;
        }
        
        case 'detonate_bomb':
          if (result.victims.length === 0) {
            return `引爆了炸弹，但没有炸到任何人`;
          } else {
            const victimNames = result.victims.map(v => `${v.name} (-${v.damage}血${v.killed ? ', 阵亡' : ''})`).join(', ');
            return `引爆了炸弹，炸到了: ${victimNames}`;
          }
        
        case 'teleport': {
          const locationOwner = result.location.cityId ? players.get(result.location.cityId)?.name : undefined;
          const cityName = result.location.type === 'central' ? '中央' : `${locationOwner || '?'} 的城池`;
          return `传送到了 ${cityName}`;
        }
        
        case 'hug': {
          const locationOwner = result.location.cityId ? players.get(result.location.cityId)?.name : undefined;
          const cityName = result.location.type === 'central' ? '中央' : `${locationOwner || '?'} 的城池`;
          return `抱着 ${result.targetName} 一起移动到了 ${cityName}`;
        }
      }
    }
    
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