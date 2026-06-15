import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { getSpeciesById } from '../utils/matchingEngine';
import { Calendar, MapPin, Leaf, AlertTriangle, CheckCircle, Clock, Trash2, ChevronRight, FileText } from 'lucide-react';

const DECISION_META = {
  discarded: { label: '弃采', icon: AlertTriangle, cls: 'bg-danger-100 text-danger-700 border-danger-200' },
  pending: { label: '待定', icon: Clock, cls: 'bg-warn-100 text-warn-700 border-warn-200' },
  edible: { label: '可食', icon: CheckCircle, cls: 'bg-forest-100 text-forest-700 border-forest-200' },
};

export default function SurveyArchive() {
  const { records, removeRecord } = useAppStore();
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '今天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return '昨天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (diff < 7) return `${diff}天前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getTopMatchName = (r: any) => {
    if (r.matching?.topMatchId) {
      const sp = getSpeciesById(r.matching.topMatchId);
      return sp ? sp.chineseName : '未识别';
    }
    if (r.matching?.candidates?.[0]) {
      const sp = getSpeciesById(r.matching.candidates[0].speciesId);
      return sp ? `${sp.chineseName} (${Math.round(r.matching.candidates[0].matchScore)}%)` : '未识别';
    }
    return '未识别';
  };

  const handleDelete = (id: string) => {
    removeRecord(id);
    setConfirmDelete(null);
    setSwipedId(null);
  };

  const renderTimelineDot = (decision: string, index: number) => {
    const isFirst = index === 0;
    const meta = DECISION_META[decision as keyof typeof DECISION_META] || DECISION_META.pending;
    const Icon = meta.icon;
    return (
      <div className="absolute left-0 flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full border-4 border-mushroom-100 ${
          decision === 'discarded' ? 'bg-danger-500' :
          decision === 'edible' ? 'bg-forest-500' : 'bg-warn-500'
        } flex items-center justify-center shadow-soft z-10`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className={`w-0.5 flex-1 ${index < records.length - 1 ? 'bg-mushroom-300' : ''}`} />
      </div>
    );
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 rounded-3xl bg-mushroom-200 flex items-center justify-center mb-5 shadow-soft">
          <FileText className="w-12 h-12 text-mushroom-500" />
        </div>
        <h3 className="text-lg font-serif font-bold text-forest-900 mb-2">暂无踏查档案</h3>
        <p className="text-sm text-mushroom-600 mb-6 max-w-xs">
          完成一次菌菇特征采集与风险研判后，记录将自动保存在此
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 text-mushroom-50 font-medium shadow-soft active:scale-95 transition-transform"
        >
          开始首次采集
        </Link>
      </div>
    );
  }

  const stats = {
    total: records.length,
    discarded: records.filter(r => r.finalDecision === 'discarded').length,
    edible: records.filter(r => r.finalDecision === 'edible').length,
    pending: records.filter(r => r.finalDecision === 'pending').length,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white rounded-2xl p-3 border border-mushroom-200 shadow-soft text-center">
          <div className="text-2xl font-bold text-forest-800">{stats.total}</div>
          <div className="text-[10px] text-mushroom-500 mt-0.5">总记录</div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-danger-200 shadow-soft text-center">
          <div className="text-2xl font-bold text-danger-600">{stats.discarded}</div>
          <div className="text-[10px] text-danger-500 mt-0.5">弃采</div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-forest-200 shadow-soft text-center">
          <div className="text-2xl font-bold text-forest-600">{stats.edible}</div>
          <div className="text-[10px] text-forest-500 mt-0.5">可食</div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-warn-200 shadow-soft text-center">
          <div className="text-2xl font-bold text-warn-600">{stats.pending}</div>
          <div className="text-[10px] text-warn-500 mt-0.5">待定</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-serif font-bold text-forest-800">采集时间线</h2>
          <span className="text-[11px] text-mushroom-500">左滑删除 · 点击查看详情</span>
        </div>

        <div className="relative pl-14 space-y-0">
          {records.map((record, index) => {
            const decision = record.finalDecision || 'pending';
            const meta = DECISION_META[decision as keyof typeof DECISION_META];
            const DecisionIcon = meta.icon;
            const isSwiped = swipedId === record.id;
            const isConfirming = confirmDelete === record.id;

            return (
              <div key={record.id} className="relative pb-5 last:pb-0">
                {renderTimelineDot(decision, index)}

                <div className="relative overflow-hidden rounded-2xl">
                  <div
                    className={`absolute inset-y-0 right-0 w-20 bg-danger-500 flex items-center justify-center transition-opacity z-0 ${
                      isSwiped ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <button
                      onClick={() => setConfirmDelete(record.id)}
                      className="w-full h-full flex flex-col items-center justify-center text-white"
                    >
                      <Trash2 className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-medium">删除</span>
                    </button>
                  </div>

                  {isConfirming && (
                    <div className="absolute inset-0 z-30 bg-danger-900/95 rounded-2xl p-4 flex flex-col justify-center">
                      <p className="text-white text-sm font-medium mb-3 text-center">确定删除此条记录？</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 py-2 rounded-xl bg-white/20 text-white text-sm font-medium"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="flex-1 py-2 rounded-xl bg-white text-danger-700 text-sm font-bold"
                        >
                          确认删除
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    className={`relative z-10 bg-white rounded-2xl border border-mushroom-200 shadow-soft p-4 transition-transform ${
                      isSwiped ? '-translate-x-20' : ''
                    }`}
                    onTouchStart={(e) => {
                      const startX = e.touches[0].clientX;
                      const onTouchMove = (ev: TouchEvent) => {
                        const dx = ev.touches[0].clientX - startX;
                        if (dx < -30) setSwipedId(record.id);
                        if (dx > 30) setSwipedId(null);
                      };
                      const onTouchEnd = () => {
                        document.removeEventListener('touchmove', onTouchMove);
                        document.removeEventListener('touchend', onTouchEnd);
                      };
                      document.addEventListener('touchmove', onTouchMove);
                      document.addEventListener('touchend', onTouchEnd);
                    }}
                  >
                    <Link to={`/archive/${record.id}`} className="block">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-mushroom-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(record.collectedAt)}
                          </span>
                          {record.addedToGallery && (
                            <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 text-[10px] font-medium border border-forest-200">
                              🍄 图鉴
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.cls}`}>
                          <DecisionIcon className="w-3 h-3" />
                          {meta.label}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {record.habitat?.photos?.[0] ? (
                          <img
                            src={record.habitat.photos[0]}
                            alt=""
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-mushroom-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-mushroom-100 flex items-center justify-center flex-shrink-0 border border-mushroom-200">
                            <Leaf className="w-7 h-7 text-mushroom-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-forest-900 mb-1 truncate">
                            {getTopMatchName(record)}
                          </h4>
                          {record.risk?.overallRisk && (
                            <div className="flex items-center gap-1 mb-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                record.risk.overallRisk === 'extreme' || record.risk.overallRisk === 'high'
                                  ? 'bg-danger-100 text-danger-700'
                                  : record.risk.overallRisk === 'medium'
                                  ? 'bg-warn-100 text-warn-700'
                                  : 'bg-forest-100 text-forest-700'
                              }`}>
                                风险：{record.risk.overallRisk === 'extreme' ? '极度' : record.risk.overallRisk === 'high' ? '高' : record.risk.overallRisk === 'medium' ? '中' : '低'}
                              </span>
                              {record.risk?.amanitaMatch && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger-500 text-white font-bold animate-pulse">
                                  ⚠️ 鹅膏疑似
                                </span>
                              )}
                            </div>
                          )}
                          <div className="space-y-0.5">
                            {record.habitat?.gps?.lat !== 0 && (
                              <div className="text-[11px] text-mushroom-500 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                {record.habitat.altitude > 0 ? `海拔${record.habitat.altitude}m · ` : ''}
                                {record.habitat.gps.lat.toFixed(3)}, {record.habitat.gps.lng.toFixed(3)}
                              </div>
                            )}
                            {record.habitat?.trees?.length > 0 && (
                              <div className="text-[11px] text-mushroom-500 truncate">
                                🌲 {record.habitat.trees.slice(0, 3).join('、')}
                              </div>
                            )}
                            {record.decisionNotes && (
                              <div className="text-[11px] text-mushroom-600 italic truncate mt-1">
                                「{record.decisionNotes}」
                              </div>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-mushroom-400 flex-shrink-0 self-center" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-[10px] text-mushroom-500 py-4">
        共 {records.length} 条踏查记录 · 数据保存在本地设备
      </div>
    </div>
  );
}
