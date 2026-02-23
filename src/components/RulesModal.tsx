import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, X, Zap, FileText } from 'lucide-react';

export function RulesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  // 增加状态控制：'quick' 极简模式 / 'detailed' 详细模式
  const [viewMode, setViewMode] = useState<'quick' | 'detailed'>('quick');

  if (!isOpen) return null;

  const isEn = i18n.language?.startsWith('en');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            {t('app.rules', isEn ? 'Game Rules' : '游戏规则')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 模式切换选项卡 */}
        <div className="px-6 pt-4 pb-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex justify-center sticky top-[81px] z-10">
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-full max-w-md">
            <button
              onClick={() => setViewMode('quick')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                viewMode === 'quick'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Zap className="w-5 h-5" />
              {isEn ? 'Quick Start' : '极简入门'}
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <FileText className="w-5 h-5" />
              {isEn ? 'Detailed Rules' : '完整规则'}
            </button>
          </div>
        </div>

        {/* 滚动内容区 */}
        <div className="p-6 overflow-y-auto space-y-8 text-gray-700 dark:text-gray-300">
          
          {/* ================= 极简版规则 (Quick Start) ================= */}
          {viewMode === 'quick' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              {isEn ? (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                    <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                      <Zap className="w-6 h-6 text-yellow-500" /> 1-Minute Quick Start
                    </h3>
                    
                    <div className="space-y-4">
                      <p className="font-semibold text-lg text-gray-900 dark:text-white">🎯 Goal: Be the last one alive!</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">� Game Setup</h4>
                          <ul className="text-sm space-y-1">
                            <li>• The host sets <strong>initial HP</strong> (default 15) and starts the game.</li>
                            <li>• Before each game, every player <strong>picks a class</strong> from 3 random options — each class has unique skills and restrictions.</li>
                            <li>• Turn order is randomized each game.</li>
                          </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">⚡ Steps & Your Turn</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Every action costs <strong>"steps"</strong>.</li>
                            <li>• Each turn you get: <strong>1 base step + randomly allocated bonus steps</strong>.</li>
                            <li>• Bonus step pool = <em>number of alive players</em>, split randomly each round.</li>
                            <li>• Spend all your steps or pass to end your turn.</li>
                          </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">🏙️ Movement & Map</h4>
                          <ul className="text-sm space-y-1">
                            <li>• The map has <strong>[Your City]</strong>, <strong>[Other Cities]</strong>, and <strong>[Central]</strong>.</li>
                            <li>• You can only move between your current spot and an adjacent one (1 step).</li>
                            <li>• Cities ↔ Central only. No direct city-to-city travel.</li>
                          </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">⚔️ How to Attack</h4>
                          <ul className="text-sm space-y-2">
                            <li>🗡️ <strong>Knife:</strong> Must be in the <em>same location</em>. Deals 1 dmg per knife (reduced by shirts).</li>
                            <li>🐴 <strong>Horse:</strong> Must be in the <em>same City</em> (not Central). Deals 3 dmg + kicks target to Central.</li>
                          </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">🛡️ Damage Formula</h4>
                          <p className="text-sm text-red-600 dark:text-red-400 font-semibold mb-1">Damage = Weapon Power − Target's Shirts + 1</p>
                          <ul className="text-xs text-gray-500 space-y-1">
                            <li>• Result ≤ 0 means 0 damage (defense held).</li>
                            <li>• Boxers &amp; Monks have no shirts — permanently 0 defense!</li>
                            <li>• Some class skills deal <strong>True Damage</strong> (ignores shirts entirely).</li>
                          </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">💰 Items & Loot</h4>
                          <ul className="text-sm space-y-1">
                            <li>• <strong>Buy:</strong> Only in <em>Your Own City</em>. Costs 1 step + a purchase right.</li>
                            <li>• Must own a Bow/Launcher before buying ammo.</li>
                            <li>• <strong>Rob:</strong> Steal 1 item from someone at the same location (1 step).</li>
                            <li>• <strong>Kill Reward:</strong> Pick 1 free item from the dead player's loot!</li>
                          </ul>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl shadow-sm md:col-span-2 border border-indigo-200 dark:border-indigo-700">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">👥 Team Mode (Optional)</h4>
                          <ul className="text-sm space-y-1">
                            <li>• <strong>Host</strong> can enable Team Mode in the lobby and set 2–8 teams.</li>
                            <li>• All players must pick a team before the game starts.</li>
                            <li>• Teammates <strong>share the same spawn city</strong> and must return there to buy.</li>
                            <li>• <strong>Win condition changes:</strong> Game ends when only one team has survivors.</li>
                            <li>• ⚠️ <strong>Friendly fire is ON</strong> — you can attack your own teammates!</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                    <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                      <Zap className="w-6 h-6 text-yellow-500" /> 一分钟极简入门
                    </h3>
                    
                    <div className="space-y-4">
                      <p className="font-semibold text-lg text-gray-900 dark:text-white">🎯 终极目标：活到最后，成为唯一的幸存者！</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">🏃 怎么走路？</h4>
                          <p className="text-sm">你只能在<strong>【你的城池】</strong>和<strong>【中央】</strong>两点一线来回移动。想去别人家必须先到中央中转。（移动消耗 1 步）。</p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">⚡ 行动步数</h4>
                          <p className="text-sm">干什么都要消耗“步数”。每回合你会获得 <strong>1个保底步数 + 随机分配的额外步数</strong>（看运气）。</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">⚔️ 怎么打人？</h4>
                          <ul className="text-sm space-y-2">
                            <li>🗡️ <strong>用刀:</strong> 必须和目标站在<em>同一个地方</em>才能砍。</li>
                            <li>🐴 <strong>用马:</strong> 必须和目标在<em>同一个城池里</em>才能踢（马在中央无法使用），踢完还会强制把对方踹回中央。</li>
                          </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">🛡️ 伤害与护甲</h4>
                          <p className="text-sm text-red-600 dark:text-red-400 font-semibold mb-1">最终伤害 = 武器总伤 - 对方衣服数量 + 1</p>
                          <p className="text-xs text-gray-500">（注意：拳击手和武僧天生没衣服穿，永远是 0 护甲！）</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm md:col-span-2">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">💰 发育与舔包</h4>
                          <ul className="text-sm space-y-1">
                            <li>• <strong>买东西：</strong> 必须跑回<em>自己的城池</em>才能买。（买弹药需先有对应武器）</li>
                            <li>• <strong>抢劫：</strong> 贴脸站一起，就能花 1 步抢别人的实物。</li>
                            <li>• <strong>舔包奖励：</strong> 击杀别人后，你可以免费从他的遗物里挑 1 件好东西！</li>
                          </ul>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl shadow-sm md:col-span-2 border border-indigo-200 dark:border-indigo-700">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">👥 团队模式（可选）</h4>
                          <ul className="text-sm space-y-1">
                            <li>• <strong>房主</strong>可在等待室开启团队模式，并设定 2～8 支队伍。</li>
                            <li>• 所有玩家必须在开局前选择队伍，否则无法开始。</li>
                            <li>• 同队玩家<strong>共享出生城池</strong>，购买也需返回该城池。</li>
                            <li>• <strong>胜利条件变更：</strong>场上存活玩家全部属于同一队伍时，该队伍获胜。</li>
                            <li>• ⚠️ <strong>队友伤害开启</strong>——你可以攻击自己的队友！</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= 完整版规则 (Detailed Rules) ================= */}
          {viewMode === 'detailed' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              {isEn ? (
                <>
                  {/* 1. Basic Rules */}
                  <section>
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900 pb-2 mb-4">1. Basic Rules</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1.1 Game Overview</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Players:</strong> ≥2 (Recommended max 8).</li>
                          <li><strong>Win Condition:</strong> The last surviving player wins. (Special case: If players die simultaneously, the killer is declared the winner).</li>
                          <li><strong>Setup:</strong> The host sets the initial health (default 15) and class options count (default 3). Players choose their class from random options before the game starts. The maximum number of players per class is configurable by the host (default 2).</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1.2 Characters & Map</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Attributes:</strong> Initial Health is 15 (configurable by host). Inventory, health, and remaining steps are public information.</li>
                          <li><strong>Initial Gear:</strong> Shirt x1, Knife Purchase Right x1, Horse Purchase Right x1 (Special classes may vary).</li>
                          <li><strong>Map Mechanics:</strong> The map consists of [Player Cities] and a [Central] hub. Cities only connect to Central. Direct city-to-city movement is impossible; you must transit through Central.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* 2. Turns & Actions */}
                  <section>
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900 pb-2 mb-4">2. Turns & Actions</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.1 Steps & Action Pool</h4>
                        <p className="text-sm mb-2">All actions require "steps".<br/><strong className="text-blue-500">Steps per turn = Base (1 step) + Randomly allocated steps (Total pool = number of currently alive players).</strong></p>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm text-left border-collapse border border-gray-300 dark:border-gray-600">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                              <tr>
                                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">Action</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">Cost</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">Move</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">1 step</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Move between your current City and Central.</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">Purchase</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-purple-500">1 step + Right</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2"><strong>Only allowed in [Your Own City].</strong> Consume 1 step and the purchase right to get the item. Consumables (ammo, bombs) do not consume the right. <strong>Note: You must own a Bow/Launcher to buy corresponding Ammo.</strong></td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">Rob</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-yellow-500">1 step</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Target must be in the same location. Randomly (or specifically) steal a physical item (excluding 'Fat'). Purchase rights cannot be stolen.</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">Attack (Knife)</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-red-500">1 step</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Target must be in the same location. Deals damage.</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">Attack (Horse)</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-orange-500">1 step</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Target must be in the same city (Cannot be used in Central). Deals damage and forcibly kicks the target back to Central.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.2 Items & Loot Rules</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Hold vs. Use:</strong> You can rob any item. However, if an item doesn't match your class, it only takes up space. You cannot use it or gain damage bonuses from it (Exception: Mage).</li>
                          <li><strong>Loot Handling:</strong> When a player is killed, all their non-bound items enter a loot pool. <strong>The killer gets to pick 1 item for free</strong>, and the remaining items are destroyed.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.3 Settlement Order</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>FIFO (First In, First Out):</strong> Delayed skills (like Mage's potion or Rocketeer's rocket) resolve uniformly <strong>at the end of the specified round (after everyone has moved)</strong>.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.4 Team Mode (Optional)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Setup:</strong> The host enables Team Mode in the lobby and sets 2–8 teams. All players must join a team before the game can start.</li>
                          <li><strong>Shared Spawn:</strong> All players on the same team start at the <strong>same city</strong> (anchored to teammate #1's city). Purchasing also requires returning to that shared city.</li>
                          <li><strong>Win Condition:</strong> The game ends when all surviving players belong to the same team. That team wins.</li>
                          <li><strong>Friendly Fire:</strong> Attacking teammates is allowed. No protection between team members.</li>
                          <li><strong>Rankings:</strong> Final standings are grouped by team. A team's rank equals the <strong>best individual rank</strong> among its members. All members are shown together under the team entry.</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* 3. Combat System */}
                  <section>
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900 pb-2 mb-4">3. Combat & Damage System</h3>
                    <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg text-sm">
                      <p className="font-bold text-red-500 dark:text-red-400 mb-2">Final Damage = (Total Weapon Damage) - (Total Shirts) + 1</p>
                      <p className="text-gray-500 dark:text-gray-400 mb-2">*(Note 1: If the final calculation is ≤ 0, the damage dealt is 0, meaning defense was not broken)*</p>
                      <ul className="space-y-2">
                        <li>🗡️ <strong>Knife (Base Damage 1):</strong> Total Damage = 1 + (Number of Knives - 1)</li>
                        <li>🐴 <strong>Horse (Base Damage 3):</strong> Total Damage = 3 + (Number of Horses - 1)</li>
                      </ul>
                    </div>
                  </section>

                  {/* 4. Classes */}
                  <section>
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900 pb-2 mb-4">4. Class Details</h3>
                    <p className="text-sm mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-lg">
                      <strong>Core Principle:</strong> All exclusive class items follow the <strong>"+1 quantity, +1 damage"</strong> stacking rule.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">① Vampire</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Initial & Buy:</strong> No special starting rights. Normal knife/horse purchase.</li>
                          <li><strong>Passive (Blood Leech):</strong> Attacking with a [Knife] instantly heals you for 1 HP (even if the damage is fully blocked). Max health cannot be exceeded.</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">② Alien</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Initial & Buy:</strong> Starts with [Knife Purchase Right]. <strong>Cannot use horses.</strong></li>
                          <li><strong>Active Teleport (1 step, limit 1/turn):</strong> Can teleport to any location on the map each turn.</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 border-l-4 border-l-red-500">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">③ Boxer</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Initial & Buy:</strong> Starts with 3 [Glove Purchase Rights] <strong>(Cost: Bronze 1 / Silver 2 / Gold 3)</strong>. <strong className="text-red-600 dark:text-red-400">No shirt, cannot use knives or horses.</strong></li>
                          <li><strong>Attack:</strong> 1 step for a melee attack with equipped gloves.</li>
                          <li><strong>Damage:</strong> Base + (Quantity - 1). Bronze 1 / Silver 2 / Gold 3 (<strong>True Damage</strong>).</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">④ Fatty</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Initial & Buy:</strong> Starts with exclusive [Fat] (Grants 1 Defense, cannot be stolen, destroyed upon death). <strong>Cannot use horses.</strong></li>
                          <li><strong>Hug Move:</strong> Costs <strong>1 step</strong> to forcibly drag one player from your current location to an adjacent location.</li>
                          <li><strong>Passive (Mass Suppression):</strong> At the end of your turn, all other players in the same City lose 1 HP. (Does not trigger in Central).</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑤ Archer</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Initial & Buy:</strong> Starts with [Bow Purchase Right]. Can buy 🏹 Bow (2 steps) and 🎯 Arrows (1 step, must hold Bow first).</li>
                          <li><strong>Shoot:</strong> Costs 1 step + 1 arrow.</li>
                          <li><strong>Range:</strong> Same or adjacent location (City & Central are adjacent).</li>
                          <li><strong>Damage:</strong> 1 + (Bows - 1).</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑥ Bomber</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Initial & Buy:</strong> No special starting rights. Normal knife/horse purchase.</li>
                          <li><strong>Place Bomb:</strong> 1 step to place a bomb at your feet (visible to all, stackable).</li>
                          <li><strong>Detonate:</strong> 1 step to instantly detonate ALL your placed bombs on the map.</li>
                          <li><strong>Damage:</strong> Deals 1 <strong>True Damage</strong> per bomb.</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 border-l-4 border-l-red-500">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑦ Monk</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Initial & Buy:</strong> Starts with 3 [Belt Purchase Rights] <strong>(Cost: Bronze 1 / Silver 2 / Gold 3)</strong>. <strong className="text-red-600 dark:text-red-400">No shirt, cannot use knives or horses.</strong></li>
                          <li><strong>Attack:</strong> 1 step. <strong>True Damage + Forced Knockback</strong> (Kicks target from Central to City, or City to Central).</li>
                          <li><strong>Damage/Range:</strong> Bronze 1 (Melee) / Silver 1 (Melee/Adjacent) / Gold 2 (Melee).</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑧ Rocketeer</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Initial & Buy:</strong> Starts with [Launcher Purchase Right]. Can buy 🚀 Launcher (2 steps) and 📦 Ammo (1 step, must hold Launcher first).</li>
                          <li><strong>Fire:</strong> Costs 1 step + 1 ammo.</li>
                          <li><strong>Range:</strong> Global AOE. Resolves at the end of the next turn.</li>
                          <li><strong>Damage:</strong> Deals 2 + (Launchers - 1) <strong>True Damage</strong>.</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑨ Mage</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Initial & Buy:</strong> No special starting rights. Can infinitely purchase 🧪 Potions (1 step each, does not occupy inventory slots).</li>
                          <li><strong>Skill:</strong> Delayed Area Heal. Throw to any location; resolves at the end of the next turn.</li>
                          <li><strong>Effect:</strong> Heals everyone at the location for X health (X = extra steps invested during cast).</li>
                          <li><strong>Passive (Weapon Master):</strong> Can ignore class restrictions to use any stolen exclusive weapons, and can buy corresponding ammo. <strong>Limit: only 1 borrowed skill (Arrow Shot / Rocket / Punch / Kick) per turn.</strong></li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <>
                  {/* 1. 基础规则 */}
                  <section>
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900 pb-2 mb-4">1. 基础规则</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1.1 游戏综述</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>游戏人数：</strong> ≥2 人（原则上最多 8 人）。</li>
                          <li><strong>获胜条件：</strong> 存活到最后的一人获胜（特殊情况：同归于尽时击杀者判胜）。</li>
                          <li><strong>开局流程：</strong> 房主可设定初始血量（默认15）和备选职业数（默认3）。每局开始前，系统为每位玩家随机分配候选项，玩家进行**选择**决定本局角色。每局同一种职业的人数上限可由房主配置（默认最多2名）。</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1.2 角色与地图</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>角色属性：</strong> 初始血量 15 点（可由房主配置）。玩家的物品栏、血量及步数均为公开透明。</li>
                          <li><strong>初始装备：</strong> 衣服 x1，买刀权 x1，买马权 x1（部分特殊职业会有所不同）。</li>
                          <li><strong>地图机制：</strong> 地图由【各玩家的城池】与【中央】组成。城池仅通往中央，玩家之间无法直接从一个城池移动到另一个城池，必须经过中央中转。</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* 2. 回合与行动 */}
                  <section>
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900 pb-2 mb-4">2. 回合与行动</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.1 步数与行动池</h4>
                        <p className="text-sm mb-2">每回合的行动需要消耗“步数”。<br/><strong className="text-blue-500">每回合步数 = 基础步数(1步) + 随机分配步数（随机池总量 = 当前存活人数）。</strong></p>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm text-left border-collapse border border-gray-300 dark:border-gray-600">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                              <tr>
                                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">行动名称</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">消耗</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">详细规则</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">移动</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">1步</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">在【所在城池】与【中央】之间移动一次。</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">购买</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-purple-500">1步+购买权</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2"><strong>仅限在【自己的城池】内进行。</strong>消耗1步和对应购买权获得实体物品（箭矢、弹药、炸弹为消耗品，购买权不消失。<strong>注意：购买箭或火箭弹必须先拥有弓或火箭筒</strong>）。</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">抢夺</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-yellow-500">1步</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">需与目标同位置。随机（或指定）抢夺对方任意一件实体物品（脂肪衣不可抢）。不可抢夺购买权。</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">攻击-刀</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-red-500">1步</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">需与目标同位置。对目标造成伤害。</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">攻击-马</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-orange-500">1步</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">需与目标同城内（中央不可用）。造成伤害 + 强制将目标踢回中央。</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.2 物品与遗物原则</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>持有 vs 使用：</strong> 玩家可抢夺任何物品。若职业不匹配（例如拳击手抢到了刀），物品仅占位，无法使用也无法提供伤害加成（法师例外）。</li>
                          <li><strong>遗物处理：</strong> 当一名玩家被击杀后，其身上所有的非绑定物品将进入待选池，<strong>击杀者可免费挑选 1 件</strong>作为战利品，其余物品全部销毁。</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.3 结算顺序 (Settlement Order)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>按释放顺序生效 (FIFO)：</strong> 游戏中的延时类技能（如法师的药水、火箭兵的炮弹），将在<strong>设定的轮数结束时（所有人均行动完毕后）</strong>统一触发结算。</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.4 团队模式（可选）</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>开启方式：</strong>房主在等待室打开团队模式开关，并设定队伍数量（2～8）。所有玩家必须选择队伍才能开局。</li>
                          <li><strong>共享出生城池：</strong>同队成员全部从<strong>同一座城池</strong>出发（锚定为队内第一成员的城池）。购买物品时也需回到该共享城池。</li>
                          <li><strong>胜利条件：</strong>当场上所有存活玩家均属于同一队伍时，该队伍立即获胜。</li>
                          <li><strong>队友伤害：</strong>允许攻击队友，队友之间无任何保护机制。</li>
                          <li><strong>排名规则：</strong>最终排名以队伍为单位展示。队伍排名 = 队内<strong>最佳个人名次</strong>。同队所有成员合并显示在该队伍条目下。</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* 3. 战斗数值系统 */}
                  <section>
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900 pb-2 mb-4">3. 战斗数值系统</h3>
                    <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg text-sm">
                      <p className="font-bold text-red-500 dark:text-red-400 mb-2">最终伤害 = (武器总伤害) - (衣服总数量) + 1</p>
                      <p className="text-gray-500 dark:text-gray-400 mb-2">*(注：若计算结果 ≤ 0，则造成 0 点伤害，即无法破防)*</p>
                      <ul className="space-y-2">
                        <li>🗡️ <strong>刀 (基础伤害 1):</strong> 总伤害 = 1 + (刀数量 - 1)</li>
                        <li>🐴 <strong>马 (基础伤害 3):</strong> 总伤害 = 3 + (马数量 - 1)</li>
                      </ul>
                    </div>
                  </section>

                  {/* 4. 职业系统详解 */}
                  <section>
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900 pb-2 mb-4">4. 职业系统详解</h3>
                    <p className="text-sm mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-lg">
                      <strong>核心原则：</strong> 所有职业专属道具的伤害均遵循<strong>【数量+1，伤害+1】</strong>的叠加规则。
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">① 吸血鬼 (Vampire)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 初始无特殊。正常购买刀马。</li>
                          <li><strong>被动（吸血）：</strong> 只要使用【刀】发起攻击（无论最终是否破防造成伤害），自身立刻回复 1 点血量（不超过血量上限）。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">② 外星人 (Alien)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 初始自带 买刀权 x1。<strong>无法使用马。</strong></li>
                          <li><strong>主动瞬移（1步，每回合限 1 次）：</strong> 每回合可消耗 1 步眼移动到地图上任意位置。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 border-l-4 border-l-red-500">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">③ 拳击手 (Boxer)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 初始自带 买三种拳套权。<strong>无衣服，无法使用刀和马。</strong> <br/> 🥉 铜拳套 (1步) / 🥈 银拳套 (2步) / 🥇 金拳套 (3步)</li>
                          <li><strong>攻击：</strong> 消耗 1步，选择佩戴的一种拳套进行近战攻击。</li>
                          <li><strong>伤害：</strong> 基础值 + (同种数量 - 1)。铜=1 / 银=2 / 金=3 (<strong>真实伤害</strong>)。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">④ 胖子 (Fatty)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 开局自带【脂肪衣】（提供1点防御，不可被抢夺，死后消失）。<strong>无法使用马。</strong></li>
                          <li><strong>抱人移动：</strong> 移动时消耗<strong>1步</strong>，可以强制拖拽当前位置的任意一人，与你一起移动到相邻位置。</li>
                          <li><strong>被动（体量压制）：</strong> 每回合行动结束时，与其位于同一座城池的其他玩家扣 1 滴血（如果胖子在中央则不触发）。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑤ 弓箭手 (Archer)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 初始自带 买弓权 x1。可购买 🏹 弓 (2步) 和 🎯 箭矢 (1步，必须先拥有弓才能购买)。</li>
                          <li><strong>射击：</strong> 消耗 1步 + 1支箭（需持有弓）。</li>
                          <li><strong>范围：</strong> 当前位置 或 相邻区域（中央与城池互为相邻）。</li>
                          <li><strong>伤害：</strong> 1 + (弓数量 - 1)。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑥ 爆破手 (Bomber)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 初始无特殊。正常购买刀马。</li>
                          <li><strong>埋弹：</strong> 消耗 1步。在脚下放置炸弹（全场可见，可堆叠）。</li>
                          <li><strong>引爆：</strong> 消耗 1步。瞬间引爆自己场上所有的炸弹。</li>
                          <li><strong>伤害：</strong> 每颗炸弹造成 1 点<strong>真实伤害</strong>。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 border-l-4 border-l-red-500">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑦ 武僧 (Monk)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 初始自带 买三种腰带权。<strong>无衣服，无法使用刀和马。</strong> <br/> 🥉 铜腰带 (1步) / 🥈 银腰带 (2步) / 🥇 金腰带 (3步)</li>
                          <li><strong>攻击：</strong> 消耗 1步，选择佩戴的一种腰带攻击。<strong>真实伤害 + 强制踢飞位移</strong>（中央踢回城，城池踢回中央）。</li>
                          <li><strong>伤害与范围：</strong> 铜=1(仅近战) / 银=1(可打相邻区域) / 金=2(仅近战)。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑧ 火箭兵 (Rocketeer)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 初始自带 买火箭筒权 x1。可购买 🚀 火箭筒 (2步) 和 📦 火箭弹 (1步，必须先拥有火箭筒才能购买)。</li>
                          <li><strong>开火：</strong> 消耗 1步 + 1发火箭弹（需持有火箭筒）。</li>
                          <li><strong>范围：</strong> 全图任意指定区域（延时AOE，下回合结束时生效）。</li>
                          <li><strong>伤害：</strong> 造成 2 + (火箭筒数量 - 1) 点<strong>真实伤害</strong>。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑨ 法师 (Mage)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 无特殊初始。可无限购买 🧪 药水 (消耗1步，且不占物品栏)。</li>
                          <li><strong>技能：</strong> 延时回血。指定全图任意位置（中央或某人城池）投掷，下回合所有人行动结束后生效。</li>
                          <li><strong>效果：</strong> 该位置上的所有人回复 X 点血量（X由施法时投入的额外步数决定）。</li>
                          <li><strong>被动（全职高手）：</strong> 法师只要拥有其他职业的专属道具，就可以无视职业限制使用其技能（如射箭、传送、拳套等），并在拥有对应武器时可购买专属弹药。<strong>每回合最多只能使用一次其他职业的专属技能（射箭、发射火箭、拳击、踢击四类中任选一次）。</strong></li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}