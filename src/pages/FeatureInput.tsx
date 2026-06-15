import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, emptyMorphology, emptyHabitat } from '../stores/appStore';
import { matchAllSpecies } from '../utils/matchingEngine';
import { analyzeRisk } from '../utils/riskAnalyzer';
import {
  CircleDot, Cylinder, CircleDollarSign, Ring, Flower2, Microscope,
  MapPin, Trees, Mountain, Calendar as CalendarIcon, Camera, FileText,
  ChevronDown, ChevronUp, Search, RotateCcw, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  COLOR_OPTIONS, SHAPE_OPTIONS_CAP, SHAPE_OPTIONS_VOLVA, SHAPE_OPTIONS_RING,
  ATTACHMENT_OPTIONS, DENSITY_OPTIONS, STAGE_OPTIONS,
  TREE_SPECIES_OPTIONS, SEASON_OPTIONS, STEM_TEXTURE_OPTIONS,
} from '../data/speciesDatabase';
import { cn } from '../lib/utils';

type SectionKey = 'cap' | 'gill' | 'stem' | 'ring' | 'volva' | 'spore' | 'habitat';

const sectionConfig: { key: SectionKey; title: string; icon: any; desc: string }[] = [
  { key: 'cap', title: '菌盖特征', icon: CircleDollarSign, desc: '形状、颜色、直径、鳞片' },
  { key: 'gill', title: '菌褶特征', icon: CircleDot, desc: '颜色、密度、附着方式' },
  { key: 'stem', title: '菌柄特征', icon: Cylinder, desc: '颜色、尺寸、质地' },
  { key: 'ring', title: '菌环特征', icon: Ring, desc: '有无、位置、形态' },
  { key: 'volva', title: '菌托特征', icon: Flower2, desc: '有无、形态、颜色' },
  { key: 'spore', title: '孢印颜色', icon: Microscope, desc: '孢子印颜色（关键）' },
  { key: 'habitat', title: '生境元数据', icon: Trees, desc: 'GPS、树种、海拔、照片' },
];

