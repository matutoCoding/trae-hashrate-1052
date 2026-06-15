import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { getSpeciesById } from '../utils/matchingEngine';
import { ArrowLeft, MapPin, Calendar, Leaf, AlertTriangle, CheckCircle, Clock, Download, Skull, Shield, Eye, Flame, Share2 } from 'lucide-react';

const DECISION_META = {
  discarded: { label: '已弃采', icon: AlertTriangle, cls: 'bg-danger-100 text-danger-700', badge: 'border-danger-300 bg-danger-50 text-danger-800' },
  pending: { label: '待复核', icon: Clock, cls: 'bg-warn-100 text-warn-700', badge: 'border-warn-300 bg-warn-50 text-warn-800' },
  edible: { label: '确认可食', icon: CheckCircle, cls: 'bg-forest-100 text-forest-700', badge: 'border-forest-300 bg-forest-50 text-forest-800' },
};

export default function ArchiveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { records } = useAppStore();
  const record = records.find(r => r.id === id);

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-danger-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-danger-500" />
        </div>
        <h3 className="text-lg font-bold text-forest-900 mb-2">记录不存在</h3>
        <p className="text-sm text-mushroom-600 mb-6">该踏查记录可能已被删除</p>
        <Link
          to="/archive"
          className="px-5 py-2.5 rounded-xl bg-forest-600 text-white text-sm font-medium"
        >
          返回档案列表
        </Link>
      </div>
    );
  }

  const decision = record.finalDecision || 'pending';
  const meta = DECISION_META[decision as keyof typeof DECISION_META];
  const DecisionIcon = meta.icon;

  const topMatch = record.matching?.topMatchId
    ? getSpeciesById(record.matching.topMatchId)
    : record.matching?.candidates?.[0]
    ? getSpeciesById(record.matching.candidates[0].speciesId)
    : null;

  const exportJSON = () => {
    const dataStr = JSON.stringify(record, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mushroom-survey-${record.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-mushroom-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>
        <button
          onClick={exportJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mushroom-200 text-mushroom-700 text-xs font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          导出
        </button>
      </div>

      <div className={`relative overflow-hidden rounded-3xl border-2 ${meta.badge.split(' ').slice(0, 2).join(' ')} shadow-soft`}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 -translate-y-20 translate-x-20 bg-current"></div>
        <div className="p-5 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${meta.badge} border`}>
              <DecisionIcon className="w-3.5 h-3.5" />
              {meta.label}
            </div>
            <div className="text-right">
              <div className="text-[11px] text-mushroom-500 flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(record.collectedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[10px] text-mushroom-400 mt-0.5">ID: {record.id.slice(0, 10)}</div>
            </div>
          </div>

          {topMatch && (
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-mushroom-100 to-mushroom-200 flex items-center justify-center text-5xl shadow-inner">
                {topMatch.imageUrl}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-serif font-bold text-forest-900">{topMatch.chineseName}</h2>
                <p className="text-[11px] italic text-mushroom-500 font-serif mb-1">{topMatch.latinName}</p>
                <p className="text-xs text-mushroom-600">{topMatch.commonName}</p>
                {record.matching?.candidates?.[0]?.matchScore && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-mushroom-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-forest-500 to-forest-600"
                        style={{ width: `${record.matching.candidates[0].matchScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-forest-700">{Math.round(record.matching.candidates[0].matchScore)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {record.addedToGallery && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-100 text-forest-700 text-[11px] font-medium border border-forest-200">
              <Leaf className="w-3.5 h-3.5" />
              已沉淀为入门图鉴
            </div>
          )}
        </div>
      </div>

      {record.habitat?.photos?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-mushroom-200 shadow-soft">
          <h3 className="text-sm font-bold text-forest-900 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-mushroom-500" />
            生境照片 ({record.habitat.photos.length})
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {record.habitat.photos.map((photo, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-mushroom-100 border border-mushroom-200">
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-mushroom-200 shadow-soft">
        <h3 className="text-sm font-bold text-forest-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-mushroom-500" />
          生境信息
        </h3>
        <div className="space-y-2 text-sm">
          {record.habitat?.gps?.lat !== 0 && (
            <div className="flex justify-between py-1.5 border-b border-mushroom-100 last:border-0">
              <span className="text-mushroom-500">GPS 坐标</span>
              <span className="font-medium text-mushroom-800">
                {record.habitat.gps.lat.toFixed(5)}, {record.habitat.gps.lng.toFixed(5)}
              </span>
            </div>
          )}
          {record.habitat?.altitude > 0 && (
            <div className="flex justify-between py-1.5 border-b border-mushroom-100 last:border-0">
              <span className="text-mushroom-500">海拔</span>
              <span className="font-medium text-mushroom-800">{record.habitat.altitude} m</span>
            </div>
          )}
          {record.habitat?.trees?.length > 0 && (
            <div className="flex justify-between py-1.5 border-b border-mushroom-100 last:border-0">
              <span className="text-mushroom-500">伴生树种</span>
              <span className="font-medium text-mushroom-800 text-right max-w-[60%]">{record.habitat.trees.join('、')}</span>
            </div>
          )}
          {record.habitat?.season && (
            <div className="flex justify-between py-1.5 border-b border-mushroom-100 last:border-0">
              <span className="text-mushroom-500">季节</span>
              <span className="font-medium text-mushroom-800">{record.habitat.season}</span>
            </div>
          )}
          {record.habitat?.notes && (
            <div className="pt-2">
              <div className="text-mushroom-500 text-xs mb-1">备注</div>
              <div className="text-sm text-mushroom-800 bg-mushroom-50 rounded-xl p-3 border border-mushroom-100 italic">
                {record.habitat.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-mushroom-200 shadow-soft">
        <h3 className="text-sm font-bold text-forest-900 mb-3 flex items-center gap-2">
          🍄 形态特征
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <FeatureRow label="菌盖形状" value={record.morphology.cap.shape} />
          <FeatureRow label="菌盖颜色" value={record.morphology.cap.color} />
          <FeatureRow label="菌盖直径" value={record.morphology.cap.diameter ? `${record.morphology.cap.diameter}cm` : ''} />
          <FeatureRow label="菌盖鳞片" value={record.morphology.cap.hasScales ? '有' : '无'} />
          <FeatureRow label="菌褶颜色" value={record.morphology.gill.color} />
          <FeatureRow label="菌褶密度" value={record.morphology.gill.density === 'crowded' ? '密集' : record.morphology.gill.density === 'close' ? '稍密' : record.morphology.gill.density === 'distant' ? '稀疏' : ''} />
          <FeatureRow label="菌褶着生" value={record.morphology.gill.attachment} />
          <FeatureRow label="菌柄颜色" value={record.morphology.stem.color} />
          <FeatureRow label="菌柄长度" value={record.morphology.stem.length ? `${record.morphology.stem.length}cm` : ''} />
          <FeatureRow label="菌柄粗度" value={record.morphology.stem.thickness ? `${record.morphology.stem.thickness}cm` : ''} />
          <FeatureRow label="菌环" value={record.morphology.ring.present ? '有' : '无'} />
          <FeatureRow label="菌托" value={record.morphology.stem.hasVolva ? '有' : '无'} />
          <FeatureRow label="孢印颜色" value={record.morphology.sporePrint} />
          <FeatureRow label="发育阶段" value={record.morphology.developmentStage === 'young' ? '幼菇期' : record.morphology.developmentStage === 'mature' ? '成熟期' : record.morphology.developmentStage === 'old' ? '老熟期' : ''} />
        </div>
        {(record.morphology.developmentStage === 'young' || record.morphology.deformed) && (
          <div className="mt-3 p-3 rounded-xl bg-warn-50 border border-warn-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warn-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-warn-700">
              {record.morphology.developmentStage === 'young' && <p>⚠️ 幼菇期：特征未完全展开，属于高误判窗口</p>}
              {record.morphology.deformed && <p>⚠️ 已标注形态异常/老熟变形，特征参考价值降低</p>}
            </div>
          </div>
        )}
      </div>

      {record.risk && (
        <div className={`rounded-2xl p-4 border shadow-soft ${
          record.risk.overallRisk === 'extreme' || record.risk.overallRisk === 'high'
            ? 'bg-danger-50 border-danger-200'
            : record.risk.overallRisk === 'medium'
            ? 'bg-warn-50 border-warn-200'
            : 'bg-forest-50 border-forest-200'
        }`}>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Shield className={`w-4 h-4 ${
              record.risk.overallRisk === 'extreme' || record.risk.overallRisk === 'high' ? 'text-danger-600' :
              record.risk.overallRisk === 'medium' ? 'text-warn-600' : 'text-forest-600'
            }`} />
            风险研判报告
          </h3>

          {record.risk.amanitaMatch && (
            <div className="mb-3 p-3 rounded-xl bg-danger-100 border-2 border-danger-300 animate-blink-red">
              <div className="flex items-center gap-2 mb-1">
                <Skull className="w-5 h-5 text-danger-700" />
                <span className="text-sm font-bold text-danger-800">⚠️ 鹅膏属疑似命中</span>
              </div>
              <div className="text-xs text-danger-700 space-y-0.5">
                {record.risk.amanitaHits.map((h, i) => <div key={i}>• {h}</div>)}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-3">
            <RiskStatCard icon={Skull} label="毒性风险" value={`${Math.round(record.risk.toxicityRisk * 100)}%`} danger={record.risk.toxicityRisk > 0.5} />
            <RiskStatCard icon={Eye} label="误判窗口" value={record.risk.misjudgmentWindow ? '高风险' : '正常'} warn={record.risk.misjudgmentWindow} />
            <RiskStatCard icon={Share2} label="混生概率" value={`${Math.round(record.risk.cooccurrenceProb * 100)}%`} warn={record.risk.cooccurrenceProb > 0.4} />
            <RiskStatCard icon={Flame} label="蒸煮解毒" value={record.risk.detoxPossible ? '可处理' : '无效'} danger={!record.risk.detoxPossible} />
          </div>

          {record.risk.heatStableToxins.length > 0 && (
            <div className="p-3 rounded-xl bg-danger-100 border border-danger-200 text-xs text-danger-700 mb-3">
              <span className="font-bold">🔥 极耐热毒素检出：</span>
              {record.risk.heatStableToxins.join('、')}
              <div className="mt-1 text-[11px]">蒸煮、焯水、高压锅均无法破坏，绝对不可食用！</div>
            </div>
          )}

          <div className="text-[11px] text-mushroom-600 italic bg-white/60 rounded-xl p-3 border border-mushroom-200">
            {record.risk.detoxFailureReason || (record.risk.recommendDiscard ? '⚠️ 系统研判建议：立即弃采，切勿食用！' : '形态特征在安全阈值内，但仍需有经验者复核。')}
          </div>
        </div>
      )}

      {record.matching?.candidates?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-mushroom-200 shadow-soft">
          <h3 className="text-sm font-bold text-forest-900 mb-3">候选种排行 (Top {Math.min(record.matching.candidates.length, 5)})</h3>
          <div className="space-y-2">
            {record.matching.candidates.slice(0, 5).map((cand, i) => {
              const sp = getSpeciesById(cand.speciesId);
              if (!sp) return null;
              return (
                <div key={cand.speciesId} className="flex items-center gap-3 p-2.5 rounded-xl bg-mushroom-50 border border-mushroom-100">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-forest-600 text-white' : 'bg-mushroom-200 text-mushroom-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="text-2xl">{sp.imageUrl}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-mushroom-900 flex items-center gap-1.5">
                      {sp.chineseName}
                      {sp.isAmanita && <span className="text-[9px] px-1.5 py-0.5 rounded bg-danger-100 text-danger-700 font-bold">鹅膏</span>}
                      {sp.safetyLevel >= 4 && !sp.isAmanita && <span className="text-[9px] px-1.5 py-0.5 rounded bg-forest-100 text-forest-700 font-bold">安全</span>}
                    </div>
                    <div className="text-[10px] text-mushroom-500">{sp.commonName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-forest-700">{Math.round(cand.matchScore)}%</div>
                    <div className="w-16 h-1.5 rounded-full bg-mushroom-200 overflow-hidden mt-1">
                      <div className="h-full bg-forest-500 rounded-full" style={{ width: `${cand.matchScore}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {record.decisionNotes && (
        <div className="bg-gradient-to-br from-mushroom-100 to-mushroom-50 rounded-2xl p-4 border border-mushroom-200">
          <h3 className="text-xs font-bold text-mushroom-700 mb-2">📝 鉴定人备注</h3>
          <p className="text-sm text-mushroom-800 italic">「{record.decisionNotes}」</p>
        </div>
      )}
    </div>
  );
}

function FeatureRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-mushroom-50 border border-mushroom-100">
      <span className="text-mushroom-500">{label}</span>
      <span className="font-medium text-mushroom-800">{value}</span>
    </div>
  );
}

function RiskStatCard({ icon: Icon, label, value, danger, warn }: any) {
  return (
    <div className={`p-2.5 rounded-xl border ${
      danger ? 'bg-danger-50 border-danger-200' : warn ? 'bg-warn-50 border-warn-200' : 'bg-white border-mushroom-200'
    }`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${danger ? 'text-danger-600' : warn ? 'text-warn-600' : 'text-mushroom-500'}`} />
        <span className="text-[10px] text-mushroom-500">{label}</span>
      </div>
      <div className={`text-sm font-bold ${danger ? 'text-danger-700' : warn ? 'text-warn-700' : 'text-forest-800'}`}>{value}</div>
    </div>
  );
}
