import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { getSpeciesById } from '../utils/matchingEngine';
import { simulateDetoxification } from '../utils/detoxSimulator';
import type { CollectionRecord } from '../types';
import { saveRecordIndexedDB } from '../db/indexedDb';
import {
  AlertTriangle, Skull, Clock, Users, Thermometer, ShieldCheck,
  Trash2, HelpCircle, CheckCircle2, Archive, X, ChevronRight,
  Zap, MapPin, Eye, Flame, Ban,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

export default function RiskWarning() {
  const navigate = useNavigate();
  const {
    candidates, risk, morphology, habitat,
    addRecord, addToGallery,
  } = useAppStore();

  const [showAlert, setShowAlert] = useState(false);
  const [alertStep, setAlertStep] = useState(1);
  const [checkedRead, setCheckedRead] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const topToxic = candidates
    .map(c => ({ cand: c, sp: getSpeciesById(c.speciesId) }))
    .filter(x => x.sp && x.sp.toxicity.level >= 3 && x.cand.matchScore > 50)[0];

  const combinedToxins = Array.from(new Set(
    candidates
      .filter(c => c.matchScore > 50)
      .flatMap(c => getSpeciesById(c.speciesId)?.toxicity.types || [])
  ));

  const detox = simulateDetoxification(
    combinedToxins,
    !!(risk?.amanitaMatch && risk.amanitaHits.length >= 2)
  );

  useEffect(() => {
    if (risk?.recommendDiscard || (topToxic && topToxic.cand.matchScore > 60)) {
      setShowAlert(true);
    }
  }, [risk, topToxic]);

  const saveRecord = async (decision: CollectionRecord['finalDecision'], notes?: string) => {
    setSaving(true);
    const record: CollectionRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      collectedAt: habitat.collectedAt || new Date().toISOString(),
      habitat: habitat as any,
      morphology,
      matching: {
        candidates,
        topMatchId: candidates[0]?.speciesId,
      },
      risk: risk!,
      finalDecision: decision,
      decisionNotes: notes,
    };
    addRecord(record);
    await saveRecordIndexedDB(record);

    if (decision === 'edible') {
      const topMatch = candidates[0];
      const sp = topMatch && getSpeciesById(topMatch.speciesId);
      if (sp && sp.safetyLevel >= 4 && topMatch.matchScore > 80 && sp.edibility.edible) {
        addToGallery(sp.id);
      }
    }

    setSaving(false);
    navigate('/archive');
  };

  return (
    <div className="space-y-4">
      {showAlert && (
        <DangerAlert
          step={alertStep}
          setStep={setAlertStep}
          checkedRead={checkedRead}
          setCheckedRead={setCheckedRead}
          confirmed={confirmed}
          setConfirmed={setConfirmed}
          onClose={() => setShowAlert(false)}
          topToxicName={topToxic?.sp?.chineseName}
          amanitaHits={risk?.amanitaHits || []}
        />
      )}

      <RiskGauge risk={risk!} />

      {risk?.amanitaMatch && (
        <div className="card border-danger-400 border-2 bg-danger-50/80 animate-blink-red">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-danger-600 flex items-center justify-center shadow-danger-glow flex-shrink-0 animate-pulse-slow">
              <Skull className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-danger-800 text-lg">
                ⚠️ 剧毒鹅膏疑似匹配
              </h3>
              <p className="text-xs text-danger-700 mt-1">
                命中鹅膏属"死亡三连征"，与剧毒种高度相似
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {risk.amanitaHits.map(h => (
              <div key={h} className="flex items-center gap-2 p-2 bg-white/70 rounded-xl border border-danger-200">
                <CheckCircle2 className="w-4 h-4 text-danger-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-danger-800">{h}</span>
              </div>
            ))}
          </div>
          {topToxic && (
            <div className="mt-3 p-3 bg-white rounded-xl border border-danger-300">
              <p className="text-xs text-danger-600 font-semibold mb-1">最相似剧毒种</p>
              <p className="font-bold text-danger-800">
                {topToxic.sp?.chineseName}（{topToxic.cand.matchScore}% 匹配）
              </p>
              <p className="text-xs text-danger-700 mt-1 leading-relaxed">
                {topToxic.sp?.edibility.advice}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Skull} color="danger"
          label="毒性风险" value={`${risk?.toxicityRisk || 0}%`}
          desc={risk?.toxicityRisk > 60 ? '高毒性特征' : risk?.toxicityRisk > 30 ? '中等毒性特征' : '低毒性特征'}
        />
        <StatCard
          icon={Eye} color={risk?.misjudgmentWindow ? 'warn' : 'forest'}
          label="误判窗口"
          value={risk?.misjudgmentWindow ? '⚠️ 落入' : '安全'}
          desc={risk?.misjudgmentWindow ? '幼菇/老熟' : '成熟期可辨'}
        />
        <StatCard
          icon={Users} color={risk && risk.cooccurrenceProb > 40 ? 'warn' : 'forest'}
          label="混生概率" value={`${risk?.cooccurrenceProb || 0}%`}
          desc={risk && risk.cooccurringSpecies.length ? `${risk.cooccurringSpecies.length} 种伴生` : '周边单一'}
        />
        <StatCard
          icon={Thermometer} color={risk?.detoxPossible ? 'forest' : 'danger'}
          label="蒸煮解毒"
          value={risk?.detoxPossible ? '可解' : '❌ 无解'}
          desc={detox.overallBreakdown >= 95 ? `${detox.overallBreakdown}% 可分解` : '含热稳定毒素'}
        />
      </div>

      {risk?.misjudgmentWindow && (
        <div className="card border-warn-400 border-2 bg-warn-50/80">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-warn-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-warn-800 mb-1">高误判窗口警告</h3>
              <p className="text-sm text-warn-900 leading-relaxed">{risk.misjudgmentReason}</p>
            </div>
          </div>
        </div>
      )}

      {risk && risk.cooccurringSpecies.length > 0 && (
        <div className="card">
          <h3 className="section-title">
            <Users className="w-5 h-5" />
            周边混生风险
          </h3>
          <p className="text-xs text-mushroom-600 -mt-2 mb-3">
            同一生境易出现的相似种，不可批量同筐，务必单袋分装分别鉴定
          </p>
          <div className="space-y-2">
            {risk.cooccurringSpecies.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-warn-50 rounded-xl border border-warn-200">
                <div className="w-10 h-10 rounded-xl bg-warn-200 flex items-center justify-center text-xl">
                  🍄
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-warn-900 truncate">{s.name}</p>
                  <div className="mt-1 h-1.5 bg-warn-200 rounded-full overflow-hidden">
                    <div className="h-full bg-warn-500" style={{ width: `${s.prob}%` }} />
                  </div>
                </div>
                <span className="chip-yellow flex-shrink-0">{s.prob}%</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-danger-50 border border-danger-200">
            <p className="text-xs text-danger-800 flex items-start gap-2">
              <Ban className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><b>不可批量同筐！</b> 建议每朵单独装透明袋，写明编号后带回逐一显微鉴定。</span>
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">
          <Flame className="w-5 h-5" />
          蒸煮解毒模拟
        </h3>
        <div className={cn(
          'p-4 rounded-2xl mb-3',
          detox.finalVerdict === 'never' ? 'bg-danger-50 border-2 border-danger-400'
            : detox.finalVerdict === 'danger' ? 'bg-warn-50 border-2 border-warn-400'
              : 'bg-forest-50 border-2 border-forest-300'
        )}>
          <p className={cn(
            'font-bold mb-1',
            detox.finalVerdict === 'never' ? 'text-danger-800 text-base'
              : detox.finalVerdict === 'danger' ? 'text-warn-800'
                : 'text-forest-800'
          )}>
            {detox.finalVerdict === 'never' && '🚫 绝对不可食'}
            {detox.finalVerdict === 'danger' && '⚠️ 高风险'}
            {detox.finalVerdict === 'caution' && '⚖️ 谨慎食用'}
            {detox.finalVerdict === 'safe' && '✅ 可安全食用'}
          </p>
          <p className="text-sm text-mushroom-800 leading-relaxed">{detox.explanation}</p>
          {detox.dangerousToxins.length > 0 && (
            <div className="mt-3 space-y-1">
              {detox.dangerousToxins.map(t => (
                <div key={t} className="flex items-center gap-2 text-xs">
                  <Zap className="w-3.5 h-3.5 text-danger-600" />
                  <span className="font-semibold text-danger-700">{t}</span>
                  <span className="text-danger-600">— 极耐热，任何烹饪无效</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {detox.methods.map(m => (
            <div
              key={m.method}
              className={cn(
                'p-3 rounded-xl border-2 transition-all',
                m.residualRisk === 'extreme' ? 'bg-danger-50 border-danger-300'
                  : m.residualRisk === 'high' ? 'bg-warn-50 border-warn-300'
                    : m.residualRisk === 'medium' ? 'bg-warn-50 border-warn-200'
                      : 'bg-forest-50 border-forest-200'
              )}>
              <div className="flex items-center justify-between mb-1.5">
                <p className={cn(
                  'font-semibold text-sm',
                  m.residualRisk === 'extreme' || m.residualRisk === 'high' ? 'text-danger-800'
                    : m.residualRisk === 'medium' ? 'text-warn-800'
                      : 'text-forest-800'
                )}>{m.label}</p>
                <span className={cn(
                  'text-sm font-bold',
                  m.totalBreakdown >= 95 ? 'text-forest-700'
                    : m.totalBreakdown >= 80 ? 'text-warn-700'
                      : 'text-danger-700'
                )}>{m.totalBreakdown}%</span>
              </div>
              <p className={cn(
                'text-xs',
                m.residualRisk === 'extreme' || m.residualRisk === 'high' ? 'text-danger-700'
                  : m.residualRisk === 'medium' ? 'text-warn-700'
                    : 'text-forest-700'
              )}>{m.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {candidates.slice(0, 3).map(c => {
        const sp = getSpeciesById(c.speciesId);
        if (!sp || sp.lookalikeDangers.length === 0) return null;
        return (
          <div key={sp.id} className="card border-danger-300 border-2">
            <h3 className="section-title text-danger-800">
              <ShieldCheck className="w-5 h-5" />
              {sp.chineseName} 关键鉴别点（强制标红）
            </h3>
            <div className="space-y-2">
              {sp.keyIdentifiers.slice(0, 4).map(k => (
                <div key={k} className="p-3 rounded-xl bg-danger-50 border-2 border-danger-300 flex items-start gap-2">
                  <span className="text-danger-600 font-bold mt-0.5">🔴</span>
                  <p className="text-sm text-danger-900 font-semibold">{k}</p>
                </div>
              ))}
              {sp.lookalikeDangers.map((d, i) => {
                const dSp = getSpeciesById(d.speciesId);
                return (
                  <div key={i} className="p-3 rounded-xl bg-warn-50 border-2 border-warn-300 mt-3">
                    <p className="font-bold text-warn-800 text-sm mb-1">
                      vs {dSp?.chineseName}（{dSp?.toxicity.level ? '可食/低毒' : '可食'}）
                    </p>
                    <p className="text-sm text-warn-900">💡 {d.difference}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }).filter(Boolean)}

      <div className="sticky bottom-24 z-30 space-y-2">
        {risk?.recommendDiscard ? (
          <button
            onClick={() => saveRecord('discarded')}
            disabled={saving}
            className="w-full btn-danger text-base animate-pulse-slow"
          >
            <Trash2 className="w-5 h-5" />
            {saving ? '保存中...' : '🚨 立即弃采并归档记录'}
          </button>
        ) : (
          <>
            <button
              onClick={() => saveRecord('discarded')}
              disabled={saving}
              className="w-full btn-danger !py-3 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              选择弃采
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => saveRecord('pending', '需进一步鉴定')}
                disabled={saving}
                className="btn-warn !py-3 text-sm"
              >
                <HelpCircle className="w-4 h-4" />
                待定/显微
              </button>
              <button
                onClick={() => {
                  if (!risk?.detoxPossible) {
                    if (!confirm('⚠️ 系统判定蒸煮无法解毒，仍要标记为可食？')) return;
                  }
                  saveRecord('edible');
                }}
                disabled={saving}
                className="btn-primary !py-3 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                确认可食
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RiskGauge({ risk }: { risk: any }) {
  const segments = [
    { key: 'toxic', label: '剧毒风险', value: risk?.toxicityRisk || 0, color: 'danger' },
    { key: 'misjudge', label: '误判风险', value: risk?.misjudgmentWindow ? 85 : 10, color: 'warn' },
    { key: 'cooc', label: '混生风险', value: risk?.cooccurrenceProb || 0, color: 'orange' },
    { key: 'detox', label: '解毒概率', value: risk?.detoxPossible ? 95 : 5, color: 'forest' },
  ];
  return (
    <div className="card bg-gradient-to-br from-mushroom-50 via-white to-forest-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title !mb-0">
          <AlertTriangle className="w-5 h-5" />
          综合风险研判
        </h2>
        <span className={cn(
          'chip font-bold',
          risk?.overallRisk === 'extreme' && 'bg-danger-600 text-white animate-pulse-slow',
          risk?.overallRisk === 'high' && 'chip-red',
          risk?.overallRisk === 'medium' && 'chip-yellow',
          risk?.overallRisk === 'low' && 'chip-green',
        )}>
          {({ extreme: '🔴 极度', high: '🟠 高', medium: '🟡 中', low: '🟢 低' } as any)[risk?.overallRisk || 'low']}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {segments.map(s => (
          <div key={s.key} className="p-3 rounded-2xl bg-white/80 border border-mushroom-100">
            <p className="text-[11px] text-mushroom-600 mb-1.5">{s.label}</p>
            <div className="relative h-3">
              <svg viewBox="0 0 100 10" className="w-full h-full">
                <circle cx="6" cy="5" r="4.5" fill="none" stroke={
                  s.color === 'danger' ? '#fee4e2'
                    : s.color === 'warn' ? '#fef3c7'
                      : s.color === 'orange' ? '#ffedd5'
                        : '#d1fae5'
                } strokeWidth="2" />
                <circle cx="22" cy="5" r="4.5" fill="none" stroke={
                  s.color === 'danger' ? '#fee4e2' : s.color === 'warn' ? '#fef3c7' : s.color === 'orange' ? '#ffedd5' : '#d1fae5'
                } strokeWidth="2" />
                <circle cx="38" cy="5" r="4.5" fill="none" stroke={
                  s.color === 'danger' ? '#fee4e2' : s.color === 'warn' ? '#fef3c7' : s.color === 'orange' ? '#ffedd5' : '#d1fae5'
                } strokeWidth="2" />
                <circle cx="54" cy="5" r="4.5" fill="none" stroke={
                  s.color === 'danger' ? '#fee4e2' : s.color === 'warn' ? '#fef3c7' : s.color === 'orange' ? '#ffedd5' : '#d1fae5'
                } strokeWidth="2" />
                <circle cx="70" cy="5" r="4.5" fill="none" stroke={
                  s.color === 'danger' ? '#fee4e2' : s.color === 'warn' ? '#fef3c7' : s.color === 'orange' ? '#ffedd5' : '#d1fae5'
                } strokeWidth="2" />
                <circle cx="86" cy="5" r="4.5" fill="none" stroke={
                  s.color === 'danger' ? (s.value >= 80 ? '#c81e1e' : '#fee4e2')
                    : s.color === 'warn' ? (s.value >= 80 ? '#e8a33d' : '#fef3c7')
                      : s.color === 'orange' ? (s.value >= 40 ? '#f97316' : '#ffedd5')
                        : (s.value >= 60 ? '#2d8a4e' : '#d1fae5')
                } strokeWidth="2" />
              </svg>
            </div>
            <p className={cn(
              'text-lg font-bold mt-1.5',
              s.color === 'danger' ? 'text-danger-700'
                : s.color === 'warn' ? 'text-warn-700'
                  : s.color === 'orange' ? 'text-orange-700'
                    : 'text-forest-700'
            )}>{s.value}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, color, label, value, desc,
}: {
  icon: any;
  color: 'danger' | 'warn' | 'forest';
  label: string;
  value: string;
  desc: string;
}) {
  const map = {
    danger: { bg: 'bg-danger-50', border: 'border-danger-200', icon: 'text-danger-600', val: 'text-danger-800' },
    warn: { bg: 'bg-warn-50', border: 'border-warn-200', icon: 'text-warn-600', val: 'text-warn-800' },
    forest: { bg: 'bg-forest-50', border: 'border-forest-200', icon: 'text-forest-600', val: 'text-forest-800' },
  }[color];
  return (
    <div className={cn('p-4 rounded-2xl border-2', map.bg, map.border)}>
      <Icon className={cn('w-5 h-5 mb-1', map.icon)} />
      <p className="text-[11px] text-mushroom-600">{label}</p>
      <p className={cn('text-xl font-bold mt-0.5', map.val)}>{value}</p>
      <p className="text-[10px] text-mushroom-500 mt-0.5">{desc}</p>
    </div>
  );
}

function DangerAlert({
  step, setStep, checkedRead, setCheckedRead, confirmed, setConfirmed,
  onClose, topToxicName, amanitaHits,
}: {
  step: number;
  setStep: any;
  checkedRead: boolean;
  setCheckedRead: any;
  confirmed: boolean;
  setConfirmed: any;
  onClose: () => void;
  topToxicName?: string;
  amanitaHits: string[];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 animate-in fade-in duration-300">
      <div className={cn(
        'w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl',
        step === 1 && 'animate-shake'
      )}>
        <div className="relative p-6 bg-gradient-to-br from-danger-500 to-danger-700 text-white">
          {step === 1 && (
            <>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center animate-pulse-slow">
                  <Skull className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs opacity-90">三级弃采告警 · Step 1/3</p>
                  <h2 className="text-2xl font-serif font-bold">剧毒疑似警告</h2>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {topToxicName && (
                  <p className="text-base font-semibold bg-white/20 rounded-xl p-3">
                    🚨 与 <b className="text-yellow-200">{topToxicName}</b> 高度相似
                  </p>
                )}
                {amanitaHits.length > 0 && (
                  <div className="bg-black/20 rounded-xl p-3">
                    <p className="text-xs font-bold mb-1.5 text-yellow-200">⚠️ 已命中鹅膏死亡征：</p>
                    {amanitaHits.map(h => (
                      <p key={h} className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-yellow-200" /> {h}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full mt-4 py-3 rounded-2xl bg-white text-danger-700 font-bold text-base shadow-lg active:scale-95 transition-transform"
              >
                我已知晓危险 <ChevronRight className="inline w-5 h-5" />
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <p className="text-xs opacity-90 mb-2">三级弃采告警 · Step 2/3</p>
              <h2 className="text-xl font-serif font-bold mb-4">仔细阅读不可食说明</h2>
              <div className="bg-black/25 rounded-2xl p-4 space-y-3 text-sm max-h-64 overflow-y-auto">
                <p>1. <b>鹅膏毒肽</b>极耐热，100℃煮100小时、高压锅、油炸均无法破坏。</p>
                <p>2. 误食后6-24小时出现恶心呕吐，假愈期无症状，3-5天后爆发肝衰竭。</p>
                <p>3. 一枚（约50g）白毒伞即可致成年人死亡，致死率高于90%。</p>
                <p>4. 无特效解毒药，只能肝脏移植，费用超50万元且存活率低。</p>
                <p>5. <b>新手识别鹅膏三要点：</b>① 白菌褶 ② 有菌环 ③ 有菌托。三者有二即弃采！</p>
                <p>6. 白毒伞常与鸡枞、草菇、大白菇混生，极易误采。</p>
              </div>
              <label className="mt-4 flex items-start gap-3 p-3 bg-white/15 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedRead}
                  onChange={e => setCheckedRead(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-yellow-400 rounded"
                />
                <span className="text-sm leading-relaxed">
                  我已逐条阅读以上不可食说明，<b>理解采食剧毒鹅膏的致命后果</b>。
                </span>
              </label>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-2xl bg-white/20 font-bold"
                >
                  返回
                </button>
                <button
                  onClick={() => checkedRead && setStep(3)}
                  disabled={!checkedRead}
                  className={cn(
                    'flex-[2] py-3 rounded-2xl font-bold shadow-lg transition-all',
                    checkedRead
                      ? 'bg-white text-danger-700 active:scale-95'
                      : 'bg-white/30 text-white/50 cursor-not-allowed'
                  )}
                >
                  进入最终确认 <ChevronRight className="inline w-5 h-5" />
                </button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-xs opacity-90 mb-2">三级弃采告警 · Step 3/3</p>
              <h2 className="text-xl font-serif font-bold mb-4">二次确认 · 弃采决定</h2>
              <div className="bg-black/25 rounded-2xl p-5 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
                  <Archive className="w-10 h-10" />
                </div>
                <p className="text-base font-semibold mb-2">
                  请最终决定是否弃采此菌：
                </p>
                <p className="text-sm opacity-90">
                  标记弃采后将保存鉴定轨迹，纳入个人踏查档案。
                </p>
              </div>
              <label className="mt-4 flex items-start gap-3 p-3 bg-white/15 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-yellow-400 rounded"
                />
                <span className="text-sm leading-relaxed">
                  我确认已充分了解风险，对本朵菌的处置决定由我<b>本人承担全部责任</b>。
                </span>
              </label>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-2xl bg-white/20 font-bold"
                >
                  返回
                </button>
                <button
                  onClick={onClose}
                  disabled={!confirmed}
                  className={cn(
                    'flex-[2] py-3 rounded-2xl font-bold shadow-lg transition-all',
                    confirmed
                      ? 'bg-yellow-300 text-danger-800 active:scale-95'
                      : 'bg-white/30 text-white/50 cursor-not-allowed'
                  )}
                >
                  已理解，继续研判
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