export default function FeatureInput() {
  const navigate = useNavigate();
  const {
    morphology, setMorphology, habitat, setHabitat,
    setCandidates, setRisk, records,
    resetMorphology, resetHabitat, resetAll,
  } = useAppStore();

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    cap: true, gill: false, stem: false, ring: false, volva: false, spore: false, habitat: false,
  });

  const toggle = (k: SectionKey) =>
    setOpenSections(prev => ({ ...prev, [k]: !prev[k] }));

  const completeness = calcCompleteness(morphology, habitat);

  const handleSubmit = () => {
    const cands = matchAllSpecies(morphology, habitat);
    setCandidates(cands);
    const risk = analyzeRisk(morphology, cands, habitat, records);
    setRisk(risk);
    navigate('/match');
  };

  const handleReset = () => {
    if (confirm('确定清空所有录入项？')) {
      resetAll();
    }
  };

  const getGPS = () => {
    if (!navigator.geolocation) return alert('浏览器不支持定位');
    navigator.geolocation.getCurrentPosition(
      pos => setHabitat(h => ({
        ...h,
        gps: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy },
      })),
      () => alert('定位失败，请手动输入或检查权限')
    );
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setHabitat(h => ({
        ...h,
        photos: [...(h.photos || []), reader.result as string].slice(0, 8),
      }));
      reader.readAsDataURL(f);
    });
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-serif font-bold text-forest-900">形态特征录入</h2>
            <p className="text-xs text-mushroom-600 mt-1">
              逐项填写六维形态 + 生境信息，越详细比对越准确
            </p>
          </div>
          <button onClick={handleReset} className="btn-ghost !py-2 !px-3 !text-sm">
            <RotateCcw className="w-4 h-4" /> 重置
          </button>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-mushroom-600 mb-1">
            <span>填写完整度</span>
            <span className="font-bold text-forest-800">{completeness}%</span>
          </div>
          <div className="h-2 bg-mushroom-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forest-500 to-forest-700 transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      {sectionConfig.map(s => (
        <SectionCard
          key={s.key}
          config={s}
          open={openSections[s.key]}
          onToggle={() => toggle(s.key)}
        >
          {s.key === 'cap' && (
            <CapSection />
          )}
          {s.key === 'gill' && <GillSection />}
          {s.key === 'stem' && <StemSection />}
          {s.key === 'ring' && <RingSection />}
          {s.key === 'volva' && <VolvaSection />}
          {s.key === 'spore' && <SporeSection />}
          {s.key === 'habitat' && (
            <HabitatSection habitat={habitat} setHabitat={setHabitat} getGPS={getGPS} handlePhotos={handlePhotos} />
          )}
        </SectionCard>
      ))}

      <div className="sticky bottom-24 z-30 space-y-3">
        <button
          onClick={handleSubmit}
          className={cn(
            'w-full btn-primary text-base',
            completeness < 30 && 'opacity-70'
          )}
        >
          <Search className="w-5 h-5" />
          提交比对研判
        </button>
        {completeness < 50 && (
          <p className="text-xs text-warn-700 text-center bg-warn-50 rounded-xl p-2 border border-warn-200">
            ⚠️ 建议补充菌环/菌托/菌褶颜色等关键特征以提高准确性
          </p>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  config, open, onToggle, children,
}: {
  config: { key: SectionKey; title: string; icon: any; desc: string };
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Icon = config.icon;
  return (
    <div className="card overflow-hidden transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 group-hover:bg-forest-200 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-serif font-semibold text-forest-900">{config.title}</h3>
            <p className="text-xs text-mushroom-500">{config.desc}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-forest-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-mushroom-500" />
        )}
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-500 ease-out',
          open ? 'max-h-[2000px] opacity-100 mt-5' : 'max-h-0 opacity-0'
        )}
      >
        <div className="pt-4 border-t border-mushroom-100 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  value, onChange, label,
}: {
  value: string;
  onChange: (c: string) => void;
  label: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-forest-800 mb-2 block">{label}</label>
      <div className="grid grid-cols-8 gap-2">
        {COLOR_OPTIONS.map(c => (
          <button
            key={c.name}
            onClick={() => onChange(c.name)}
            title={c.name}
            className={cn(
              'aspect-square rounded-xl border-2 transition-all duration-200 relative',
              value === c.name
                ? 'border-forest-700 scale-110 ring-4 ring-forest-200 z-10'
                : 'border-mushroom-200 hover:border-forest-400 hover:scale-105'
            )}
            style={{ backgroundColor: c.hex }}
          >
            {value === c.name && (
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-900 absolute inset-0 m-auto" />
            )}
          </button>
        ))}
      </div>
      {value && (
        <p className="mt-2 text-xs text-forest-700 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full border border-mushroom-300"
            style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === value)?.hex }} />
          已选：<span className="font-semibold">{value}</span>
        </p>
      )}
    </div>
  );
}

