import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  MapPin, 
  GitCompare, 
  Star, 
  Award, 
  ArrowLeft, 
  ChevronRight,
  GraduationCap,
  Calendar,
  Building,
  DollarSign,
  Briefcase,
  Phone,
  Mail,
  Globe,
  X
} from 'lucide-react';
import { dbService } from '../../services/dbService';

// Generic fallback campus images
const CAMPUS_FALLBACKS = [
  "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=600&q=80"
];

// Wikimedia/Wikipedia images as priority 2/3 fallbacks
const WIKI_IMAGES = {
  "16006": "https://upload.wikimedia.org/wikipedia/commons/e/e0/COEP_main_building.jpg",
  "03036": "https://upload.wikimedia.org/wikipedia/commons/c/ca/ICT_Mumbai_Main_Building.jpg",
  "03012": "https://upload.wikimedia.org/wikipedia/commons/4/41/VJTI_Mumbai.jpg",
  "06007": "https://upload.wikimedia.org/wikipedia/commons/7/7b/WCE_Sangli_Campus.jpg",
  "03014": "https://upload.wikimedia.org/wikipedia/commons/d/de/SPCE_Mumbai.jpg",
  "06271": "https://upload.wikimedia.org/wikipedia/commons/b/b3/PICT_Main_Building.jpg",
  "03215": "https://upload.wikimedia.org/wikipedia/commons/2/25/Bhavan%27s_Campus_Mumbai.jpg",
  "06273": "https://upload.wikimedia.org/wikipedia/commons/b/b5/VIT_Pune_campus.jpg",
  "03199": "https://upload.wikimedia.org/wikipedia/commons/d/de/DJSCE_Building.jpg",
  "03209": "https://upload.wikimedia.org/wikipedia/commons/0/07/KJ_Somaiya_College_of_Engineering.jpg",
  "06276": "https://upload.wikimedia.org/wikipedia/commons/4/42/Cummins_College_of_Engineering_Pune.jpg",
  "06175": "https://upload.wikimedia.org/wikipedia/commons/b/bc/PCCOE_Akurdi_Campus.jpg",
  "03182": "https://upload.wikimedia.org/wikipedia/commons/b/b9/TSEC_Bandra.jpg",
  "06289": "https://upload.wikimedia.org/wikipedia/commons/0/0e/VIIT_Pune_Campus.jpg",
  "06146": "https://upload.wikimedia.org/wikipedia/commons/f/ff/MITAOE_Alandi.jpg",
  "02008": "https://upload.wikimedia.org/wikipedia/commons/7/77/GECA_Main_Building.jpg",
  "01002": "https://upload.wikimedia.org/wikipedia/commons/d/df/GCOE_Amravati.jpg",
  "06005": "https://upload.wikimedia.org/wikipedia/commons/b/b9/GCE_Karad.jpg",
  "05004": "https://upload.wikimedia.org/wikipedia/commons/a/a2/GCOE_Jalgaon.jpg",
  "04025": "https://upload.wikimedia.org/wikipedia/commons/2/23/GCOE_Nagpur.jpg",
  "02020": "https://upload.wikimedia.org/wikipedia/commons/8/87/SGGS_Nanded.jpg",
  "04004": "https://upload.wikimedia.org/wikipedia/commons/5/5a/GCOE_Chandrapur.jpg",
  "04115": "https://upload.wikimedia.org/wikipedia/commons/7/79/RCOEM_Nagpur.jpg",
  "04167": "https://upload.wikimedia.org/wikipedia/commons/5/5e/YCCE_Nagpur.jpg",
  "03139": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Vidyalankar_Wadala.jpg",
  "05121": "https://upload.wikimedia.org/wikipedia/commons/c/ce/KK_Wagh_Nashik.jpg",
  "06141": "https://upload.wikimedia.org/wikipedia/commons/8/8b/RSCOE_Pune.jpg",
  "06207": "https://upload.wikimedia.org/wikipedia/commons/4/47/DY_Patil_Pimpri.jpg",
  "03197": "https://upload.wikimedia.org/wikipedia/commons/c/c2/FCRIT_Vashi.jpg",
  "06187": "https://upload.wikimedia.org/wikipedia/commons/0/0b/Sinhgad_Kondhwa.jpg"
};

