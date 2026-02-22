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
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">🏃 Movement & Map</h4>
                          <p className="text-sm">You can only move between <strong>[Your City]</strong> and <strong>[Central]</strong>. Direct city-to-city travel is not allowed. (Costs 1 step).</p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">⚡ Actions (Steps)</h4>
                          <p className="text-sm">Every action costs "steps". Each turn you get <strong>1 base step + random bonus steps</strong>.</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">⚔️ How to Attack</h4>
                          <ul className="text-sm space-y-2">
                            <li>🗡️ <strong>Knife:</strong> Attack someone in the <em>same location</em>.</li>
                            <li>🐴 <strong>Horse:</strong> Attack someone in the <em>same City</em> (Kicks them back to Central).</li>
                          </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">🛡️ Damage & Defense</h4>
                          <p className="text-sm text-red-600 dark:text-red-400 font-semibold mb-1">Damage = Weapon Power - Target's Shirts + 1.</p>
                          <p className="text-xs text-gray-500">(Note: Boxers and Monks permanently have 0 shirts/defense!).</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm md:col-span-2">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2 border-b dark:border-gray-700 pb-1">💰 Items & Loot</h4>
                          <ul className="text-sm space-y-1">
                            <li>• <strong>Buy:</strong> Only in <em>Your Own City</em>. Must hold a Bow/Launcher to buy ammo.</li>
                            <li>• <strong>Rob:</strong> Steal from someone in the <em>same location</em>.</li>
                            <li>• <strong>Kill Reward:</strong> Pick 1 free item from the dead player's loot!</li>
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
                          <li><strong>Win Condition:</strong> The last surviving player wins. (If players die simultaneously, the killer is declared the winner).</li>
                          <li><strong>Setup:</strong> The host sets the initial health (default 10) and class options count (default 3). Players choose their class from random options before the game starts. Max 2 players can choose the same class per game.</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1.2 Characters & Map</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Attributes:</strong> Health, inventory, and remaining steps are public information visible to everyone.</li>
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
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2"><strong>Only allowed in [Your Own City].</strong> Consume 1 step and the purchase right to get the item. Consumables (ammo) do not consume the right. <strong>Note: You must own a Bow to buy Arrows, and a Rocket Launcher to buy Rocket Ammo.</strong></td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">Rob</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-yellow-500">1 step</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Target must be in the same location. Steal a physical item (excluding 'Fat'). Purchase rights cannot be stolen.</td>
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
                          <li><strong>Hold vs. Use:</strong> You can rob any item. However, if an item doesn't match your class (e.g., a Boxer holding a Knife), it only takes up space. You cannot use it or gain damage bonuses from it (Exception: Mage).</li>
                          <li><strong>Loot:</strong> When a player is killed, all their non-bound items enter a loot pool. <strong>The killer gets to pick 1 item for free</strong>, and the remaining items are destroyed.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.3 Settlement Order</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>FIFO (First In, First Out):</strong> Delayed skills (like Mage's potion or Rocketeer's rocket) resolve uniformly <strong>at the end of the specified round (after everyone has moved)</strong>.</li>
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
                      <p className="text-gray-500 dark:text-gray-400 mb-4">*(Note 2: Boxers and Monks permanently cannot equip shirts, so their shirt count is always 0)*</p>
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
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">① Mage</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Gear:</strong> No special starting rights. Can infinitely purchase 🧪 Potions (1 step each).</li>
                          <li><strong>Skill:</strong> Delayed Area Heal. Throw to any location on the map; resolves at the end of the next turn.</li>
                          <li><strong>Passive (All-rounder):</strong> If a Mage acquires another class's exclusive item (e.g. Bow, UFO), they can ignore class restrictions and use its skills, and can purchase corresponding ammo if the weapon is held.</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">② Archer</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Gear:</strong> Starts with a [Bow Purchase Right]. Can buy 🏹 Bows (2 steps) and 🎯 Arrows (1 step, must hold Bow first).</li>
                          <li><strong>Shoot:</strong> Costs 1 step + 1 arrow. Target must be in the same or adjacent location (City & Central are adjacent).</li>
                          <li><strong>Damage:</strong> 1 + (Bows - 1).</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">③ Rocketeer</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Gear:</strong> Starts with a [Launcher Purchase Right]. Can buy 🚀 Launchers (2 steps) and 📦 Ammo (1 step, must hold Launcher first).</li>
                          <li><strong>Fire:</strong> Costs 1 step + 1 ammo. Target any location globally; resolves at the end of the next turn.</li>
                          <li><strong>Damage:</strong> Deals 2 + (Launchers - 1) <strong>True Damage</strong>.</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">④ Bomber</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Gear:</strong> No special starting rights. Bombs do not need to be purchased and can be used directly (unlimited uses).</li>
                          <li><strong>Action:</strong> 1 step to place a bomb at your feet; 1 step to instantly detonate ALL your placed bombs on the map.</li>
                          <li><strong>Damage:</strong> Deals 1 <strong>True Damage</strong> per bomb.</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 border-l-4 border-l-red-500">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑤ Boxer</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Gear:</strong> Starts with 3 [Glove Purchase Rights] <strong>(Purchase cost: Bronze 1 step / Silver 2 steps / Gold 3 steps)</strong>. <strong className="text-red-600 dark:text-red-400">Severe Weakness: Starts with NO shirt and permanently CANNOT equip/use shirts (0 defense). Cannot use knives or horses.</strong></li>
                          <li><strong>Attack:</strong> 1 step for a melee attack (Same location). Bronze(1)/Silver(2)/Gold(3).</li>
                          <li><strong>Damage:</strong> Base + (Gloves - 1). Bronze 1 / Silver 2 / Gold 3 (<strong>True Damage</strong>).</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 border-l-4 border-l-red-500">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑥ Monk</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Gear:</strong> Starts with 3 [Belt Purchase Rights] <strong>(Purchase cost: Bronze 1 step / Silver 2 steps / Gold 3 steps)</strong>. <strong className="text-red-600 dark:text-red-400">Severe Weakness: Starts with NO shirt and permanently CANNOT equip/use shirts (0 defense). Cannot use knives or horses.</strong></li>
                          <li><strong>Attack:</strong> 1 step. <strong>True Damage + Forced Knockback</strong> (Targets in Central are kicked to their own city; targets in a city are kicked to Central).</li>
                          <li><strong>Damage/Range:</strong> Bronze 1 (Same location) / Silver 1 (Same or Adjacent location) / Gold 2 (Same location).</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑦ Alien</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Gear:</strong> Starts with a [UFO Purchase Right]. <strong>Cannot use horses.</strong></li>
                          <li><strong>Active:</strong> As long as you have a UFO, costs 1 step to teleport to any location on the map. <strong>(Limited to 1 use per turn, even with multiple UFOs)</strong>.</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑧ Fatty</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Gear:</strong> Starts with exclusive [Fat] (Grants 1 Defense, cannot be stolen, destroyed upon death). <strong>Cannot use horses.</strong></li>
                          <li><strong>Skill:</strong> For <strong>1 step</strong>, you can forcibly drag one player from your current location to move with you to an adjacent location.</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑨ Vampire</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Gear:</strong> No special starting rights. Normal knife/horse purchase.</li>
                          <li><strong>Passive:</strong> Attacking with a [Knife] instantly heals you for 1 HP (even if the damage is fully blocked by the target's armor).</li>
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
                          <li><strong>获胜条件：</strong> 存活到最后的一人获胜（特殊情况：若同归于尽，则由击杀者判胜）。</li>
                          <li><strong>开局流程：</strong> 房主可设定初始血量（默认10）和备选职业数（默认3）。每局开始前，系统会为每位玩家随机分配职业候选项，玩家确认选择后进入游戏。每局同一种职业最多允许2名玩家选择。</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1.2 角色与地图</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>角色属性：</strong> 玩家的血量、物品栏及剩余步数均为公开透明的信息，全场可见。</li>
                          <li><strong>初始装备：</strong> 衣服 x1，买刀权 x1，买马权 x1（部分特殊职业的初始权益会有所不同）。</li>
                          <li><strong>地图机制：</strong> 地图由【各玩家的专属城池】与【中央】组成。所有城池仅与中央相连。玩家之间无法直接从一个城池移动到另一个城池，必须经过中央进行中转。</li>
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
                        <p className="text-sm mb-2">每回合的任何行动都需要消耗“步数”。<br/><strong className="text-blue-500">每回合步数 = 基础步数(1步) + 随机分配步数（全场随机池总量 = 当前存活人数）。</strong></p>
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
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">在【当前所在城池】与【中央】之间移动一次。</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">购买</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-purple-500">1步+购买权</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2"><strong>仅限在【自己的城池】内进行。</strong>消耗 1步和对应物品的购买权，获得实体物品（箭矢、弹药为消耗品，购买后购买权不消失。<strong>注意：购买箭或火箭弹必须先拥有弓或火箭筒</strong>）。</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">抢夺</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-yellow-500">1步</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">必须与目标处于同一位置。抢夺对方任意一件实体物品（专属道具脂肪衣不可抢）。无法抢夺虚拟的购买权。</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">攻击-刀</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-red-500">1步</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">必须与目标处于同一位置。对目标造成伤害。</td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold">攻击-马</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-orange-500">1步</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">必须与目标同处在一个城池内（在中央不可使用）。造成伤害的同时，强制将目标踢回中央。</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.2 物品与遗物原则</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>持有 vs 使用：</strong> 玩家可抢夺任何实物。但若职业不匹配（例如拳击手抢到了刀），物品仅仅占用空间，玩家无法使用它，也无法从中获得任何伤害加成（法师特例除外）。</li>
                          <li><strong>遗物处理：</strong> 当一名玩家被击杀后，其身上所有的非绑定物品将进入待选池，<strong>击杀者可免费挑选 1 件</strong>作为战利品，其余物品全部就地销毁。</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2.3 结算顺序</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>按释放顺序生效 (FIFO)：</strong> 游戏中的延时类技能（如法师的药水、火箭兵的炮弹），将在<strong>其设定的轮数结束时（即全场所有人均行动完毕后）</strong>统一触发结算。</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* 3. 战斗数值系统 */}
                  <section>
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900 pb-2 mb-4">3. 战斗数值系统</h3>
                    <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg text-sm">
                      <p className="font-bold text-red-500 dark:text-red-400 mb-2">最终伤害 = (武器总伤害) - (衣服总数量) + 1</p>
                      <p className="text-gray-500 dark:text-gray-400 mb-2">*(注 1：若最终计算结果 ≤ 0，则造成 0 点伤害，即无法破防)*</p>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">*(注 2：拳击手与武僧由于永久无法穿戴衣服，在面对普通攻击时，其衣服数量计算始终为 0)*</p>
                      <ul className="space-y-2">
                        <li>🗡️ <strong>刀 (基础伤害 1):</strong> 总伤害 = 1 + (拥有刀的数量 - 1)</li>
                        <li>🐴 <strong>马 (基础伤害 3):</strong> 总伤害 = 3 + (拥有马的数量 - 1)</li>
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
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">① 法师 (Mage)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 开局无特殊购买权。可无限购买 🧪 药水 (每次消耗1步)。</li>
                          <li><strong>技能：</strong> 延时群体回血。可指定全图任意位置（某人城池或中央）投掷，下回合所有人行动结束后生效。</li>
                          <li><strong>被动（全职高手）：</strong> 只要拥有别的职业的专属道具，就可以无视职业限制使用其技能（如用弓射箭、坐飞碟传送等），并在拥有对应武器时可购买专属弹药。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">② 弓箭手 (Archer)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 开局自带【买弓权】。可购买 🏹 弓 (消耗2步) 和 🎯 箭矢 (消耗1步，<strong>必须先拥有弓才能购买</strong>)。</li>
                          <li><strong>射击：</strong> 消耗 1步+1支箭。攻击范围为同位置或相邻位置（中央与城池互为相邻）。</li>
                          <li><strong>伤害：</strong> 1 + (弓数量 - 1)。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">③ 火箭兵 (Rocketeer)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 开局自带【买火箭筒权】。可购买 🚀 火箭筒 (消耗2步) 和 📦 火箭弹 (消耗1步，<strong>必须先拥有火箭筒才能购买</strong>)。</li>
                          <li><strong>开火：</strong> 消耗 1步+1发弹药。指定全图任意位置，下回合所有人行动结束后生效。</li>
                          <li><strong>伤害：</strong> 造成 2 + (火箭筒数量 - 1) 点<strong>真实伤害</strong>。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">④ 爆破手 (Bomber)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 开局无特殊购买权。炸弹无需购买，可直接使用（不限次数）。</li>
                          <li><strong>埋弹/引爆：</strong> 消耗 1步在脚下埋置炸弹；消耗 1步瞬间引爆全场所有自己放置的炸弹。</li>
                          <li><strong>伤害：</strong> 每颗炸弹造成 1 点<strong>真实伤害</strong>。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 border-l-4 border-l-red-500">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑤ 拳击手 (Boxer)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 开局自带三种【买拳套权】<strong>（购买分别消耗：铜拳套 1步 / 银拳套 2步 / 金拳套 3步）</strong>。<strong className="text-red-600 dark:text-red-400">极度弱点：开局无衣服，且永久无法装备/使用衣服（受击无减伤），无法使用刀和马。</strong></li>
                          <li><strong>攻击：</strong> 消耗 1步进行近战攻击(同位置)。</li>
                          <li><strong>伤害：</strong> 基础值+(同种数量-1)。铜拳套 1点 / 银拳套 2点 / 金拳套 3点(<strong>均为真实伤害</strong>)。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 border-l-4 border-l-red-500">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑥ 武僧 (Monk)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始与购买：</strong> 开局自带三种【买腰带权】<strong>（购买分别消耗：铜腰带 1步 / 银腰带 2步 / 金腰带 3步）</strong>。<strong className="text-red-600 dark:text-red-400">极度弱点：开局无衣服，且永久无法装备/使用衣服（受击无减伤），无法使用刀和马。</strong></li>
                          <li><strong>攻击：</strong> 消耗 1步攻击。<strong>真实伤害 + 强制踢飞位移</strong>（如果目标在中央，会被踢回其自己的城池；如果目标在城池，会被踢回中央）。</li>
                          <li><strong>伤害/范围：</strong> 铜腰带 1点(仅限同位置) / 银腰带 1点(同位置或相邻位置均可) / 金腰带 2点(仅限同位置)。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑦ 外星人 (Alien)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始：</strong> 开局自带【买UFO权】。<strong>无法使用马。</strong></li>
                          <li><strong>主动瞬移：</strong> 只要拥有UFO，消耗 1步可瞬移至全图任意位置。<strong>（每回合限使用1次，拥有多个飞碟也是1次）</strong>。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑧ 胖子 (Fatty)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始：</strong> 开局自带专属道具【脂肪衣】(提供 1 点减伤防御，不可被抢夺，死亡后自动销毁)。<strong>无法使用马。</strong></li>
                          <li><strong>技能：</strong> 消耗 <strong>1步</strong>，可强制拖拽当前位置的任意一人，与你一同移动到相邻位置。</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">⑨ 吸血鬼 (Vampire)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>初始：</strong> 开局无特殊购买权。可正常购买刀和马。</li>
                          <li><strong>被动：</strong> 只要使用【刀】发起攻击（无论最终是否被护甲格挡防破），自身立刻回复 1 点血量。</li>
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