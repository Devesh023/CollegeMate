import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { getMatchingCategoryKeys, matchesAdmissionType, resolveTargetYear } from '../../services/predictor';
import { 
  ArrowLeft, 
  MapPin, 
  Globe, 
  Building, 
  Bookmark, 
  BookmarkCheck, 
  DollarSign, 
  Briefcase, 
  Award, 
  Layers,
  ChevronDown,
  ChevronUp,
  Percent,
  SlidersHorizontal,
  Info,
  Activity,
  FileText,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  Compass,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

// Generic fallback campus images
const CAMPUS_FALLBACKS = [
  "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5c?auto=format&fit=crop&w=800&q=80"
];

// Wikimedia/Wikipedia images
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
    <div className="relative w-full h-full bg-brand-bg/40 overflow-hidden rounded-2xl">
      {status === 'loading' && (
        <div className="absolute inset-0 bg-brand-border/40 animate-pulse" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={handleError}
        className={`${className} transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-85'}`}
      />
    </div>
  );
}

const isMeaningfulText = (text) => {
  if (!text) return false;
  const clean = String(text).trim().toLowerCase();
  const placeholders = [
    'default', 'unknown', 'n/a', 'na', 'lorem ipsum', 
    'information currently unavailable', 'null', 'default university',
    'information currently unavailable.', 'none', 'information currently unavailable'
  ];
  return !placeholders.includes(clean) && clean.length > 10;
};

export default function CollegeDetails({ collegeCode, onBack }) {
  const { user, toggleSavedCollege } = useAuth();
  const [college, setCollege] = useState(null);
  const [allCutoffs, setAllCutoffs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedAdmissionType, setSelectedAdmissionType] = useState('FIRST_YEAR_ENGINEERING');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedRound, setSelectedRound] = useState('CAP1');
  const [selectedCategory, setSelectedCategory] = useState('OPEN');
  const [branchFilter, setBranchFilter] = useState('');
  const [expandedBranch, setExpandedBranch] = useState(null);

  const savedCollegeIds = user?.profile?.savedColleges || [];
  const isBookmarked = college && savedCollegeIds.map(Number).includes(Number(college.id));

  // Load college details & all cutoffs
  useEffect(() => {
    const fetchCollegeData = async () => {
      if (!collegeCode) return;
      try {
        setLoading(true);
        const col = await dbService.getCollegeByCode(collegeCode);
        if (col) {
          setCollege(col);
          const cuts = await dbService.getCutoffsForCollege(collegeCode, null, null);
          setAllCutoffs(cuts);
          
          if (cuts.length > 0) {
            const hasCet = cuts.some(c => matchesAdmissionType(c.admissionType, 'CET'));
            if (!hasCet) {
              setSelectedAdmissionType('DIRECT_SECOND_YEAR_ENGINEERING');
              setSelectedYear(String(resolveTargetYear('DSE', cuts)));
              setSelectedRound(cuts.find(c => c.round)?.round || 'CAP1');
            } else {
              setSelectedYear(String(resolveTargetYear('CET', cuts)));
              setSelectedRound(cuts.find(c => matchesAdmissionType(c.admissionType, 'CET'))?.round || 'CAP1');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching college details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollegeData();
  }, [collegeCode]);

  // Decode JSON metadata from description column
  const collegeData = useMemo(() => {
    if (!college) return null;
    let metadata = {};
    try {
      metadata = JSON.parse(college.description);
    } catch (e) {
      metadata = { about: college.description };
    }

    return {
      about: metadata.about || college.description || null,
      why_choose: metadata.why_choose || null,
      facilities: metadata.facilities || (college.facilities && college.facilities.length > 0 ? college.facilities : null),
      averagePackage: college.averagePackage || metadata.average_package || null,
      highestPackage: metadata.highest_package || college.highestPackage || null,
      placementPercentage: college.placementPercentage || metadata.placement_percentage || null,
      recruiters: metadata.recruiters || null,
      fees: metadata.fees || (college.fees ? `₹${college.fees.toLocaleString('en-IN')} / Year` : null),
      hostel_info: metadata.hostel_info || (college.hostel_available ? "On-campus hostel accommodations are available." : null),
      scholarships: metadata.scholarships || null,
      contact: metadata.contact_details || {},
      naac: metadata.naac_grade || null,
      established: metadata.established_year || null,
      ownership: metadata.ownership || college.type || null,
      university: metadata.university || college.university || null
    };
  }, [college]);

  const handleSaveToggle = async () => {
    if (!user) {
      alert('Please Sign In to save favorite colleges!');
      return;
    }
    await toggleSavedCollege(college.id);
  };

  // Unique list of options from cutoffs data
  const admissionTypes = useMemo(() => {
    return Array.from(new Set(allCutoffs.map(c => c.admissionType))).filter(Boolean);
  }, [allCutoffs]);

  const years = useMemo(() => {
    return Array.from(new Set(
      allCutoffs
        .filter(c => c.admissionType === selectedAdmissionType)
        .map(c => c.year.toString())
    )).sort((a, b) => b - a);
  }, [allCutoffs, selectedAdmissionType]);

  const rounds = useMemo(() => {
    return Array.from(new Set(
      allCutoffs
        .filter(c => c.admissionType === selectedAdmissionType && c.year.toString() === selectedYear)
        .map(c => c.round)
    )).filter(Boolean).sort();
  }, [allCutoffs, selectedAdmissionType, selectedYear]);

  const branchOptions = useMemo(() => {
    return Array.from(new Set(
      allCutoffs
        .filter(c => c.admissionType === selectedAdmissionType)
        .map(c => c.branch)
    )).filter(Boolean).sort();
  }, [allCutoffs, selectedAdmissionType]);

  const standardCategories = ['OPEN', 'OBC', 'SC', 'ST', 'VJ', 'NT-A', 'NT-B', 'NT-C', 'NT-D', 'SBC', 'SEBC', 'EWS', 'TFWS', 'PWD', 'DEFENCE', 'ORPHAN'];

  const getCategoryScore = (cutoffRow, stdCategory, gender = 'Male') => {
    const uiType = selectedAdmissionType === 'DIRECT_SECOND_YEAR_ENGINEERING' ? 'DSE' : 'CET';
    const keys = getMatchingCategoryKeys(stdCategory, gender, uiType);
    for (const key of keys) {
      if (cutoffRow[key] !== undefined && cutoffRow[key] !== null) {
        return { score: parseFloat(cutoffRow[key]), matchedKey: key };
      }
    }
    return { score: null, matchedKey: null };
  };

  const displayedCutoffs = useMemo(() => {
    return allCutoffs.filter(c => 
      c.admissionType === selectedAdmissionType &&
      c.year.toString() === selectedYear &&
      c.round === selectedRound &&
      (!branchFilter || c.branch.toLowerCase().includes(branchFilter.toLowerCase()))
    );
  }, [allCutoffs, selectedAdmissionType, selectedYear, selectedRound, branchFilter]);

  const cutoffStats = useMemo(() => {
    const percentiles = displayedCutoffs
      .map(c => getCategoryScore(c, selectedCategory).score)
      .filter(s => s !== null && !isNaN(s));

    if (percentiles.length === 0) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...percentiles);
    const max = Math.max(...percentiles);
    const avg = parseFloat((percentiles.reduce((a, b) => a + b, 0) / percentiles.length).toFixed(2));
    return { min, max, avg };
  }, [displayedCutoffs, selectedCategory]);

  const branchChartData = useMemo(() => {
    return displayedCutoffs.map(c => {
      const { score } = getCategoryScore(c, selectedCategory);
      return {
        name: c.branch.split(' - ')[0].replace('Engineering', 'Engg').slice(0, 15),
        'Cutoff': score || 0
      };
    }).filter(d => d.Cutoff > 0).slice(0, 8);
  }, [displayedCutoffs, selectedCategory]);

  const isAboutMeaningful = useMemo(() => {
    if (!collegeData || !collegeData.about) return false;
    let textToCheck = collegeData.about;
    if (typeof textToCheck === 'object') {
      textToCheck = textToCheck.about || textToCheck.overview || '';
    }
    return isMeaningfulText(textToCheck);
  }, [collegeData]);

  const isHighlightsMeaningful = useMemo(() => {
    return collegeData ? isMeaningfulText(collegeData.why_choose) : false;
  }, [collegeData]);

  const placementItems = useMemo(() => {
    if (!collegeData) return [];
    const items = [];
    if (collegeData.averagePackage) {
      items.push({ label: 'Average Package', value: `${collegeData.averagePackage} LPA` });
    }
    if (collegeData.highestPackage) {
      items.push({ label: 'Highest Package', value: `${collegeData.highestPackage} LPA` });
    }
    if (collegeData.placementPercentage) {
      items.push({ label: 'Placement Rate', value: `${collegeData.placementPercentage}%` });
    }
    return items;
  }, [collegeData]);

  const hasPlacementData = placementItems.length > 0;
  const hasRecruitersData = !!(collegeData?.recruiters && collegeData.recruiters.length > 0);

  const infoCards = useMemo(() => {
    if (!collegeData) return [];
    const cards = [];
    
    if (collegeData.fees) {
      cards.push(
        <div key="fees" className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm space-y-3">
          <h3 className="font-bold text-brand-heading text-base flex items-center space-x-2 border-b border-brand-border pb-2">
            <DollarSign className="h-4.5 w-4.5 text-primary" />
            <span>Fee Structure</span>
          </h3>
          <div className="p-3 bg-brand-bg/50 rounded-xl border border-brand-border/40 text-center">
            <span className="block text-[10px] text-brand-muted uppercase font-bold">Annual Tuition Fee</span>
            <span className="text-lg font-extrabold text-brand-heading mt-0.5 block">{collegeData.fees}</span>
          </div>
        </div>
      );
    }
    
    const hostelMeaningful = isMeaningfulText(collegeData.hostel_info);
    if (hostelMeaningful) {
      cards.push(
        <div key="hostel" className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm space-y-3">
          <h3 className="font-bold text-brand-heading text-base flex items-center space-x-2 border-b border-brand-border pb-2">
            <Building className="h-4.5 w-4.5 text-accent" />
            <span>Hostel Information</span>
          </h3>
          <p className="text-xs text-brand-body leading-relaxed">
            {collegeData.hostel_info}
          </p>
        </div>
      );
    }
    
    const scholarshipsMeaningful = isMeaningfulText(collegeData.scholarships);
    if (scholarshipsMeaningful) {
      cards.push(
        <div key="scholarships" className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm space-y-3">
          <h3 className="font-bold text-brand-heading text-base flex items-center space-x-2 border-b border-brand-border pb-2">
            <BookOpen className="h-4.5 w-4.5 text-success" />
            <span>Scholarships</span>
          </h3>
          <p className="text-xs text-brand-body leading-relaxed">
            {collegeData.scholarships}
          </p>
        </div>
      );
    }
    
    return cards;
  }, [collegeData]);

  const contactItems = useMemo(() => {
    if (!collegeData || !collegeData.contact) return [];
    const items = [];
    if (isMeaningfulText(collegeData.contact.address)) {
      items.push(
        <div key="address" className="flex items-start space-x-2.5">
          <MapPin className="h-4 w-4 text-brand-muted shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-brand-heading block">Address</span>
            <span className="text-brand-body leading-relaxed mt-0.5 block">{collegeData.contact.address}</span>
          </div>
        </div>
      );
    }
    if (isMeaningfulText(collegeData.contact.email)) {
      items.push(
        <div key="email" className="flex items-start space-x-2.5">
          <Mail className="h-4 w-4 text-brand-muted shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-brand-heading block">Email Inquiry</span>
            <span className="text-brand-body mt-0.5 block">{collegeData.contact.email}</span>
          </div>
        </div>
      );
    }
    if (isMeaningfulText(collegeData.contact.phone)) {
      items.push(
        <div key="phone" className="flex items-start space-x-2.5">
          <Phone className="h-4 w-4 text-brand-muted shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-brand-heading block">Phone Helpline</span>
            <span className="text-brand-body mt-0.5 block">{collegeData.contact.phone}</span>
          </div>
        </div>
      );
    }
    return items;
  }, [collegeData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-6 w-20 bg-brand-border/40 animate-pulse rounded-lg"></div>
        <div className="h-44 bg-brand-card/50 border border-brand-border/30 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-24 bg-brand-card/50 border border-brand-border/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!college || !collegeData) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <Info className="h-12 w-12 text-brand-muted mx-auto mb-4" />
        <h3 className="text-xl font-bold text-brand-heading">College Not Found</h3>
        <p className="text-sm text-brand-body mt-2">The requested institution code is invalid or missing in our records.</p>
        <button onClick={onBack} className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          <ArrowLeft className="h-4 w-4" />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 text-left">
      
      {/* 1. BACK BUTTON */}
      <button 
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-muted hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Directory</span>
      </button>

      {/* 2. HERO GLASS BANNER */}
      <div className="relative rounded-3xl border border-brand-border/60 bg-brand-card/50 backdrop-blur-md p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between gap-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-secondary/10 blur-3xl"></div>

        <div className="space-y-4 max-w-3xl z-10">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-bold text-primary">
              DTE Code: {college.code}
            </span>
            {college.badges && college.badges.map((badge, bIdx) => (
              <span key={bIdx} className="inline-flex items-center rounded-full bg-accent/15 border border-accent/30 px-3 py-1 text-xs font-bold text-accent">
                {badge}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-heading leading-tight">
            {college.name}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-brand-body">
            <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5 text-primary" /> {college.city}</span>
            {collegeData.university && (
              <span className="flex items-center"><Building className="h-4 w-4 mr-1.5 text-accent" /> {collegeData.university}</span>
            )}
            {collegeData.ownership && (
              <span className="flex items-center"><Layers className="h-4 w-4 mr-1.5 text-success" /> {collegeData.ownership}</span>
            )}
          </div>

          {collegeData.established ? (
            <p className="text-sm text-brand-body leading-relaxed max-w-2xl">
              Established in {collegeData.established}, {college.name} represents a leading center of academic excellence and research in Maharashtra.
            </p>
          ) : (
            <p className="text-sm text-brand-body leading-relaxed max-w-2xl">
              {college.name} represents a leading center of academic excellence and research in Maharashtra.
            </p>
          )}
          
          {college.website && (
            <div className="flex items-center space-x-4">
              <a 
                href={college.website} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-primary hover:underline"
              >
                <Globe className="h-4 w-4" />
                <span>Visit Official Website</span>
              </a>
            </div>
          )}
        </div>

        {/* Bookmark and NAAC details */}
        <div className="flex flex-row md:flex-col items-center justify-between md:justify-start shrink-0 z-10 gap-4">
          <button
            onClick={handleSaveToggle}
            className={`flex items-center space-x-2 rounded-2xl border px-4 py-2.5 text-sm font-bold shadow-sm transition-all cursor-pointer ${
              isBookmarked 
                ? 'border-accent bg-accent/15 text-accent ring-1 ring-accent/30' 
                : 'border-brand-border bg-brand-card/85 text-brand-body hover:bg-brand-bg hover:text-brand-heading'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark College'}</span>
          </button>

          {collegeData.naac && (
            <div className="text-right md:mt-4">
              <span className="block text-[10px] text-brand-muted uppercase font-bold tracking-wider">NAAC Accreditation</span>
              <span className="text-xl font-extrabold text-brand-heading flex items-center gap-1 mt-0.5 justify-end">
                <Award className="h-5 w-5 text-primary" />
                {collegeData.naac}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. ABOUT & HIGHLIGHTS */}
      {(isAboutMeaningful || isHighlightsMeaningful) && (
        <div className={`grid grid-cols-1 ${isAboutMeaningful && isHighlightsMeaningful ? 'lg:grid-cols-2' : ''} gap-6`}>
          {isAboutMeaningful && (
            <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-brand-heading text-base flex items-center space-x-2 border-b border-brand-border pb-2">
                <Info className="h-4.5 w-4.5 text-primary" />
                <span>About College</span>
              </h3>
              <p className="text-xs sm:text-sm text-brand-body leading-relaxed">
                {typeof collegeData.about === 'object' ? (collegeData.about.about || collegeData.about.overview) : collegeData.about}
              </p>
            </div>
          )}

          {isHighlightsMeaningful && (
            <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-brand-heading text-base flex items-center space-x-2 border-b border-brand-border pb-2">
                <ShieldCheck className="h-4.5 w-4.5 text-accent" />
                <span>Highlights</span>
              </h3>
              <p className="text-xs sm:text-sm text-brand-body leading-relaxed">
                {collegeData.why_choose}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. FACILITIES */}
      {collegeData.facilities && collegeData.facilities.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-brand-heading text-lg flex items-center space-x-2">
            <Layers className="h-5 w-5 text-primary" />
            <span>Facilities</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {collegeData.facilities.map((fac, idx) => (
              <div key={idx} className="rounded-xl border border-brand-border bg-brand-card p-4 text-center flex items-center justify-center space-x-2">
                <span className="text-base">📌</span>
                <span className="text-xs font-semibold text-brand-body">{fac}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PLACEMENT STATISTICS & TOP RECRUITERS */}
      {(hasPlacementData || hasRecruitersData) && (
        <div className={`grid grid-cols-1 ${hasPlacementData && hasRecruitersData ? 'lg:grid-cols-2' : ''} gap-6`}>
          {hasPlacementData && (
            <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-brand-heading text-base flex items-center space-x-2 border-b border-brand-border pb-2">
                <Briefcase className="h-4.5 w-4.5 text-primary" />
                <span>Placement Statistics</span>
              </h3>
              <div className="space-y-4">
                <div className={`grid grid-cols-${placementItems.length} gap-4 text-center`}>
                  {placementItems.map((item, idx) => (
                    <div key={idx} className="rounded-xl bg-brand-bg/60 p-3">
                      <span className="block text-[10px] text-brand-muted font-bold uppercase">{item.label}</span>
                      <span className="text-base font-extrabold text-brand-heading">{item.value}</span>
                    </div>
                  ))}
                </div>

                {branchChartData.length > 0 && (
                  <div className="h-40 text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-border)" />
                        <XAxis dataKey="name" stroke="var(--brand-muted)" />
                        <YAxis domain={[50, 100]} stroke="var(--brand-muted)" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }} />
                        <Bar dataKey="Cutoff" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasRecruitersData && (
            <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-brand-heading text-base flex items-center space-x-2 border-b border-brand-border pb-2">
                <TrendingUp className="h-4.5 w-4.5 text-accent" />
                <span>Top Recruiters</span>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {collegeData.recruiters.map((rec, idx) => (
                  <div key={idx} className="rounded-xl bg-brand-bg/60 p-3 text-center border border-brand-border/40">
                    <span className="text-xs font-bold text-brand-heading">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. FEES, HOSTEL & SCHOLARSHIPS */}
      {infoCards.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-${infoCards.length} gap-6`}>
          {infoCards}
        </div>
      )}

      {/* 8. CONTACT INFORMATION */}
      {contactItems.length > 0 && (
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-brand-heading text-base flex items-center space-x-2 border-b border-brand-border pb-2">
            <Mail className="h-4.5 w-4.5 text-primary" />
            <span>Contact Information</span>
          </h3>
          <div className={`grid grid-cols-1 md:grid-cols-${contactItems.length} gap-4 text-xs`}>
            {contactItems}
          </div>
        </div>
      )}

      {/* 9. BRANCH-WISE CUTOFF MATRIX */}
      <div className="space-y-4">
        <h3 className="font-bold text-brand-heading text-lg flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>Branch-wise Cutoff Matrix</span>
        </h3>

        {allCutoffs.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-brand-card p-12 text-center shadow-sm">
            <Info className="h-10 w-10 text-brand-muted mx-auto mb-2" />
            <p className="text-sm font-semibold text-brand-heading">Official cutoff data is currently unavailable for this college.</p>
            <p className="text-xs text-brand-muted mt-1">This institution may have direct admissions or records are currently pending updates.</p>
          </div>
        ) : (
          <>
            {/* STICKY FILTER PANEL */}
            <div className="sticky top-16 z-20 rounded-2xl border border-brand-border bg-brand-card/90 backdrop-blur-md p-4 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 border-b border-brand-border pb-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-brand-heading uppercase tracking-wider">Simultaneous Cutoff Filters</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {/* Admission Type */}
                <div>
                  <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Admission Type</label>
                  <select
                    value={selectedAdmissionType}
                    onChange={(e) => {
                      setSelectedAdmissionType(e.target.value);
                      const uiType = e.target.value === 'FIRST_YEAR_ENGINEERING' ? 'CET' : 'DSE';
                      setSelectedYear(String(resolveTargetYear(uiType, allCutoffs)));
                      setSelectedRound(allCutoffs.find(c => c.admissionType === e.target.value)?.round || 'CAP1');
                    }}
                    className="block w-full rounded-lg border border-brand-border bg-brand-bg px-2.5 py-2 text-brand-heading focus:border-primary focus:outline-none"
                  >
                    <option value="FIRST_YEAR_ENGINEERING">First Year (CET)</option>
                    <option value="DIRECT_SECOND_YEAR_ENGINEERING">Direct 2nd Yr (DSE)</option>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      const firstRound = allCutoffs.find(c =>
                        c.admissionType === selectedAdmissionType && c.year.toString() === e.target.value
                      )?.round;
                      setSelectedRound(firstRound || 'CAP1');
                    }}
                    className="block w-full rounded-lg border border-brand-border bg-brand-bg px-2.5 py-2 text-brand-heading focus:border-primary focus:outline-none"
                  >
                    {years.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                    {years.length === 0 && <option value={selectedYear}>{selectedYear}</option>}
                  </select>
                </div>

                {/* Round */}
                <div>
                  <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">CAP Round</label>
                  <select
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(e.target.value)}
                    className="block w-full rounded-lg border border-brand-border bg-brand-bg px-2.5 py-2 text-brand-heading focus:border-primary focus:outline-none"
                  >
                    {rounds.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    {rounds.length === 0 && (
                      <option value="CAP1">CAP1</option>
                    )}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Highlight Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full rounded-lg border border-brand-border bg-brand-bg px-2.5 py-2 text-brand-heading focus:border-primary focus:outline-none"
                  >
                    {standardCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Branch */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Branch</label>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="block w-full rounded-lg border border-brand-border bg-brand-bg px-2.5 py-2 text-brand-heading focus:border-primary focus:outline-none text-xs"
                  >
                    <option value="">All Branches ({branchOptions.length})</option>
                    {branchOptions.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stats Bar */}
              {displayedCutoffs.length > 0 && (
                <div className="flex flex-wrap gap-4 text-xs font-semibold bg-brand-bg/50 border border-brand-border p-2.5 rounded-xl justify-between items-center mt-2">
                  <span className="text-brand-muted">Showing {displayedCutoffs.length} branch cutoffs</span>
                  <div className="flex items-center space-x-4">
                    <span>Highest Cutoff: <span className="text-primary font-bold">{cutoffStats.max}%</span></span>
                    <span>Lowest: <span className="text-accent font-bold">{cutoffStats.min}%</span></span>
                    <span>Average: <span className="text-success font-bold">{cutoffStats.avg}%</span></span>
                  </div>
                </div>
              )}
            </div>

            {/* List of Cutoff Rows */}
            {displayedCutoffs.length === 0 ? (
              <SectionPlaceholder title="Filter Cutoffs" message="No cutoff rows match active filters." />
            ) : (
              <div className="space-y-3">
                {displayedCutoffs.map((item, idx) => {
                  const isExpanded = expandedBranch === idx;
                  const catScores = standardCategories.map(cat => {
                    const { score, matchedKey } = getCategoryScore(item, cat);
                    return score !== null ? { category: cat, score, matchedKey } : null;
                  }).filter(Boolean);

                  const highlightedScore = catScores.find(cs => cs.category === selectedCategory)?.score || null;

                  return (
                    <div 
                      key={idx}
                      className="rounded-2xl border border-brand-border bg-brand-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div 
                        onClick={() => setExpandedBranch(isExpanded ? null : idx)}
                        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-brand-bg/25 transition-colors gap-4"
                      >
                        <div className="space-y-1 truncate">
                          <div className="flex items-center space-x-2 truncate">
                            <span className="rounded-lg bg-brand-bg border border-brand-border px-2 py-0.5 text-[10px] font-bold text-brand-muted">
                              {item.choiceCode}
                            </span>
                            <h4 className="font-bold text-brand-heading text-sm sm:text-base truncate">
                              {item.branch}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-brand-body">
                            <span>Gender: <span className="font-semibold">{item.gender}</span></span>
                            <span>Round: <span className="font-semibold">{item.round}</span></span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 shrink-0">
                          {highlightedScore !== null && (
                            <div className="hidden sm:flex flex-col text-right">
                              <span className="text-[10px] text-brand-muted uppercase font-bold">{selectedCategory} Cutoff</span>
                              <span className="text-sm font-bold text-primary">{highlightedScore}%</span>
                            </div>
                          )}
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-brand-muted" /> : <ChevronDown className="h-5 w-5 text-brand-muted" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-brand-border bg-brand-bg/30 p-4">
                          <h5 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Category-wise Cutoff Percentiles</h5>
                          
                          {catScores.length === 0 ? (
                            <p className="text-xs text-brand-muted italic">No category cutoffs recorded for this branch.</p>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-brand-border bg-brand-card shadow-sm custom-scrollbar">
                              <table className="min-w-full divide-y divide-brand-border text-xs sm:text-sm">
                                <thead className="bg-brand-bg/50">
                                  <tr>
                                    {catScores.map((cs, cIdx) => (
                                      <th 
                                        key={cIdx} 
                                        className={`px-4 py-2 text-left font-bold text-brand-heading uppercase tracking-wider border-r border-brand-border last:border-0 ${
                                          cs.category === selectedCategory ? 'bg-primary/10 text-primary' : ''
                                        }`}
                                      >
                                        {cs.category}
                                        {cs.matchedKey && cs.matchedKey !== cs.category && (
                                          <span className="block text-[9px] font-normal text-brand-muted normal-case">{cs.matchedKey}</span>
                                        )}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border">
                                  <tr>
                                    {catScores.map((cs, cIdx) => (
                                      <td 
                                        key={cIdx} 
                                        className={`px-4 py-3 font-semibold text-brand-body border-r border-brand-border last:border-0 ${
                                          cs.category === selectedCategory ? 'bg-primary/5 text-primary font-bold' : ''
                                        }`}
                                      >
                                        {cs.score}%
                                      </td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