function ChipSelect({
  options, value, onChange, label, multi = false,
}: {
  options: (string | { value: string; label: string })[];
  value: any;
  onChange: (v: any) => void;
  label: string;
  multi?: boolean;
}) {
  const optList = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  const toggle = (v: string) => {
    if (!multi) return onChange(v);
    const arr = (value || []) as string[];
    onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };
  const isActive = (v: string) => multi ? (value || []).includes(v) : value === v;
  return (
    <div>
      <label className="text-sm font-medium text-forest-800 mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {optList.map(o => (
          <button
            key={o.value}
            onClick={() => toggle(o.value)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-sm transition-all duration-200 border-2',
              isActive(o.value)
                ? 'bg-forest-700 text-mushroom-50 border-forest-700 shadow-soft'
                : 'bg-mushroom-50 text-forest-700 border-mushroom-200 hover:border-forest-400'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CapSection() {
  const { morphology, setMorphology } = useAppStore();
  return (
    <>
      <ChipSelect
        label="菌盖形状"
        options={SHAPE_OPTIONS_CAP}
        value={morphology.cap.shape}
        onChange={v => setMorphology(m => ({ ...m, cap: { ...m.cap, shape: v } }))}
      />
      <ColorPicker
        label="菌盖颜色"
        value={morphology.cap.color}
        onChange={v => setMorphology(m => ({ ...m, cap: { ...m.cap, color: v } }))}
      />
      <div>
        <label className="text-sm font-medium text-forest-800 mb-2 flex justify-between">
          <span>菌盖直径</span>
          <span className="font-bold text-forest-900">{morphology.cap.diameter || 0} cm</span>
        </label>
        <input
          type="range"
          min={0.5}
          max={30}
          step={0.5}
          value={morphology.cap.diameter || 0}
          onChange={e => setMorphology(m => ({ ...m, cap: { ...m.cap, diameter: Number(e.target.value) } }))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-mushroom-400 mt-1">
          <span>0.5cm</span><span>30cm</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="capScales"
          checked={morphology.cap.hasScales}
          onChange={e => setMorphology(m => ({ ...m, cap: { ...m.cap, hasScales: e.target.checked } }))}
          className="w-5 h-5 accent-forest-700"
        />
        <label htmlFor="capScales" className="text-sm text-forest-800">菌盖有鳞片/疣突</label>
      </div>
      {morphology.cap.hasScales && (
        <ColorPicker
          label="鳞片颜色"
          value={morphology.cap.scaleColor || ''}
          onChange={v => setMorphology(m => ({ ...m, cap: { ...m.cap, scaleColor: v } }))}
        />
      )}
    </>
  );
}

function GillSection() {
  const { morphology, setMorphology } = useAppStore();
  return (
    <>
      <ColorPicker
        label="菌褶/菌孔颜色（关键：白色要高度警惕鹅膏）"
        value={morphology.gill.color}
        onChange={v => setMorphology(m => ({ ...m, gill: { ...m.gill, color: v } }))}
      />
      {morphology.gill.color === '白色' || morphology.gill.color === '乳白色' || morphology.gill.color === '近白色' ? (
        <div className="p-3 bg-danger-50 border-2 border-danger-300 rounded-xl animate-blink-red">
          <p className="text-xs text-danger-800 font-semibold flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-danger-600" />
            <span>
              <b className="text-danger-700">⚠️ 白色菌褶高度危险信号！</b>
              请务必检查<b>有无菌环+菌托</b>。如果白色菌褶+有菌环+有菌托＝鹅膏三连征＝立即弃采！
            </span>
          </p>
        </div>
      ) : null}
      <ChipSelect
        label="菌褶密度"
        options={DENSITY_OPTIONS}
        value={morphology.gill.density}
        onChange={v => setMorphology(m => ({ ...m, gill: { ...m.gill, density: v as any } }))}
      />
      <ChipSelect
        label="菌褶附着方式"
        options={ATTACHMENT_OPTIONS}
        value={morphology.gill.attachment}
        onChange={v => setMorphology(m => ({ ...m, gill: { ...m.gill, attachment: v } }))}
      />
    </>
  );
}

function StemSection() {
  const { morphology, setMorphology } = useAppStore();
  return (
    <>
      <ColorPicker
        label="菌柄颜色"
        value={morphology.stem.color}
        onChange={v => setMorphology(m => ({ ...m, stem: { ...m.stem, color: v } }))}
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-forest-800 mb-2 flex justify-between">
            <span>长度</span>
            <span className="font-bold">{morphology.stem.length || 0} cm</span>
          </label>
          <input
            type="range" min={0.5} max={30} step={0.5}
            value={morphology.stem.length || 0}
            onChange={e => setMorphology(m => ({ ...m, stem: { ...m.stem, length: Number(e.target.value) } }))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-forest-800 mb-2 flex justify-between">
            <span>粗度</span>
            <span className="font-bold">{morphology.stem.thickness || 0} cm</span>
          </label>
          <input
            type="range" min={0.2} max={10} step={0.1}
            value={morphology.stem.thickness || 0}
            onChange={e => setMorphology(m => ({ ...m, stem: { ...m.stem, thickness: Number(e.target.value) } }))}
            className="w-full"
          />
        </div>
      </div>
      <ChipSelect
        label="菌柄质地"
        options={STEM_TEXTURE_OPTIONS}
        value={morphology.stem.texture}
        onChange={v => setMorphology(m => ({ ...m, stem: { ...m.stem, texture: v } }))}
      />
      <div className="flex items-center gap-3 p-3 bg-forest-50 border border-forest-200 rounded-xl">
        <input
          type="checkbox"
          id="hasVolva"
          checked={morphology.stem.hasVolva}
          onChange={e => setMorphology(m => ({ ...m, stem: { ...m.stem, hasVolva: e.target.checked } }))}
          className="w-5 h-5 accent-danger-600"
        />
        <label htmlFor="hasVolva" className="text-sm">
          <b className="text-danger-700">基部有菌托/苞脚</b>（轻轻拨土检查，别拔断！）
        </label>
      </div>
    </>
  );
}

function RingSection() {
  const { morphology, setMorphology } = useAppStore();
  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-forest-50 border border-forest-200 rounded-xl">
        <input
          type="checkbox"
          id="hasRing"
          checked={morphology.ring.present}
          onChange={e => setMorphology(m => ({ ...m, ring: { ...m.ring, present: e.target.checked } }))}
          className="w-5 h-5 accent-danger-600"
        />
        <label htmlFor="hasRing" className="text-sm">
          <b className={morphology.ring.present ? 'text-danger-700' : 'text-forest-700'}>
            有菌环（菌柄上的膜质裙状物）
          </b>
        </label>
      </div>
      {morphology.ring.present && (
        <>
          <ChipSelect
            label="菌环位置"
            options={[{ value: 'upper', label: '上部' }, { value: 'middle', label: '中部' }, { value: 'lower', label: '下部' }]}
            value={morphology.ring.position || ''}
            onChange={v => setMorphology(m => ({ ...m, ring: { ...m.ring, position: v as any } }))}
          />
          <ChipSelect
            label="菌环形态"
            options={SHAPE_OPTIONS_RING}
            value={morphology.ring.shape || ''}
            onChange={v => setMorphology(m => ({ ...m, ring: { ...m.ring, shape: v } }))}
          />
          <ColorPicker
            label="菌环颜色"
            value={morphology.ring.color || ''}
            onChange={v => setMorphology(m => ({ ...m, ring: { ...m.ring, color: v } }))}
          />
        </>
      )}
      {morphology.ring.present && morphology.stem.hasVolva && morphology.gill.color &&
        ['白色', '乳白色', '近白色', '黄白色'].includes(morphology.gill.color) && (
          <div className="p-4 bg-danger-50 border-2 border-danger-500 rounded-xl animate-shake">
            <p className="text-sm text-danger-800 font-bold">
              🚨🚨🚨 剧毒鹅膏三连征命中！白菌褶 + 菌环 + 菌托 = 弃采！
            </p>
          </div>
        )}
    </>
  );
}

function VolvaSection() {
  const { morphology, setMorphology } = useAppStore();
  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-forest-50 border border-forest-200 rounded-xl">
        <input
          type="checkbox"
          id="hasVolva2"
          checked={morphology.stem.hasVolva}
          onChange={e => setMorphology(m => ({ ...m, stem: { ...m.stem, hasVolva: e.target.checked } }))}
          className="w-5 h-5 accent-danger-600"
        />
        <label htmlFor="hasVolva2" className="text-sm">
          <b className={morphology.stem.hasVolva ? 'text-danger-700' : 'text-forest-700'}>有菌托/苞脚</b>
        </label>
      </div>
      {morphology.stem.hasVolva && (
        <>
          <ChipSelect
            label="菌托形态"
            options={SHAPE_OPTIONS_VOLVA}
            value={morphology.stem.volvaShape || ''}
            onChange={v => setMorphology(m => ({ ...m, stem: { ...m.stem, volvaShape: v } }))}
          />
          <ColorPicker
            label="菌托颜色"
            value={morphology.stem.volvaColor || ''}
            onChange={v => setMorphology(m => ({ ...m, stem: { ...m.stem, volvaColor: v } }))}
          />
        </>
      )}
    </>
  );
}

function SporeSection() {
  const { morphology, setMorphology } = useAppStore();
  return (
    <>
      <ColorPicker
        label="孢印颜色（白纸法采集24小时）"
        value={morphology.sporePrint}
        onChange={v => setMorphology(m => ({ ...m, sporePrint: v }))}
      />
      <ChipSelect
        label="发育阶段（影响误判窗口）"
        options={STAGE_OPTIONS}
        value={morphology.developmentStage}
        onChange={v => setMorphology(m => ({ ...m, developmentStage: v as any }))}
      />
      {morphology.developmentStage === 'young' && (
        <div className="p-3 bg-warn-50 border-2 border-warn-400 rounded-xl animate-pulse-slow">
          <p className="text-xs text-warn-800 font-semibold">
            ⚠️ 幼菇期落入高误判窗口！菌环菌托特征未显现，极易与剧毒鹅膏幼体混淆，建议弃采或等成熟再采。
          </p>
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="deformed"
          checked={morphology.deformed}
          onChange={e => setMorphology(m => ({ ...m, deformed: e.target.checked }))}
          className="w-5 h-5 accent-warn-600"
        />
        <label htmlFor="deformed" className="text-sm text-forest-800">样本形态异常/畸形/老熟变形</label>
      </div>
    </>
  );
}

function HabitatSection({
  habitat, setHabitat, getGPS, handlePhotos,
}: {
  habitat: any;
  setHabitat: any;
  getGPS: () => void;
  handlePhotos: any;
}) {
  return (
    <>
      <div>
        <label className="text-sm font-medium text-forest-800 mb-2 block">GPS 坐标</label>
        <div className="flex gap-2 mb-2">
          <button onClick={getGPS} className="btn-ghost !py-2 flex-1">
            <MapPin className="w-4 h-4 text-forest-700" />
            一键定位
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            className="input-base text-sm !py-2"
            placeholder="纬度"
            value={habitat.gps?.lat || ''}
            onChange={e => setHabitat((h: any) => ({
              ...h, gps: { ...(h.gps || {}), lat: Number(e.target.value) || 0 },
            }))}
          />
          <input
            className="input-base text-sm !py-2"
            placeholder="经度"
            value={habitat.gps?.lng || ''}
            onChange={e => setHabitat((h: any) => ({
              ...h, gps: { ...(h.gps || {}), lng: Number(e.target.value) || 0 },
            }))}
          />
          <input
            className="input-base text-sm !py-2"
            placeholder="精度(m)"
            value={habitat.gps?.accuracy || ''}
            onChange={e => setHabitat((h: any) => ({
              ...h, gps: { ...(h.gps || {}), accuracy: Number(e.target.value) || 0 },
            }))}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-forest-800 mb-2 flex items-center gap-2">
          <Mountain className="w-4 h-4" /> 海拔（米）
        </label>
        <input
          type="number"
          className="input-base"
          placeholder="例如：800"
          value={habitat.altitude || ''}
          onChange={e => setHabitat((h: any) => ({ ...h, altitude: Number(e.target.value) || 0 }))}
        />
      </div>

      <ChipSelect
        label="生境树种/基质（可多选）"
        options={TREE_SPECIES_OPTIONS}
        value={habitat.trees || []}
        multi
        onChange={(v: string[]) => setHabitat((h: any) => ({ ...h, trees: v }))}
      />

      <ChipSelect
        label="采集季节"
        options={SEASON_OPTIONS}
        value={habitat.season || ''}
        onChange={(v: string) => setHabitat((h: any) => ({ ...h, season: v }))}
      />

      <div>
        <label className="text-sm font-medium text-forest-800 mb-2 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" /> 采集时间
        </label>
        <input
          type="datetime-local"
          className="input-base"
          value={(habitat.collectedAt || '').slice(0, 16)}
          onChange={e => setHabitat((h: any) => ({ ...h, collectedAt: new Date(e.target.value).toISOString() }))}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-forest-800 mb-2 flex items-center gap-2">
          <Camera className="w-4 h-4" /> 生境照片（最多8张）
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(habitat.photos || []).map((p: string, i: number) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden border-2 border-mushroom-200 relative">
              <img src={p} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setHabitat((h: any) => ({ ...h, photos: (h.photos || []).filter((_: any, idx: number) => idx !== i) }))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-danger-600 text-white text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          {(habitat.photos || []).length < 8 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-mushroom-300 flex flex-col items-center justify-center text-mushroom-500 hover:border-forest-500 hover:text-forest-600 cursor-pointer transition-colors">
              <Camera className="w-6 h-6" />
              <span className="text-[10px] mt-1">拍照/相册</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-forest-800 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" /> 备注
        </label>
        <textarea
          rows={3}
          className="input-base resize-none"
          placeholder="气味、口味、虫蛀情况、生长密度等补充信息"
          value={habitat.notes || ''}
          onChange={e => setHabitat((h: any) => ({ ...h, notes: e.target.value }))}
        />
      </div>
    </>
  );
}

function calcCompleteness(m: any, h: any) {
  const items = [
    m.cap.shape, m.cap.color, m.cap.diameter,
    m.gill.color, m.gill.density, m.gill.attachment,
    m.stem.color, m.stem.length, m.stem.thickness, m.stem.texture,
    m.ring.present !== undefined,
    m.stem.hasVolva !== undefined,
    m.sporePrint,
    m.developmentStage,
    h.trees?.length, h.season, h.altitude,
    h.gps?.lat,
  ];
  const filled = items.filter(i => (typeof i === 'string' && i.length > 0) || (typeof i === 'number' && i > 0) || i === true || (typeof i === 'object' && Array.isArray(i) && i.length > 0)).length;
  return Math.round(filled / items.length * 100);
}