const OFFICIAL_WEBSITE_IMAGES = {
  "16006": "https://www.coep.org.in/page_assets/shared/mainBuilding1.jpg",
  "03036": "https://www.ictmumbai.edu.in/images/Main_Building_Front_View.jpg",
  "03012": "https://vjti.ac.in/wp-content/uploads/2021/07/vjti-main-building.jpg",
  "06007": "http://www.walchandsangli.ac.in/images/walchand_main.jpg",
  "03014": "http://www.spce.ac.in/images/gallery/IMG_20180216_172030.jpg",
  "06271": "https://pict.edu/images/pict-building.jpg",
  "03215": "https://www.spit.ac.in/wp-content/uploads/2010/01/SPIT-Main-Building.jpg",
  "06273": "https://www.vit.edu/images/vit_pune_front.jpg",
  "03199": "https://djsce.ac.in/images/slide1.jpg",
  "03209": "https://kjsit.somaiya.edu/assets/kjsit/images/banner/kjsit-banner-1.jpg",
  "06276": "https://www.cumminscollege.org/wp-content/uploads/2019/02/cummins-campus.jpg",
  "06175": "https://www.pccoepune.com/images/pccoe-building.jpg",
  "03182": "https://tsec.edu/wp-content/uploads/2020/09/tsec-building.jpg",
  "06289": "https://www.viit.ac.in/images/viit_front.jpg",
  "06146": "https://mitaoe.ac.in/assets/images/banner/banner1.jpg",
  "02008": "https://geca.ac.in/images/slider/1.jpg",
  "01002": "http://gcoea.ac.in/images/slider/gcoea_main.jpg",
  "06005": "http://www.gcekarad.ac.in/images/slider/main_building.jpg",
  "05004": "http://gcoej.ac.in/images/slider/gcoej_building.jpg",
  "04025": "http://gcoen.ac.in/images/slider/gcoen_building.jpg",
  "02020": "https://sggs.ac.in/wp-content/uploads/2021/04/sggs-campus-1.jpg",
  "04004": "http://gcoec.ac.in/images/slider/gcoec_building.jpg",
  "04115": "https://www.rknec.edu/images/rknec-building.jpg",
  "04167": "https://www.ycce.edu/images/ycce-building.jpg",
  "03139": "https://vit.edu.in/images/vit-building.jpg",
  "05121": "https://engg.kkwagh.edu.in/images/kkwagh-building.jpg",
  "06141": "https://jspmrscoe.edu.in/images/rscoe-building.jpg",
  "06207": "https://engg.dypvp.edu.in/images/slider/engg_building.jpg",
  "03197": "https://fcrit.ac.in/images/fcrit-building.jpg",
  "06187": "https://www.sinhgad.edu/sinhgad-engineering-campuses/skncoe/skncoe-building.jpg"
};

const RANKED_CODES = [
  "16006", "03036", "03012", "06007", "03014",
  "06271", "03215", "06273", "03199", "03209",
  "06276", "06175", "03182", "06289", "06146",
  "02008", "01002", "06005", "05004", "04025",
  "02020", "04004", "04115", "04167", "03139",
  "05121", "06141", "06207", "03197", "06187"
];

