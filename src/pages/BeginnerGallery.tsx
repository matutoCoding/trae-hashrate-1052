import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { SPECIES_DATABASE, SEASON_OPTIONS, TREE_SPECIES_OPTIONS } from '../data/speciesDatabase';
import { getSpeciesById } from '../utils/matchingEngine';
import {
  Search, Filter, X, Leaf, Shield, AlertTriangle, Star, ChevronDown, ChevronUp,
  BookOpen, MapPin, Calendar, User, BookMarked, ArrowUpRight, Trash2,
} from 'lucide-react';
import { cn } from '../lib/utils';

type GalleryTab = 'system' | 'personal';

export default function BeginnerGallery() {
  const navigate = useNavigate();
  const { gallerySpeciesIds, personalGallery, removeFromGallery, removePersonalGalleryEntry } = useAppStore();
  const [activeTab, setActiveTab] = useState<GalleryTab>('system');
  const [search, setSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [treeFilter, setTreeFilter] = useState('');
  const [safetyFilter, setSafetyFilter] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [flippedId, setFlippedId] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const systemSpecies = SPECIES_DATABASE.filter((sp) =>
    gallerySpeciesIds.includes(sp.id) || sp.gallery
  );

  const filteredSystem = systemSpecies.filter((sp) => {
    if (search && !sp.chineseName.includes(search) && !sp.commonName.includes(search) && !sp.latinName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (seasonFilter && !sp.habitat.seasons.includes(seasonFilter)) return false;
    if (treeFilter && !sp.habitat.trees.includes(treeFilter)) return false;
    if (safetyFilter !== null && sp.safetyLevel !== safetyFilter) return false;
    return true;
  });

  const filteredPersonal = personalGallery.filter((entry) => {
    if (!search) return true;
    const sp = getSpeciesById(entry.speciesId);
    if (!sp) return false;
    return sp.chineseName.includes(search) || sp.commonName.includes(search) || entry.notes?.includes(search);
  });

  const safetyStars = (level: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3 h-3 ${n <= level ? 'text-warn-500 fill-warn-500' : 'text-mushroom-300'}`}
        />
      ))}
    </div>
  );

  const safetyLabel = (level: number) => {
    const map: Record<number, { text: string; cls: string }> = {
      5: { text: '极安全', cls: 'bg-forest-100 text-forest-700 border-forest-300' },
      4: { text: '安全', cls: 'bg-forest-50 text-forest-600 border-forest-200' },
      3: { text: '谨慎', cls: 'bg-warn-50 text-warn-700 border-warn-200' },
      2: { text: '不推荐', cls: 'bg-danger-50 text-danger-600 border-danger-200' },
      1: { text: '剧毒', cls: 'bg-danger-100 text-danger-700 border-danger-300' },
    };
    return map[level] || map[3];
  };

  const hasActiveFilters = search || seasonFilter || treeFilter || safetyFilter !== null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-gradient-to-br from-forest-600 via-forest-700 to-forest-800 rounded-3xl p-5 text-mushroom-50 shadow-soft relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-mushroom-100/10"></div>
        <div className="absolute -left-5 -bottom-5 w-24 h-24 rounded-full bg-mushroom-100/5"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-lg font-serif font-bold">入门图鉴</h2>
          </div>
          <p className="text-xs text-mushroom-200/90 leading-relaxed">
            收录经反复验证的安全菌种，支持个人踏查沉淀
          </p>

          <div className="mt-4 flex gap-2 p-1 bg-black/20 rounded-2xl">
            <button
              onClick={() => setActiveTab('system')}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                activeTab === 'system'
                  ? 'bg-mushroom-50 text-forest-800 shadow-md'
                  : 'text-mushroom-200 hover:text-mushroom-100'
              )}
            >
              <BookMarked className="w-4 h-4" />
              系统图鉴
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-forest-200 text-forest-800">
                {systemSpecies.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                activeTab === 'personal'
                  ? 'bg-mushroom-50 text-forest-800 shadow-md'
                  : 'text-mushroom-200 hover:text-mushroom-100'
              )}
            >
              <User className="w-4 h-4" />
              我的图鉴
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-forest-200 text-forest-800">
                {personalGallery.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'system' && (
        <>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mushroom-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索菌名、别名、拉丁名..."
                className="w-full pl-12 pr-10 py-3 rounded-2xl bg-white border-2 border-mushroom-200 text-sm text-forest-900 placeholder:text-mushroom-400 focus:border-forest-500 focus:outline-none transition-colors shadow-soft"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-mushroom-200 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-mushroom-600" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white border border-mushroom-200 text-sm shadow-soft"
            >
              <span className="flex items-center gap-2 text-mushroom-700 font-medium">
                <Filter className="w-4 h-4" />
                筛选条件
                {hasActiveFilters && (
                  <span className="px-2 py-0.5 rounded-full bg-forest-600 text-mushroom-50 text-[10px] font-bold">
                    已启用
                  </span>
                )}
              </span>
              {showFilters ? <ChevronUp className="w-5 h-5 text-mushroom-500" /> : <ChevronDown className="w-5 h-5 text-mushroom-500" />}
            </button>

            {showFilters && (
              <div className="bg-white rounded-2xl border border-mushroom-200 p-4 space-y-4 shadow-soft">
                <FilterChip
                  label="生长季节"
                  options={SEASON_OPTIONS.slice(0, 8)}
                  value={seasonFilter}
                  onChange={setSeasonFilter}
                />
                <FilterChip
                  label="伴生树种"
                  options={TREE_SPECIES_OPTIONS.slice(0, 12)}
                  value={treeFilter}
                  onChange={setTreeFilter}
                />
                <div>
                  <div className="text-xs font-bold text-mushroom-700 mb-2">安全等级</div>
                  <div className="flex flex-wrap gap-2">
                    {[5, 4, 3, 2, 1].map((lvl) => {
                      const sl = safetyLabel(lvl);
                      const active = safetyFilter === lvl;
                      return (
                        <button
                          key={lvl}
                          onClick={() => setSafetyFilter(active ? null : lvl)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1 transition-all ${
                            active ? sl.cls + ' ring-2 ring-offset-1 ring-forest-400' : 'bg-mushroom-50 text-mushroom-600 border-mushroom-200'
                          }`}
                        >
                          {Array(lvl).fill('★').join('')}
                          <span className="ml-0.5">{sl.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(''); setSeasonFilter(''); setTreeFilter(''); setSafetyFilter(null); }}
                    className="w-full py-2 rounded-xl bg-mushroom-100 text-mushroom-700 text-xs font-medium"
                  >
                    清除全部筛选
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-mushroom-600">
              共 <span className="font-bold text-forest-700">{filteredSystem.length}</span> 种
            </span>
            <span className="text-[10px] text-mushroom-500">点击卡片翻转查看鉴别要点</span>
          </div>

          {filteredSystem.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-mushroom-200 flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-10 h-10 text-mushroom-400" />
              </div>
              <p className="text-mushroom-600 text-sm">没有符合条件的菌种</p>
              <button
                onClick={() => { setSearch(''); setSeasonFilter(''); setTreeFilter(''); setSafetyFilter(null); }}
                className="mt-3 text-forest-600 text-xs font-medium underline"
              >
                重置筛选条件
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSystem.map((sp) => {
                const isFlipped = flippedId === sp.id;
                const sl = safetyLabel(sp.safetyLevel);
                const isConfirming = confirmRemove === `sys_${sp.id}`;

                return (
                  <div key={sp.id} className="relative h-80" style={{ perspective: '1000px' }}>
                    {isConfirming && (
                      <div className="absolute inset-0 z-30 bg-white rounded-3xl border-2 border-danger-300 p-4 flex flex-col justify-center shadow-xl">
                        <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-3">
                          <AlertTriangle className="w-6 h-6 text-danger-600" />
                        </div>
                        <p className="text-sm text-center text-mushroom-800 font-medium mb-2">
                          从系统图鉴移除「{sp.chineseName}」？
                        </p>
                        <p className="text-[11px] text-center text-mushroom-500 mb-4">
                          仍可在后续安全鉴定中重新添加
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="flex-1 py-2 rounded-xl bg-mushroom-100 text-mushroom-700 text-sm font-medium"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => { removeFromGallery(sp.id); setConfirmRemove(null); }}
                            className="flex-1 py-2 rounded-xl bg-danger-600 text-white text-sm font-bold"
                          >
                            确认移除
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      className="relative w-full h-full transition-transform duration-500"
                      style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : '' }}
                      onClick={() => !isConfirming && setFlippedId(isFlipped ? null : sp.id)}
                    >
                      <div
                        className="absolute inset-0 rounded-3xl bg-white border border-mushroom-200 shadow-soft overflow-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className={`h-28 bg-gradient-to-br ${
                          sp.safetyLevel >= 4
                            ? 'from-forest-400 via-forest-500 to-forest-700'
                            : sp.safetyLevel >= 3
                            ? 'from-warn-400 via-warn-500 to-warn-600'
                            : 'from-danger-400 via-danger-500 to-danger-700'
                        } flex items-center justify-center relative`}>
                          {sp.isAmanita && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[9px] font-bold text-danger-700">
                              ⚠️ 鹅膏科
                            </div>
                          )}
                          <div className="text-6xl drop-shadow-lg animate-float">{sp.imageUrl}</div>
                          <div className="absolute bottom-2 left-3 px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-bold flex items-center gap-1 border border-mushroom-200">
                            <Shield className="w-2.5 h-2.5 text-forest-600" />
                            {sl.text}
                          </div>
                        </div>

                        <div className="p-3">
                          <h3 className="text-base font-serif font-bold text-forest-900">{sp.chineseName}</h3>
                          <p className="text-[11px] italic text-mushroom-500 font-serif">{sp.latinName}</p>
                          <p className="text-xs text-mushroom-600 mt-0.5">{sp.commonName}</p>

                          <div className="mt-2 mb-2">{safetyStars(sp.safetyLevel)}</div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {sp.habitat.seasons.slice(0, 2).map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-md bg-forest-50 text-forest-700 text-[9px] font-medium border border-forest-100">
                                🌿 {s}
                              </span>
                            ))}
                            {sp.habitat.trees.slice(0, 2).map((t) => (
                              <span key={t} className="px-2 py-0.5 rounded-md bg-mushroom-100 text-mushroom-700 text-[9px] font-medium border border-mushroom-200">
                                🌲 {t}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-mushroom-100">
                            <span className="text-[10px] text-mushroom-500">点击翻转查看鉴别点 →</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmRemove(`sys_${sp.id}`); }}
                              className="p-1.5 rounded-lg hover:bg-mushroom-100 transition-colors"
                            >
                              <X className="w-3.5 h-3.5 text-mushroom-400" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div
                        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-mushroom-50 to-white border-2 border-forest-200 shadow-soft p-4 flex flex-col"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-forest-800 flex items-center gap-1">
                            <Leaf className="w-4 h-4 text-forest-600" />
                            关键鉴别点
                          </h4>
                          <span className="text-2xl">{sp.imageUrl}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                          {sp.keyIdentifiers.map((k, i) => (
                            <div key={i} className="text-xs text-mushroom-800 bg-forest-50/60 rounded-lg px-2.5 py-1.5 border-l-2 border-forest-500">
                              ✓ {k}
                            </div>
                          ))}
                        </div>

                        {sp.lookalikeDangers.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-mushroom-200">
                            <div className="text-[10px] font-bold text-danger-700 mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              易混有毒种警示
                            </div>
                            {sp.lookalikeDangers.map((ld, i) => {
                              const danger = SPECIES_DATABASE.find((s) => s.id === ld.speciesId);
                              return (
                                <div key={i} className="text-[10px] text-danger-700 bg-danger-50 rounded-lg px-2 py-1.5 mb-1 border border-danger-100">
                                  <span className="font-bold">与{danger?.chineseName || '毒菌'}区别：</span>
                                  {ld.difference}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="mt-2 pt-2 border-t border-mushroom-200">
                          <div className="text-[10px] font-bold text-mushroom-600 mb-0.5">🍳 食用建议</div>
                          <p className="text-[10px] text-mushroom-700 leading-relaxed">{sp.edibility.advice}</p>
                        </div>

                        <div className="mt-2 text-[9px] text-mushroom-400 text-center">
                          ← 点击翻回正面
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'personal' && (
        <>
          {personalGallery.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-mushroom-200 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-mushroom-400" />
              </div>
              <h3 className="text-lg font-serif font-bold text-forest-900 mb-2">暂无个人图鉴</h3>
              <p className="text-sm text-mushroom-600 mb-6 max-w-xs mx-auto">
                每次确认可食的踏查记录，都会自动沉淀到这里，方便以后对照学习
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 text-mushroom-50 font-medium shadow-soft active:scale-95 transition-transform"
              >
                开始采集鉴定
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-xs text-mushroom-600">
                  共 <span className="font-bold text-forest-700">{filteredPersonal.length}</span> 条个人记录
                </span>
                {search && (
                  <span className="text-[10px] text-mushroom-500">搜索: "{search}"</span>
                )}
              </div>

              <div className="space-y-3">
                {filteredPersonal.map((entry) => {
                  const sp = getSpeciesById(entry.speciesId);
                  const isConfirming = confirmRemove === entry.id;

                  return (
                    <div key={entry.id} className="relative">
                      {isConfirming && (
                        <div className="absolute inset-0 z-30 bg-white rounded-3xl border-2 border-danger-300 p-5 flex flex-col justify-center shadow-xl">
                          <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-3">
                            <Trash2 className="w-6 h-6 text-danger-600" />
                          </div>
                          <p className="text-sm text-center text-mushroom-800 font-medium mb-2">
                            从我的图鉴移除？
                          </p>
                          <p className="text-[11px] text-center text-mushroom-500 mb-4">
                            仅移除图鉴条目，不会删除原踏查记录
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmRemove(null)}
                              className="flex-1 py-2 rounded-xl bg-mushroom-100 text-mushroom-700 text-sm font-medium"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => { removePersonalGalleryEntry(entry.id); setConfirmRemove(null); }}
                              className="flex-1 py-2 rounded-xl bg-danger-600 text-white text-sm font-bold"
                            >
                              确认移除
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="card p-0 overflow-hidden">
                        <div className="flex gap-3 p-3">
                          {entry.photo ? (
                            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-mushroom-200 bg-mushroom-100">
                              <img src={entry.photo} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center flex-shrink-0 border border-mushroom-200">
                              <span className="text-4xl">{sp?.imageUrl || '🍄'}</span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0">
                                <h3 className="font-serif font-bold text-forest-900 text-base truncate">
                                  {entry.speciesName}
                                </h3>
                                <p className="text-[11px] text-mushroom-500">
                                  匹配度 <span className="font-bold text-forest-600">{entry.confidence}%</span>
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => navigate(`/archive/${entry.recordId}`)}
                                  className="w-8 h-8 rounded-xl bg-forest-50 flex items-center justify-center text-forest-600 hover:bg-forest-100 transition-colors"
                                  title="查看原踏查记录"
                                >
                                  <ArrowUpRight className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setConfirmRemove(entry.id)}
                                  className="w-8 h-8 rounded-xl bg-mushroom-50 flex items-center justify-center text-mushroom-500 hover:bg-danger-50 hover:text-danger-500 transition-colors"
                                  title="从图鉴移除"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1 mt-2">
                              <div className="flex items-center gap-1.5 text-[11px] text-mushroom-600">
                                <Calendar className="w-3.5 h-3.5 text-mushroom-400" />
                                {formatDate(entry.collectedAt)}
                              </div>
                              {entry.location.lat !== 0 && (
                                <div className="flex items-center gap-1.5 text-[11px] text-mushroom-600">
                                  <MapPin className="w-3.5 h-3.5 text-mushroom-400" />
                                  {entry.locationLabel || `${entry.location.lat.toFixed(3)}, ${entry.location.lng.toFixed(3)}`}
                                  {entry.location.altitude > 0 && ` · 海拔${entry.location.altitude}m`}
                                </div>
                              )}
                              {entry.notes && (
                                <p className="text-[11px] text-mushroom-600 italic mt-1.5 line-clamp-2">
                                  「{entry.notes}」
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {sp?.keyIdentifiers && sp.keyIdentifiers.length > 0 && (
                          <div className="px-3 pb-3 pt-2 border-t border-mushroom-100 bg-mushroom-50/50">
                            <p className="text-[10px] font-bold text-mushroom-500 mb-2 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              关键鉴别点回顾
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {sp.keyIdentifiers.slice(0, 3).map((k, i) => (
                                <span key={i} className="px-2 py-1 rounded-lg bg-forest-50 text-forest-700 text-[10px] border border-forest-100">
                                  ✓ {k.length > 12 ? k.slice(0, 12) + '...' : k}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => navigate(`/archive/${entry.recordId}`)}
                          className="w-full py-2.5 border-t border-mushroom-200 bg-forest-50/30 text-forest-700 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-forest-50 transition-colors"
                        >
                          查看完整踏查档案
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'system' && (
        <div className="bg-mushroom-50 rounded-2xl p-4 border border-mushroom-200 text-xs text-mushroom-600 space-y-2">
          <p className="font-bold text-mushroom-700 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-forest-600" />
            图鉴使用守则
          </p>
          <p>1. 系统图鉴仅收录经过充分验证的常见菌种，不代表该地点一定生长</p>
          <p>2. 我的图鉴来自您本人确认的踏查记录，仅供个人学习对照</p>
          <p>3. 采集前必须逐条比对六大形态特征（菌盖/菌褶/菌柄/菌环/菌托/孢印）</p>
          <p>4. 鹅膏属菌种即使标注安全，也建议由资深向导现场确认</p>
          <p>5. 特征有任何一项不符，立即弃采，切勿侥幸！</p>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-xs font-bold text-mushroom-700 mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(active ? '' : opt)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all ${
                active
                  ? 'bg-forest-600 text-white border-forest-600 shadow-soft'
                  : 'bg-white text-mushroom-700 border-mushroom-200 hover:border-forest-300'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
