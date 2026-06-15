import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import BottomNav from './components/BottomNav';
import OfflineBadge from './components/OfflineBadge';
import FeatureInput from './pages/FeatureInput';
import MatchingAnalysis from './pages/MatchingAnalysis';
import RiskWarning from './pages/RiskWarning';
import SurveyArchive from './pages/SurveyArchive';
import BeginnerGallery from './pages/BeginnerGallery';
import ArchiveDetail from './pages/ArchiveDetail';
import { initDB } from './db/indexedDb';
import { SPECIES_DATABASE } from './data/speciesDatabase';
import { Sprout } from 'lucide-react';

export default function App() {
  useEffect(() => {
    initDB(SPECIES_DATABASE);
  }, []);

  return (
    <HashRouter>
      <div className="min-h-screen bg-mushroom-100 pb-24">
        <header className="sticky top-0 z-40 bg-gradient-to-b from-mushroom-100 via-mushroom-100/95 to-mushroom-100/80 backdrop-blur-sm border-b border-mushroom-200/50">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 flex items-center justify-center shadow-soft">
                <Sprout className="w-5 h-5 text-mushroom-50" />
              </div>
              <div>
                <h1 className="text-base font-serif font-bold text-forest-900 leading-tight">
                  野菇辨识采集
                </h1>
                <p className="text-[11px] text-mushroom-600 leading-tight">
                  生命安全第一 · 宁可错杀不可放过
                </p>
              </div>
            </div>
            <OfflineBadge />
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-5">
          <Routes>
            <Route path="/" element={<FeatureInput />} />
            <Route path="/match" element={<MatchingAnalysis />} />
            <Route path="/risk" element={<RiskWarning />} />
            <Route path="/archive" element={<SurveyArchive />} />
            <Route path="/archive/:id" element={<ArchiveDetail />} />
            <Route path="/gallery" element={<BeginnerGallery />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </HashRouter>
  );
}
