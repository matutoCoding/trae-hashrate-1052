import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { getSpeciesById } from '../utils/matchingEngine';
import { SPECIES_DATABASE } from '../data/speciesDatabase';
import {
  Search, AlertTriangle, ArrowRight, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, BarChart3, Skull, Leaf, ShieldAlert,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

export default function MatchingAnalysis() {
  const navigate = useNavigate();
  const { candidates, risk } = useAppStore();
  const [expandedId, setExpandedId] = useState<number | null>(candidates[0]?.speciesId || null);

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
                      onClick={() => navigate('/risk')}
                      className="btn-danger flex-1 !py-2 text-sm"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      风险研判
                    </button>
                    <button
                      onClick={() => navigate('/risk')}
                      className="btn-primary flex-1 !py-2 text-sm"
                    >
                      下一步
                      <ArrowRight className="w-4 h-4" />
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
  const config = {
    extreme: { bg: 'bg-danger-100', text: 'text-danger-800', label: '极度危险', icon: Skull },
    high: { bg: 'bg-danger-100', text: 'text-danger-700', label: '高风险', icon: AlertTriangle },
    medium: { bg: 'bg-warn-100', text: 'text-warn-700', label: '中等风险', icon: AlertTriangle },
    low: { bg: 'bg-forest-100', text: 'text-forest-700', label: '低风险', icon: CheckCircle2 },
  }[riskLevel as keyof any] || config.low;
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