// Image Fallback Component
function ImageWithFallback({ code, alt, className }) {
  const [currentSource, setCurrentSource] = useState('local'); // local, official, wiki, generic
  const [imgSrc, setImgSrc] = useState(`/images/colleges/${code}.jpg`);
  const [status, setStatus] = useState('loading'); // loading, loaded
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const handleError = () => {
    if (currentSource === 'local') {
      const officialUrl = OFFICIAL_WEBSITE_IMAGES[code];
      if (officialUrl) {
        setCurrentSource('official');
        setImgSrc(officialUrl);
      } else {
        const wikiUrl = WIKI_IMAGES[code];
        if (wikiUrl) {
          setCurrentSource('wiki');
          setImgSrc(wikiUrl);
        } else {
          setCurrentSource('generic');
          setImgSrc(CAMPUS_FALLBACKS[0]);
        }
      }
    } else if (currentSource === 'official') {
      const wikiUrl = WIKI_IMAGES[code];
      if (wikiUrl) {
        setCurrentSource('wiki');
        setImgSrc(wikiUrl);
      } else {
        setCurrentSource('generic');
        setImgSrc(CAMPUS_FALLBACKS[0]);
      }
    } else if (currentSource === 'wiki') {
      setCurrentSource('generic');
      setImgSrc(CAMPUS_FALLBACKS[0]);
    } else {
      const nextIdx = (fallbackIndex + 1) % CAMPUS_FALLBACKS.length;
      setFallbackIndex(nextIdx);
      setImgSrc(CAMPUS_FALLBACKS[nextIdx]);
    }
  };

  return (
    <div className="relative w-full h-full bg-brand-bg/40 overflow-hidden">
      {status === 'loading' && (
        <div className="absolute inset-0 bg-brand-border/40 animate-pulse rounded-t-2xl" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={handleError}
        className={`${className} transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-80'}`}
      />
    </div>
  );
}

export default function TopRankings({ onViewCollege, onBack, setCompareColleges, setActiveTab }) {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparisonList, setComparisonList] = useState([]);
  const [quickViewCollege, setQuickViewCollege] = useState(null);

  useEffect(() => {
    const fetchRankedColleges = async () => {
      try {
        setLoading(true);
        const promises = RANKED_CODES.map(code => dbService.getCollegeByCode(code));
        const results = await Promise.all(promises);

        const mapped = RANKED_CODES.map((code, index) => {
          const col = results.find(c => c && c.code === code);
          let parsedDesc = {};
          if (col && col.description) {
            try {
              parsedDesc = JSON.parse(col.description);
            } catch (e) {
              parsedDesc = { about: col.description };
            }
          }

          return {
            rank: index + 1,
            code: code,
            name: col ? col.name : `College Code ${code}`,
            city: col ? col.city : "Maharashtra",
            type: col && col.type ? col.type : "Information currently unavailable.",
            naac: parsedDesc.naac_grade || "Information currently unavailable.",
            established: parsedDesc.established_year || "Information currently unavailable.",
            averagePackage: col ? col.averagePackage : null,
            highestPackage: parsedDesc.highest_package || (col ? col.highestPackage : null),
            placementPercentage: col ? col.placementPercentage : null,
            branches: col && col.courses && col.courses.length > 0 ? col.courses.slice(0, 5).join(', ') : "Information currently unavailable.",
            website: col ? col.website : null,
            university: col && col.university ? col.university : (parsedDesc.university || null),
            rawCollege: col,
            metadata: parsedDesc
          };
        });

        setColleges(mapped);
      } catch (err) {
        console.error("Error loading rankings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankedColleges();
  }, []);

  const handleToggleComparison = (college, e) => {
    e.stopPropagation();
    if (comparisonList.some(c => c.code === college.code)) {
      setComparisonList(comparisonList.filter(c => c.code !== college.code));
    } else {
      if (comparisonList.length >= 4) {
        alert('You can compare a maximum of 4 colleges at once.');
        return;
      }
      setComparisonList([...comparisonList, college]);
    }
  };

  const handleStartComparison = () => {
    if (comparisonList.length < 2) return;
    const formattedCols = comparisonList.map(c => c.rawCollege).filter(Boolean);
    setCompareColleges(formattedCols);
    setActiveTab('compare');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-6 w-24 bg-brand-border/40 animate-pulse rounded-lg"></div>
        <div className="h-10 w-96 bg-brand-border/40 animate-pulse rounded-lg"></div>
        <div className="h-4 w-128 bg-brand-border/30 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="h-96 rounded-2xl border border-brand-border bg-brand-card/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 transition-all duration-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col pb-6 border-b border-brand-border gap-2 text-left">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center space-x-1.5 text-xs font-bold text-brand-muted hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-heading flex items-center space-x-2.5">
          <Crown className="h-8 w-8 text-primary animate-pulse shrink-0" />
          <span>Top Engineering Colleges in Maharashtra</span>
        </h1>
        <p className="text-sm text-brand-body leading-relaxed max-w-3xl">
          Curated list of Maharashtra's best engineering colleges based on academic reputation, placements, autonomy, NAAC/NBA accreditation, alumni network and industry reputation.
        </p>
      </div>

      {/* LEADERBOARD CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {colleges.map((college) => {
          const isSelectedForCompare = comparisonList.some(c => c.code === college.code);
          
          let cardBorder = "border-brand-border/60 hover:border-primary/40";
          let crownIcon = null;

          if (college.rank === 1) {
            cardBorder = "border-amber-300/60 dark:border-amber-700/50 shadow-amber-500/[0.03]";
            crownIcon = <Crown className="h-4.5 w-4.5 text-amber-500" />;
          } else if (college.rank === 2) {
            cardBorder = "border-slate-300/80 dark:border-slate-700/60 shadow-slate-500/[0.03]";
            crownIcon = <Crown className="h-4 w-4 text-slate-400" />;
          } else if (college.rank === 3) {
            cardBorder = "border-amber-700/40 dark:border-amber-600/30 shadow-amber-700/[0.03]";
            crownIcon = <Crown className="h-4 w-4 text-amber-700" />;
          }

          return (
            <div
              key={college.code}
              onClick={() => onViewCollege(college.code)}
              className={`group relative flex flex-col justify-between rounded-2xl border bg-brand-card/75 backdrop-blur-md overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer ${cardBorder}`}
            >
              {/* Image & Rank Banner */}
              <div className="relative h-44 w-full overflow-hidden shrink-0">
                <ImageWithFallback
                  code={college.code}
                  alt={`${college.name} Campus`}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent"></div>
                
                {/* Rank Badge */}
                <div className="absolute top-3.5 left-3.5 flex items-center space-x-1.5 rounded-xl px-3 py-1 text-xs border backdrop-blur-md shadow-sm select-none z-10 font-bold bg-brand-card/85 text-brand-heading border-brand-border">
                  {crownIcon}
                  <span>Rank #{college.rank}</span>
                </div>

                {/* DTE Code Badge */}
                <div className="absolute top-3.5 right-3.5 rounded-xl px-2.5 py-1 text-[10px] font-mono font-bold bg-brand-bg/85 text-brand-body border border-brand-border backdrop-blur-md">
                  Code: {college.code}
                </div>
              </div>

              {/* Card Information Body */}
              <div className="p-5 flex-grow flex flex-col justify-between space-y-4 text-left">
                <div className="space-y-2">
                  <h3 className="font-bold text-brand-heading text-base leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                    {college.name}
                  </h3>

                  {/* Location & Ownership */}
                  <div className="flex flex-wrap gap-2 text-xs items-center text-brand-muted">
                    <span className="flex items-center text-brand-body font-medium">
                      <MapPin className="h-3.5 w-3.5 mr-0.5 text-brand-muted" />
                      {college.city}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-brand-heading truncate max-w-[150px]">{college.type}</span>
                  </div>

                  {/* Accreditations & Year */}
                  <div className="flex flex-wrap gap-2 items-center pt-1">
                    <span className="inline-flex items-center space-x-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Award className="h-3 w-3" />
                      <span>NAAC {college.naac}</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 rounded-lg bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                      <Calendar className="h-3 w-3" />
                      <span>Est. {college.established}</span>
                    </span>
                  </div>
                </div>

                {/* Placements info */}
                <div className="bg-brand-bg/50 border border-brand-border/40 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] text-brand-muted uppercase font-bold">Avg Package</span>
                    <span className="font-bold text-brand-heading">
                      {college.averagePackage ? `${college.averagePackage} LPA` : "Information currently unavailable."}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-brand-muted uppercase font-bold">Highest Package</span>
                    <span className="font-bold text-brand-heading">
                      {college.highestPackage ? `${college.highestPackage} LPA` : "Information currently unavailable."}
                    </span>
                  </div>
                </div>

                {/* Popular branches */}
                <div className="space-y-1 text-left">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted">Popular Branches</span>
                  <p className="text-xs text-brand-body line-clamp-1 truncate font-medium">
                    {college.branches}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 pb-5 pt-2 flex space-x-2 shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setQuickViewCollege(college)}
                  className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl border border-brand-border bg-brand-card hover:bg-brand-bg py-2 text-xs font-semibold text-brand-heading transition-colors cursor-pointer"
                >
                  <span>Quick View</span>
                </button>

                <button
                  onClick={(e) => handleToggleComparison(college, e)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    isSelectedForCompare
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-brand-border bg-brand-card text-brand-muted hover:text-brand-heading'
                  }`}
                  title="Compare College"
                >
                  <GitCompare className="h-4 w-4" />
                  <span>{isSelectedForCompare ? 'Selected' : 'Compare'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* STICKY BOTTOM COMPARE PANEL */}
      {comparisonList.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-4 bg-brand-card/90 border border-primary/30 p-3.5 px-6 rounded-2xl shadow-2xl backdrop-blur-lg animate-slideUp">
          <span className="text-xs font-bold text-brand-heading">
            Selected <span className="text-primary font-black">{comparisonList.length}</span> colleges to compare
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setComparisonList([])}
              className="text-xs font-bold text-brand-muted hover:text-brand-heading px-3 py-1.5 rounded-lg border border-brand-border hover:bg-brand-bg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleStartComparison}
              className="flex items-center space-x-1.5 rounded-xl bg-primary hover:bg-primary-hover px-4 py-2 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
            >
              <GitCompare className="h-4 w-4" />
              <span>Compare Now</span>
            </button>
          </div>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {quickViewCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          {/* Modal Background click to close */}
          <div className="fixed inset-0" onClick={() => setQuickViewCollege(null)} />
          
          <div className="relative w-full max-w-2xl bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col text-left">
            
            {/* Header image and close button */}
            <div className="relative h-48 sm:h-56 w-full shrink-0">
              <ImageWithFallback
                code={quickViewCollege.code}
                alt={`${quickViewCollege.name} Campus`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-black/20 to-black/40" />
              <button 
                onClick={() => setQuickViewCollege(null)}
                className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <span className="inline-flex rounded-lg bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider mb-2">
                  DTE Code: {quickViewCollege.code}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                  {quickViewCollege.name}
                </h2>
              </div>
            </div>

            {/* Modal Body Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              
              {/* Institution Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3 text-center">
                  <Calendar className="h-5 w-5 text-primary mx-auto mb-1.5" />
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">Established</span>
                  <span className="font-bold text-brand-heading text-sm">{quickViewCollege.established}</span>
                </div>
                
                <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3 text-center">
                  <Building className="h-5 w-5 text-accent mx-auto mb-1.5" />
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">Ownership</span>
                  <span className="font-bold text-brand-heading text-xs line-clamp-1 truncate">{quickViewCollege.type}</span>
                </div>

                <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3 text-center">
                  <Award className="h-5 w-5 text-success mx-auto mb-1.5" />
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">NAAC Grade</span>
                  <span className="font-bold text-brand-heading text-sm">{quickViewCollege.naac}</span>
                </div>

                <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3 text-center">
                  <MapPin className="h-5 w-5 text-secondary mx-auto mb-1.5" />
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">City</span>
                  <span className="font-bold text-brand-heading text-sm">{quickViewCollege.city}</span>
                </div>
              </div>

              {/* University Affiliation */}
              <div className="space-y-1.5">
                <span className="block text-[10px] text-brand-muted uppercase font-extrabold tracking-wider">University Affiliation</span>
                <p className="text-sm font-semibold text-brand-heading">
                  {quickViewCollege.university || "Information currently unavailable."}
                </p>
              </div>

              {/* Placement Stats Overview */}
              <div className="space-y-3">
                <span className="block text-[10px] text-brand-muted uppercase font-extrabold tracking-wider">Placement statistics</span>
                <div className="grid grid-cols-3 gap-4 bg-brand-bg/30 border border-brand-border/40 p-4 rounded-2xl">
                  <div className="text-center">
                    <span className="block text-[10px] text-brand-muted font-bold">Average Package</span>
                    <span className="text-base font-extrabold text-brand-heading">
                      {quickViewCollege.averagePackage ? `${quickViewCollege.averagePackage} LPA` : "Information currently unavailable."}
                    </span>
                  </div>
                  <div className="text-center border-x border-brand-border/60">
                    <span className="block text-[10px] text-brand-muted font-bold">Highest Package</span>
                    <span className="text-base font-extrabold text-brand-heading">
                      {quickViewCollege.highestPackage ? `${quickViewCollege.highestPackage} LPA` : "Information currently unavailable."}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] text-brand-muted font-bold">Placement Rate</span>
                    <span className="text-base font-extrabold text-brand-heading">
                      {quickViewCollege.placementPercentage ? `${quickViewCollege.placementPercentage}%` : "Information currently unavailable."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Popular Branches */}
              <div className="space-y-1.5">
                <span className="block text-[10px] text-brand-muted uppercase font-extrabold tracking-wider">Popular Branches</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickViewCollege.branches && quickViewCollege.branches !== "Information currently unavailable." ? (
                    quickViewCollege.branches.split(',').map((b, idx) => (
                      <span key={idx} className="rounded-lg bg-brand-bg border border-brand-border/50 px-2.5 py-1 text-xs text-brand-body font-semibold">
                        {b.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-brand-muted italic">Information currently unavailable.</span>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-brand-border bg-brand-bg/25 flex space-x-3 shrink-0">
              {quickViewCollege.website && (
                <a 
                  href={quickViewCollege.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl border border-brand-border bg-brand-card hover:bg-brand-bg py-2.5 text-xs font-bold text-brand-heading transition-colors"
                >
                  <Globe className="h-4 w-4 text-brand-muted" />
                  <span>Visit Website</span>
                </a>
              )}
              
              <button
                onClick={() => {
                  setQuickViewCollege(null);
                  onViewCollege(quickViewCollege.code);
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl bg-primary hover:bg-primary-hover py-2.5 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
              >
                <span>Search Details</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
