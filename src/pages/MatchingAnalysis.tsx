import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { getSpeciesById, generateFeatureReview, type FeatureReviewItem } from '../utils/matchingEngine';
import { SPECIES_DATABASE } from '../data/speciesDatabase';
import {
  Search, AlertTriangle, ArrowRight, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, BarChart3, Skull, Leaf, ShieldAlert,
  Check, Eye, ListChecks, ArrowLeft, Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useMemo } from 'react';

const CATEGORY_LABELS: Record<string, string> = {
  cap: '菌盖',
  gill: '菌褶',
  stem: '菌柄',
  ring: '菌环',
  volva: '菌托',
  spore: '孢印',
  habitat: '生境',
};

export default function MatchingAnalysis() {
  const navigate = useNavigate();
  const { candidates, risk, morphology, habitat } = useAppStore();
  const [expandedId, setExpandedId] = useState<number | null>(candidates[0]?.speciesId || null);
  const [reviewMode, setReviewMode] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const reviewItems = useMemo(() => {
    if (!reviewMode) return [];
    return generateFeatureReview(reviewMode, morphology, habitat);
  }, [reviewMode, morphology, habitat]);

  const criticalDiffs = useMemo(() => {
    return reviewItems.filter(item => item.isCritical && !item.isMatch);
  }, [reviewItems]);

  const allCriticalChecked = useMemo(() => {
    return criticalDiffs.every(item => checkedItems[`${reviewMode}-${item.key}`]);
  }, [criticalDiffs, checkedItems, reviewMode]);

  const allReviewed = useMemo(() => {
    return reviewItems.length > 0 && reviewItems.every(item => checkedItems[`${reviewMode}-${item.key}`]);
  }, [reviewItems, checkedItems, reviewMode]);

  const reviewedCount = reviewItems.filter(i => checkedItems[`${reviewMode}-${i.key}`]).length;

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [`${reviewMode}-${key}`]: !prev[`${reviewMode}-${key}`],
    }));
  };

  const enterReview = (speciesId: number) => {
    setReviewMode(speciesId);
    setExpandedId(speciesId);
    const items = generateFeatureReview(speciesId, morphology, habitat);
    const initial: Record<string, boolean> = {};
    items.forEach(item => {
      if (item.isMatch) initial[`${speciesId}-${item.key}`] = true;
    });
    setCheckedItems(prev => ({ ...prev, ...initial }));
  };

  const exitReview = () => {
    setReviewMode(null);
  };

  const goToRisk = () => {
    navigate('/risk');
  };

  if (!candidates.length) {
    return (
      <div className="card text-center py-16">
        <Search className="w-16 h-16 mx-auto text-mushroom-400 mb-4" />
        <h2 className="text-xl font-serif font-bold text-forest-800 mb-2">暂无比对结果</h2>
        <p className="text-sm text-mushroom-600 mb-6">请先在录入页填写形态特征后提交比对</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          去录入特征
        </button>
      </div>
    );
  }

  if (reviewMode) {
    const sp = getSpeciesById(reviewMode);
    if (!sp) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={exitReview}
            className="w-10 h-10 rounded-2xl bg-white border border-mushroom-200 flex items-center justify-center shadow-soft"
          >
            <ArrowLeft className="w-5 h-5 text-mushroom-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-serif font-bold text-forest-900 truncate">
              逐项复核 · {sp.chineseName}
            </h2>
            <p className="text-xs text-mushroom-500">
              已复核 {reviewedCount} / {reviewItems.length} 项
            </p>
          </div>
        </div>

        <div className="h-2 bg-mushroom-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-forest-500 to-forest-700 transition-all duration-500"
            style={{ width: `${(reviewedCount / reviewItems.length) * 100}%` }}
          />
        </div>

        {criticalDiffs.length > 0 && (
          <div className="card border-danger-400 border-2 bg-danger-50/80">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
              <h3 className="font-bold text-danger-800">
                ⚠️ 关键特征不一致 ({criticalDiffs.length} 项)
              </h3>
            </div>
            <div className="space-y-2">
              {criticalDiffs.map(item => (
                <div
                  key={item.key}
                  className="p-3 rounded-xl bg-white border border-danger-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-danger-100 text-[10px] font-bold text-danger-700">
                          关键
                        </span>
                        <span className="font-bold text-danger-800 text-sm">{item.label}</span>
                      </div>
                      <div className="text-xs space-y-0.5">
                        <p><span className="text-mushroom-500">您录入：</span><span className="font-medium text-danger-700">{item.inputValue}</span></p>
                        <p><span className="text-mushroom-500">标准特征：</span><span className="font-medium text-forest-700">{item.expectedValue}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCheck(item.key)}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        checkedItems[`${reviewMode}-${item.key}`]
                          ? 'bg-forest-600 border-forest-600'
                          : 'bg-white border-mushroom-300'
                      )}
                    >
                      {checkedItems[`${reviewMode}-${item.key}`] && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-danger-700 mt-3 bg-danger-100/50 rounded-lg p-2">
              ⚡ 关键特征不一致说明该候选种可能性低，请仔细确认后再打勾
            </p>
          </div>
        )}

        {Object.entries(CATEGORY_LABELS).map(([cat, catLabel]) => {
          const catItems = reviewItems.filter(i => i.category === cat);
          if (catItems.length === 0) return null;
          return (
            <div key={cat} className="card">
              <h3 className="text-sm font-bold text-forest-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-forest-500" />
                {catLabel}特征
                <span className="text-xs font-normal text-mushroom-500 ml-auto">
                  {catItems.filter(i => checkedItems[`${reviewMode}-${i.key}`]).length}/{catItems.length}
                </span>
              </h3>
              <div className="space-y-2">
                {catItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => toggleCheck(item.key)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all',
                      checkedItems[`${reviewMode}-${item.key}`]
                        ? item.isMatch
                          ? 'bg-forest-50 border-forest-300'
                          : 'bg-warn-50 border-warn-300'
                        : 'bg-white border-mushroom-200 hover:border-mushroom-300'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                        checkedItems[`${reviewMode}-${item.key}`]
                          ? item.isMatch
                            ? 'bg-forest-600 border-forest-600'
                            : 'bg-warn-500 border-warn-500'
                          : 'bg-white border-mushroom-300'
                      )}>
                        {checkedItems[`${reviewMode}-${item.key}`] && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            'text-sm font-bold',
                            item.isMatch ? 'text-forest-800' : 'text-warn-800'
                          )}>
                            {item.label}
                          </span>
                          {item.isCritical && (
                            <span className="px-1.5 py-0.5 rounded bg-danger-100 text-[9px] font-bold text-danger-700">
                              关键
                            </span>
                          )}
                          <span className="ml-auto text-[10px] font-bold text-mushroom-500">
                            {item.matchScore}%
                          </span>
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="text-mushroom-600">
                            您录入：<span className="font-medium text-mushroom-800">{item.inputValue}</span>
                          </p>
                          <p className="text-mushroom-500">
                            标准：<span className={cn(
                              'font-medium',
                              item.isMatch ? 'text-forest-700' : 'text-warn-700'
                            )}>{item.expectedValue}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {sp.lookalikeDangers.length > 0 && (
          <div className="card border-warn-300 bg-warn-50/50">
            <h3 className="text-sm font-bold text-warn-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              易混有毒种鉴别
            </h3>
            <div className="space-y-2">
              {sp.lookalikeDangers.map((d, i) => {
                const dangerSp = getSpeciesById(d.speciesId);
                return (
                  <div key={i} className="p-3 rounded-xl bg-white border border-warn-200">
                    <p className="text-xs font-bold text-danger-700 mb-1">
                      与 {dangerSp?.chineseName || '毒菌'} 的区别：
                    </p>
                    <p className="text-xs text-warn-800">{d.difference}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="sticky bottom-24 z-30 space-y-2">
          {!allCriticalChecked && criticalDiffs.length > 0 && (
            <div className="p-3 rounded-2xl bg-danger-100 border border-danger-300 text-danger-800 text-xs text-center">
              ⚠️ 仍有 {criticalDiffs.filter(i => !checkedItems[`${reviewMode}-${i.key}`]).length} 项关键特征不一致未确认
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={exitReview}
              className="btn-ghost flex-1 !py-3"
            >
              返回列表
            </button>
            <button
              onClick={goToRisk}
              className={cn(
                'btn-primary flex-1 !py-3 flex items-center justify-center gap-2',
              )}
            >
              <ShieldAlert className="w-4 h-4" />
              进入风险研判
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card bg-gradient-to-br from-forest-50 to-mushroom-50 border-forest-200">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-forest-700" />
          <h2 className="section-title !mb-0">特征比对结果</h2>
        </div>
        <p className="text-xs text-mushroom-600 mb-3">
          本地菌种库共 {SPECIES_DATABASE.length} 种，按加权相似度降序取 Top {candidates.length}
        </p>
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 border border-mushroom-100">
          {risk && (
            <RiskSummaryMini riskLevel={risk.overallRisk} recommendDiscard={risk.recommendDiscard} />
          )}
          <button
            onClick={() => navigate('/risk')}
            className="btn-danger !py-2 !px-4 flex-shrink-0 text-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            完整风险报告
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-mushroom-600">
          共 {candidates.length} 个候选种
        </span>
        <span className="text-[10px] text-mushroom-500">
          点击展开详情 · 再点进入逐项复核
        </span>
      </div>

      <div className="space-y-3">
        {candidates.map((cand, idx) => {
          const sp = getSpeciesById(cand.speciesId);
          if (!sp) return null;
          const expanded = expandedId === sp.id;
          return (
            <div
              key={sp.id}
              className={cn(
                'card transition-all duration-300 overflow-hidden',
                sp.toxicity.level >= 3 && 'border-danger-300 border-2',
                idx === 0 && 'ring-2 ring-forest-300'
              )}
            >
              <button
                onClick={() => setExpandedId(expanded ? null : sp.id)}
                className="w-full flex gap-4 items-start"
              >
                <div className="relative">
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0',
                    sp.toxicity.level >= 3
                      ? 'bg-gradient-to-br from-danger-100 to-danger-200'
                      : sp.safetyLevel >= 4
                        ? 'bg-gradient-to-br from-forest-100 to-forest-200'
                        : 'bg-gradient-to-br from-mushroom-100 to-mushroom-200'
                  )}>
                    {sp.imageUrl}
                  </div>
                  <div className={cn(
                    'absolute -top-1.5 -left-1.5 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center text-white shadow-md',
                    idx === 0 ? 'bg-forest-700' : 'bg-mushroom-500'
                  )}>
                    {idx + 1}
                  </div>
                  {sp.isAmanita && sp.toxicity.level >= 3 && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-danger-600 flex items-center justify-center shadow-md animate-pulse-slow">
                      <Skull className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-serif font-bold text-forest-900 text-base truncate">
                        {sp.chineseName}
                      </h3>
                      <p className="text-[11px] italic text-mushroom-500 truncate">
                        {sp.latinName} · {sp.commonName}
                      </p>
                    </div>
                    {expanded
                      ? <ChevronUp className="w-5 h-5 text-mushroom-500 flex-shrink-0" />
                      : <ChevronDown className="w-5 h-5 text-mushroom-500 flex-shrink-0" />}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="h-2.5 bg-mushroom-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-700',
                            cand.matchScore >= 80 ? 'bg-gradient-to-r from-forest-500 to-forest-700'
                              : cand.matchScore >= 60 ? 'bg-gradient-to-r from-warn-400 to-warn-600'
                                : 'bg-gradient-to-r from-danger-400 to-danger-600'
                          )}
                          style={{ width: `${cand.matchScore}%` }}
                        />
                      </div>
                    </div>
                    <span className={cn(
                      'text-sm font-bold w-12 text-right',
                      cand.matchScore >= 80 ? 'text-forest-700'
                        : cand.matchScore >= 60 ? 'text-warn-700'
                          : 'text-danger-700'
                    )}>
                      {cand.matchScore}%
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sp.toxicity.level >= 3 ? (
                      <span className="chip-red">
                        <Skull className="w-3 h-3" />
                        毒性 Lv.{sp.toxicity.level}
                      </span>
                    ) : sp.edibility.edible ? (
                      <span className="chip-green">
                        <Leaf className="w-3 h-3" />
                        可食
                      </span>
                    ) : (
                      <span className="chip-yellow">存疑</span>
                    )}
                    <span className={cn(
                      'chip',
                      sp.safetyLevel >= 4 ? 'bg-forest-50 text-forest-700'
                        : sp.safetyLevel >= 3 ? 'bg-warn-50 text-warn-700'
                          : 'bg-danger-50 text-danger-700'
                    )}>
                      安全度 {sp.safetyLevel}/5
                    </span>
                    {sp.isAmanita && <span className="chip-red">鹅膏属⚠️</span>}
                    {cand.habitatPenalty > 0 && (
                      <span className="chip-yellow">生境不符 -{cand.habitatPenalty}</span>
                    )}
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="mt-4 pt-4 border-t border-mushroom-100 space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-forest-50">
                      <p className="text-xs font-bold text-forest-700 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 匹配特征 {cand.matchedFeatures.length}
                      </p>
                      <div className="space-y-0.5 max-h-28 overflow-y-auto">
                        {cand.matchedFeatures.map(f => (
                          <p key={f} className="text-xs text-forest-800">• {f}</p>
                        ))}
                        {cand.matchedFeatures.length === 0 && <p className="text-xs text-mushroom-400">无</p>}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-danger-50">
                      <p className="text-xs font-bold text-danger-700 mb-1 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> 差异特征 {cand.differingFeatures.length}
                      </p>
                      <div className="space-y-0.5 max-h-28 overflow-y-auto">
                        {cand.differingFeatures.map(d => (
                          <p key={d.feature} className="text-xs text-danger-800">
                            <b>{d.feature}</b>：录入{d.input} ≠ 应有{d.expected}
                          </p>
                        ))}
                        {cand.differingFeatures.length === 0 && <p className="text-xs text-mushroom-400">无</p>}
                      </div>
                    </div>
                  </div>

                  {sp.lookalikeDangers.length > 0 && (
                    <div className="p-3 rounded-xl bg-warn-50 border-2 border-warn-200">
                      <p className="text-xs font-bold text-warn-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> 易混有毒种鉴别点
                      </p>
                      {sp.lookalikeDangers.map((d, i) => {
                        const dangerSp = getSpeciesById(d.speciesId);
                        return (
                          <div key={i} className="mb-2 last:mb-0">
                            <p className="text-xs font-semibold text-danger-700">
                              vs {dangerSp?.chineseName || '未知种'}
                            </p>
                            <p className="text-xs text-warn-800 mt-0.5">→ {d.difference}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => enterReview(sp.id)}
                      className="btn-primary flex-1 !py-2.5 text-sm flex items-center justify-center gap-1.5"
                    >
                      <ListChecks className="w-4 h-4" />
                      逐项复核
                    </button>
                    <button
                      onClick={() => navigate('/risk')}
                      className="btn-danger flex-1 !py-2.5 text-sm flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-4 h-4" />
                      快速风险研判
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiskSummaryMini({
  riskLevel, recommendDiscard,
}: {
  riskLevel: string;
  recommendDiscard: boolean;
}) {
  const riskConfigMap: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    extreme: { bg: 'bg-danger-100', text: 'text-danger-800', label: '极度危险', icon: Skull },
    high: { bg: 'bg-danger-100', text: 'text-danger-700', label: '高风险', icon: AlertTriangle },
    medium: { bg: 'bg-warn-100', text: 'text-warn-700', label: '中等风险', icon: AlertTriangle },
    low: { bg: 'bg-forest-100', text: 'text-forest-700', label: '低风险', icon: CheckCircle2 },
  };
  const config = riskConfigMap[riskLevel] || riskConfigMap.low;
  const Icon = config.icon;
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl flex-1', config.bg)}>
      <Icon className={cn('w-5 h-5', recommendDiscard && 'animate-pulse')} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-bold leading-tight', config.text)}>{config.label}</p>
        {recommendDiscard && (
          <p className="text-[11px] text-danger-700 leading-tight">强烈建议弃采</p>
        )}
      </div>
    </div>
  );
}
