import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  Check, 
  User, 
  Percent, 
  Phone, 
  MapPin, 
  Landmark, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Rocket, 
  Edit3, 
  ChevronRight, 
  ChevronLeft,
  Search,
  CheckCircle,
  AlertCircle,
  Layers,
  ChevronDown,
  X
} from 'lucide-react';

// Maharashtra districts for the dropdown helper
const DISTRICTS = [
  "Pune", "Mumbai City", "Mumbai Suburban", "Thane", "Nagpur", "Nashik", "Aurangabad", 
  "Sangli", "Kolhapur", "Solapur", "Amravati", "Nanded", "Jalgaon", "Ahmednagar", 
  "Satara", "Latur", "Akola", "Dhule", "Nandurbar", "Yavatmal", "Bhandara", "Gondia", 
  "Gadchiroli", "Chandrapur", "Wardha", "Hingoli", "Washim", "Buldhana", "Parbhani", 
  "Jalna", "Beed", "Osmanabad", "Ratnagiri", "Sindhudurg", "Raigad", "Palghar"
];

// Tip rotations helper
const QUICK_TIPS = [
  "TFWS (Tuition Fee Waiver Scheme) offers 100% waiver of tuition fees. Eligible only if family income is < 8 LPA.",
  "Place autonomous colleges at the top. They have updated, industry-aligned curricula and faster exam results.",
  "Category seats (OBC, SC, ST, EWS) are only allocated if you have valid Caste, Validity & NCL certificates.",
  "If you choose 'Betterment' in CAP Round 1, your allocated seat is preserved while you try for a higher preference in Round 2."
];

export default function PredictorForm({ onPredict, branches = [] }) {
  const { user } = useAuth();
  
  // Wizard step state
  const [currentStep, setCurrentStep] = useState(0); // 0 to 4
  const [direction, setDirection] = useState(1);
  const [showValidation, setShowValidation] = useState(false);

  // States with localStorage persistence
  const [admissionType, setAdmissionType] = useState(() => localStorage.getItem('cm_admissionType') || 'CET');
  const [score, setScore] = useState(() => localStorage.getItem('cm_score') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('cm_category') || 'OPEN');
  const [gender, setGender] = useState(() => localStorage.getItem('cm_gender') || 'Male');
  const [homeUniversity, setHomeUniversity] = useState(() => localStorage.getItem('cm_homeUniversity') || 'Pune');
  const [branchPreference, setBranchPreference] = useState('');
  const [name, setName] = useState(() => localStorage.getItem('cm_name') || '');
  const [phone, setPhone] = useState(() => localStorage.getItem('cm_phone') || '');
  const [tfws, setTfws] = useState(() => localStorage.getItem('cm_tfws') === 'true');
  const [ews, setEws] = useState(() => localStorage.getItem('cm_ews') === 'true');
  const [minority, setMinority] = useState(() => localStorage.getItem('cm_minority') === 'true');
  const [capType, setCapType] = useState(() => localStorage.getItem('cm_capType') || 'Maharashtra State');
  const [district, setDistrict] = useState(() => localStorage.getItem('cm_district') || 'Pune');
  const [region, setRegion] = useState(() => localStorage.getItem('cm_region') || 'West Maharashtra');
  const [state, setState] = useState(() => localStorage.getItem('cm_state') || 'Maharashtra');
  const [govToggle, setGovToggle] = useState(() => localStorage.getItem('cm_govToggle') !== 'false');
  const [pvtToggle, setPvtToggle] = useState(() => localStorage.getItem('cm_pvtToggle') !== 'false');
  const [autonomous, setAutonomous] = useState(() => localStorage.getItem('cm_autonomous') === 'true');
  const [naac, setNaac] = useState(() => localStorage.getItem('cm_naac') === 'true');
  const [cityPreference, setCityPreference] = useState(() => localStorage.getItem('cm_cityPreference') || '');
  const [hostelRequired, setHostelRequired] = useState(() => localStorage.getItem('cm_hostelRequired') === 'true');
  const [placementPriority, setPlacementPriority] = useState(() => localStorage.getItem('cm_placementPriority') === 'true');
  const [feesPriority, setFeesPriority] = useState(() => localStorage.getItem('cm_feesPriority') === 'true');

  // States for Region Selection and Branch Group Selection
  const [selectedRegions, setSelectedRegions] = useState(() => {
    try {
      const saved = localStorage.getItem('cm_selectedRegions');
      return saved ? JSON.parse(saved) : ['Entire Maharashtra'];
    } catch {
      return ['Entire Maharashtra'];
    }
  });

  const [selectedBranchGroup, setSelectedBranchGroup] = useState(() => {
    return localStorage.getItem('cm_selectedBranchGroup') || 'Computer Group';
  });

  // Manage specificCourses in component state only, do not save to localStorage
  const [specificCourses, setSpecificCourses] = useState([]);

  // Search filter for branches
  const [branchSearch, setBranchSearch] = useState('');
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  // Quick Tips Cycle
  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIdx(prev => (prev + 1) % QUICK_TIPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Sync state values to localStorage (excluding branchPreference and specificCourses)
  useEffect(() => {
    localStorage.setItem('cm_admissionType', admissionType);
    localStorage.setItem('cm_score', score);
    localStorage.setItem('cm_category', category);
    localStorage.setItem('cm_gender', gender);
    localStorage.setItem('cm_homeUniversity', homeUniversity);
    localStorage.setItem('cm_name', name);
    localStorage.setItem('cm_phone', phone);
    localStorage.setItem('cm_tfws', tfws);
    localStorage.setItem('cm_ews', ews);
    localStorage.setItem('cm_minority', minority);
    localStorage.setItem('cm_capType', capType);
    localStorage.setItem('cm_district', district);
    localStorage.setItem('cm_region', region);
    localStorage.setItem('cm_state', state);
    localStorage.setItem('cm_govToggle', govToggle);
    localStorage.setItem('cm_pvtToggle', pvtToggle);
    localStorage.setItem('cm_autonomous', autonomous);
    localStorage.setItem('cm_naac', naac);
    localStorage.setItem('cm_cityPreference', cityPreference);
    localStorage.setItem('cm_hostelRequired', hostelRequired);
    localStorage.setItem('cm_placementPriority', placementPriority);
    localStorage.setItem('cm_feesPriority', feesPriority);
    localStorage.setItem('cm_selectedRegions', JSON.stringify(selectedRegions));
    localStorage.setItem('cm_selectedBranchGroup', selectedBranchGroup);
  }, [admissionType, score, category, gender, homeUniversity, name, phone, tfws, ews, minority, capType, district, region, state, govToggle, pvtToggle, autonomous, naac, cityPreference, hostelRequired, placementPriority, feesPriority, selectedRegions, selectedBranchGroup]);

  // Reset specific courses whenever selectedBranchGroup changes (after mount)
  const prevBranchGroupRef = React.useRef(selectedBranchGroup);
  useEffect(() => {
    if (prevBranchGroupRef.current !== selectedBranchGroup) {
      setSpecificCourses([]);
      prevBranchGroupRef.current = selectedBranchGroup;
    }
  }, [selectedBranchGroup]);

  // Sync selectedRegions to homeUniversity and region (using the updated region options)
  useEffect(() => {
    if (selectedRegions.includes('Entire Maharashtra')) {
      setHomeUniversity('Pune');
      setRegion('West Maharashtra');
    } else {
      const first = selectedRegions[0];
      if (first === 'Pune') {
        setHomeUniversity('Pune');
        setRegion('West Maharashtra');
      } else if (first === 'Mumbai' || first === 'Konkan') {
        setHomeUniversity('Mumbai');
        setRegion('Mumbai Region');
      } else if (first === 'Nashik') {
        setHomeUniversity('Nashik');
        setRegion('North Maharashtra');
      } else if (first === 'Nagpur') {
        setHomeUniversity('Nagpur');
        setRegion('Vidarbha');
      } else if (first === 'Amravati') {
        setHomeUniversity('Amravati');
        setRegion('Vidarbha');
      } else if (first === 'Aurangabad') {
        setHomeUniversity('Aurangabad');
        setRegion('Marathwada');
      }
    }
  }, [selectedRegions]);

  // Sync selectedBranchGroup to branchPreference
  useEffect(() => {
    if (selectedBranchGroup === 'Computer Group') {
      setBranchPreference('Computer Engineering');
    } else if (selectedBranchGroup === 'Electronics Group') {
      setBranchPreference('Electronics and Telecommunication Engg');
    } else if (selectedBranchGroup === 'Mechanical Group') {
      setBranchPreference('Mechanical Engineering');
    } else if (selectedBranchGroup === 'Civil Group') {
      setBranchPreference('Civil Engineering');
    }
  }, [selectedBranchGroup]);

  // Sync profile details if logged in
  useEffect(() => {
    if (user && user.role === 'student') {
      if (user.profile.admissionType) setAdmissionType(user.profile.admissionType);
      if (user.profile.score) setScore(String(user.profile.score));
      if (user.profile.category) setCategory(user.profile.category);
      if (user.profile.gender) setGender(user.profile.gender);
      if (user.profile.homeUniversity) setHomeUniversity(user.profile.homeUniversity);
      if (user.profile.branchPreference) setBranchPreference(user.profile.branchPreference);
    }
  }, [user]);

  // Reservation syncing with category dropdown value
  useEffect(() => {
    if (ews) {
      setCategory('EWS');
      setTfws(false);
    } else if (category === 'EWS') {
      setCategory('OPEN');
    }
  }, [ews]);

  useEffect(() => {
    if (tfws) {
      setCategory('TFWS');
      setEws(false);
    } else if (category === 'TFWS') {
      setCategory('OPEN');
    }
  }, [tfws]);

  useEffect(() => {
    if (category !== 'EWS') setEws(false);
    if (category !== 'TFWS') setTfws(false);
  }, [category]);

  // Field validations
  const nameError = useMemo(() => name.trim().length > 0 && name.trim().length < 2, [name]);
  const scoreVal = useMemo(() => parseFloat(score), [score]);
  const scoreError = useMemo(() => {
    return score.trim().length > 0 && (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100);
  }, [score, scoreVal]);

  const isStepValid = (step) => {
    if (step === 0) return !!admissionType;
    if (step === 1) {
      const parsed = parseFloat(score);
      return name.trim().length >= 2 && !isNaN(parsed) && parsed >= 0 && parsed <= 100 && !!gender;
    }
    if (step === 2) return selectedRegions.length > 0;
    if (step === 3) return !!selectedBranchGroup;
    if (step === 4) return true;
    return false;
  };

  const changeStep = (targetStep) => {
    if (targetStep > currentStep) {
      // Validate active step
      if (!isStepValid(currentStep)) {
        setShowValidation(true);
        return;
      }
    }
    setShowValidation(false);
    setDirection(targetStep > currentStep ? 1 : -1);
    setCurrentStep(targetStep);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      changeStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      changeStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!isStepValid(1)) {
      setCurrentStep(1);
      setShowValidation(true);
      return;
    }
    onPredict({
      admissionType,
      score: parseFloat(score),
      category,
      gender,
      homeUniversity,
      branchPreference,
      name,
      phone,
      selectedRegions,
      specificCourses
    });
  };

  const handleReset = () => {
    localStorage.clear();
    setAdmissionType('CET');
    setScore('');
    setCategory('OPEN');
    setGender('Male');
    setHomeUniversity('Pune');
    setBranchPreference('');
    setName('');
    setPhone('');
    setTfws(false);
    setEws(false);
    setMinority(false);
    setCapType('Maharashtra State');
    setDistrict('Pune');
    setRegion('West Maharashtra');
    setState('Maharashtra');
    setGovToggle(true);
    setPvtToggle(true);
    setAutonomous(false);
    setNaac(false);
    setCityPreference('');
    setHostelRequired(false);
    setPlacementPriority(false);
    setFeesPriority(false);
    setBranchSearch('');
    setSelectedRegions(['Entire Maharashtra']);
    setSelectedBranchGroup('Computer Group');
    setSpecificCourses([]);
    setCurrentStep(0);
    setShowValidation(false);
    onPredict(null);
  };

  // Branch fuzzy search filtering
  const filteredBranches = useMemo(() => {
    if (!branchSearch) return branches;
    return branches.filter(b => b.name?.toLowerCase()?.includes(branchSearch.toLowerCase()));
  }, [branchSearch, branches]);

  // Sorted unique branch names for Specific Course dropdown
  const sortedUniqueBranches = useMemo(() => {
    if (!branches) return [];
    const uniqueNames = Array.from(new Set(branches.map(b => b.name).filter(Boolean)));
    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }, [branches]);

  // Click outside ref and handler to close the dropdown
  const dropdownRef = React.useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBranchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddCourse = (course) => {
    if (!specificCourses.includes(course)) {
      setSpecificCourses([...specificCourses, course]);
    }
  };

  const handleRemoveCourse = (course) => {
    setSpecificCourses(specificCourses.filter(c => c !== course));
  };

  const filteredUniqueBranches = useMemo(() => {
    if (!branchSearch) return sortedUniqueBranches;
    return sortedUniqueBranches.filter(name => 
      name.toLowerCase().includes(branchSearch.toLowerCase())
    );
  }, [branchSearch, sortedUniqueBranches]);

  const stepTitles = [
    { title: 'Pathway Select', sub: 'MHT-CET or Diploma' },
    { title: 'Student Info', sub: 'Name, marks & category' },
    { title: 'Region Selection', sub: 'Select region preferences' },
    { title: 'Branch Selection', sub: 'Branch group options' },
    { title: 'Review Preferences', sub: 'Overview & execute' }
  ];

  // Motion animation parameters
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: (dir) => ({
      x: dir < 0 ? 80 : -80,
      opacity: 0,
      transition: { duration: 0.15 }
    })
  };

  const progressPercentage = Math.round(((currentStep + 1) / 5) * 100);

  return (
    <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-1 sm:p-4 text-left">
      
      {/* LEFT SIDEBAR: STEPPER CARD & TIPS */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Stepper Card */}
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-heading">Counselling Process</h2>
              <p className="text-xs text-brand-muted">Complete steps to predict colleges</p>
            </div>
          </div>

          {/* Stepper list (Vertical on Desktop, Horizontal on Mobile) */}
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible space-x-6 lg:space-x-0 lg:space-y-6 pb-2 lg:pb-0 scrollbar-none">
            {stepTitles.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isActive = idx === currentStep;
              return (
                <button
                  key={idx}
                  onClick={() => changeStep(idx)}
                  className="flex items-center space-x-3 text-left shrink-0 cursor-pointer group focus:outline-none"
                >
                  {/* Number Circle */}
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-primary text-white' 
                      : isActive 
                      ? 'border-2 border-primary bg-primary/10 text-primary ring-4 ring-primary/20' 
                      : 'border border-brand-border bg-brand-bg text-brand-muted group-hover:border-primary/50'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>

                  {/* Title & Sub */}
                  <div className="hidden sm:block">
                    <span className={`block text-xs font-bold leading-tight ${isActive ? 'text-primary' : 'text-brand-heading'}`}>
                      {step.title}
                    </span>
                    <span className="block text-[10px] text-brand-muted">
                      {step.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Tips Card */}
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-indigo-50/50 to-white dark:to-slate-900 p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-primary font-bold text-xs mb-3 uppercase tracking-wider">
            <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
            <span>Admissions Tip</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xs text-brand-body leading-relaxed min-h-[48px]"
            >
              {QUICK_TIPS[tipIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

      </div>

      {/* RIGHT SIDEBAR: STEP WIZARD FORM */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Animated Progress bar */}
        <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-sm flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="flex justify-between items-center text-xs font-semibold text-brand-muted mb-1">
              <span>Wizard Progress</span>
              <span>{progressPercentage}% Completed</span>
            </div>
            <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-border/40">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-indigo-600 rounded-full"
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleReset}
            className="rounded-xl border border-brand-border bg-brand-card text-[11px] font-bold text-brand-muted hover:text-brand-heading hover:bg-brand-bg px-3 py-2 transition-colors cursor-pointer flex items-center space-x-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Clear Form</span>
          </button>
        </div>

        {/* Step Card Container */}
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 sm:p-8 shadow-sm relative min-h-[420px] flex flex-col justify-between">
          
          <div className="space-y-6 flex-1">
            
            {/* Step label header */}
            <div className="border-b border-brand-border pb-4">
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">
                Step {currentStep + 1} of 5
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-brand-heading tracking-tight mt-1 flex items-center justify-between">
                <span>{stepTitles[currentStep].title}</span>
                {isStepValid(currentStep) && (
                  <CheckCircle className="h-5 w-5 text-success shrink-0" />
                )}
              </h1>
            </div>

            {/* Stepper Body with Slide Transitions */}
            <div className="relative">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-6"
                >
                  
                  {/* STEP 1: Admission Pathway */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <p className="text-xs text-brand-body">Select your engineering admission pathway in Maharashtra DTE portal.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <button
                          type="button"
                          onClick={() => { setAdmissionType('CET'); setScore(''); changeStep(1); }}
                          className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                            admissionType === 'CET'
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.02]'
                              : 'border-brand-border bg-brand-card hover:bg-brand-bg hover:border-primary/50'
                          }`}
                        >
                          <div className={`rounded-xl p-2 mb-3 ${admissionType === 'CET' ? 'bg-primary/20 text-primary' : 'bg-brand-bg text-brand-muted'}`}>
                            <GraduationCap className="h-6 w-6" />
                          </div>
                          <span className="font-bold text-brand-heading text-sm">First Year Engineering (CET)</span>
                          <span className="text-xs text-brand-muted mt-1 leading-normal">
                            Matching cutoffs based on MHT-CET score percentiles for HSC/State Board general pathways.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setAdmissionType('DSE'); setScore(''); changeStep(1); }}
                          className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                            admissionType === 'DSE'
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.02]'
                              : 'border-brand-border bg-brand-card hover:bg-brand-bg hover:border-primary/50'
                          }`}
                        >
                          <div className={`rounded-xl p-2 mb-3 ${admissionType === 'DSE' ? 'bg-primary/20 text-primary' : 'bg-brand-bg text-brand-muted'}`}>
                            <Landmark className="h-6 w-6" />
                          </div>
                          <span className="font-bold text-brand-heading text-sm">Direct Second Year (Diploma/DSE)</span>
                          <span className="text-xs text-brand-muted mt-1 leading-normal">
                            For candidates holding a valid polytechnic diploma (DSE pathway) based on diploma aggregate percentage.
                          </span>
                        </button>

                      </div>
                    </div>
                  )}

                  {/* STEP 2: Student Details & Category */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      
                      {/* Name input */}
                      <div className="relative group">
                        <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-brand-muted group-focus-within:text-primary transition-colors" />
                        <input
                          id="wizard-name-input"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Student Full Name"
                          autoFocus
                          className={`block h-12 w-full rounded-xl border bg-brand-bg pl-10 pr-10 text-brand-heading placeholder:text-brand-muted focus:outline-none focus:ring-1 text-sm ${
                            showValidation && nameError ? 'border-error focus:border-error focus:ring-error/20' : 'border-brand-border focus:border-primary focus:ring-primary/20'
                          }`}
                        />
                        {name.trim().length >= 2 && (
                          <Check className="absolute right-3 top-3.5 h-5 w-5 text-success animate-scaleIn" />
                        )}
                        {showValidation && nameError && (
                          <div className="flex items-center space-x-1 mt-1 text-error text-[11px] animate-slideDown">
                            <AlertCircle className="h-3 w-3" />
                            <span>Name must contain at least 2 characters.</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Marks percentile */}
                        <div className="relative group">
                          <Percent className="absolute left-3 top-3.5 h-4.5 w-4.5 text-brand-muted group-focus-within:text-primary transition-colors" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            required
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            placeholder={admissionType === 'CET' ? "MHT-CET Percentile" : "Diploma Overall percentage"}
                            className={`block h-12 w-full rounded-xl border bg-brand-bg pl-10 pr-10 text-brand-heading placeholder:text-brand-muted focus:outline-none focus:ring-1 text-sm ${
                              showValidation && (scoreError || !score) ? 'border-error focus:border-error focus:ring-error/20' : 'border-brand-border focus:border-primary focus:ring-primary/20'
                            }`}
                          />
                          {score.trim().length > 0 && !scoreError && (
                            <Check className="absolute right-3 top-3.5 h-5 w-5 text-success animate-scaleIn" />
                          )}
                          {showValidation && (!score || scoreError) && (
                            <div className="flex items-center space-x-1 mt-1 text-error text-[11px] animate-slideDown">
                              <AlertCircle className="h-3 w-3" />
                              <span>Please enter a valid percentage/percentile (0 to 100).</span>
                            </div>
                          )}
                        </div>

                        {/* Gender */}
                        <div className="relative group">
                          <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-brand-muted group-focus-within:text-primary transition-colors" />
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg pl-10 pr-2.5 text-brand-heading focus:border-primary focus:outline-none text-sm cursor-pointer"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category Select */}
                        <div className="relative group">
                          <BookOpen className="absolute left-3 top-3.5 h-4.5 w-4.5 text-brand-muted group-focus-within:text-primary transition-colors" />
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg pl-10 pr-2.5 text-brand-heading focus:border-primary focus:outline-none text-sm cursor-pointer"
                          >
                            <option value="OPEN">OPEN (General State Seats)</option>
                            <option value="OBC">OBC (Other Backward Class)</option>
                            <option value="SC">SC (Scheduled Caste)</option>
                            <option value="ST">ST (Scheduled Tribe)</option>
                            <option value="VJ">VJ (De-Notified Tribe DT-A)</option>
                            <option value="NT-A">NT-A (Nomadic Tribe NT1)</option>
                            <option value="NT-B">NT-B (Nomadic Tribe NT2)</option>
                            <option value="NT-C">NT-C (Nomadic Tribe NT3)</option>
                            <option value="NT-D">NT-D (Nomadic Tribe NT4)</option>
                            <option value="SBC">SBC (Special Backward Class)</option>
                            <option value="SEBC">SEBC (Socially Educationally Backward Class)</option>
                            <option value="EWS">EWS (Economically Weaker Section)</option>
                            <option value="TFWS">TFWS (Tuition Fee Waiver Scheme)</option>
                            <option value="PWD">PWD (Persons with Disability Quota)</option>
                            <option value="DEFENCE">DEFENCE (Armed Forces Quota)</option>
                            <option value="ORPHAN">ORPHAN Quota</option>
                          </select>
                        </div>

                        {/* Phone Optional */}
                        <div className="relative group">
                          <Phone className="absolute left-3 top-3.5 h-4.5 w-4.5 text-brand-muted group-focus-within:text-primary transition-colors" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone Number (Optional)"
                            className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg pl-10 pr-3 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-sm"
                          />
                        </div>
                      </div>

                      {/* Reservations toggles grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-bg/40">
                          <div>
                            <span className="block text-xs font-bold text-brand-heading">EWS Quota</span>
                            <span className="block text-[10px] text-brand-muted">10% reserved seats for general poor</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={ews}
                            onChange={(e) => setEws(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-brand-border text-primary focus:ring-primary cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-bg/40">
                          <div>
                            <span className="block text-xs font-bold text-brand-heading">TFWS Scheme</span>
                            <span className="block text-[10px] text-brand-muted">Tuition Fee Waiver Scheme (Income &lt; 8L)</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={tfws}
                            onChange={(e) => setTfws(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-brand-border text-primary focus:ring-primary cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-bg/40">
                          <div>
                            <span className="block text-xs font-bold text-brand-heading">Minority Quota</span>
                            <span className="block text-[10px] text-brand-muted">Linguistic or religious minority seats</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={minority}
                            onChange={(e) => setMinority(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-brand-border text-primary focus:ring-primary cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-bg/40">
                          <div>
                            <span className="block text-xs font-bold text-brand-heading">CAP Seat Type</span>
                            <span className="block text-[10px] text-brand-muted">Admissions allocation region</span>
                          </div>
                          <select
                            value={capType}
                            onChange={(e) => setCapType(e.target.value)}
                            className="text-xs bg-transparent border-none text-brand-heading font-semibold focus:outline-none focus:ring-0 cursor-pointer"
                          >
                            <option value="Maharashtra State">Maharashtra State (MS)</option>
                            <option value="All India">All India (JEE Main/AI)</option>
                          </select>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* STEP 3: Region Selection */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <p className="text-xs text-brand-muted">
                        Select the regions where you would prefer to study. You can select multiple regions or select "Entire Maharashtra".
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Entire Maharashtra (Prominent) */}
                        <button
                          key="Entire Maharashtra"
                          type="button"
                          onClick={() => {
                            setSelectedRegions(['Entire Maharashtra']);
                          }}
                          className={`col-span-1 sm:col-span-3 flex items-center justify-center space-x-2 p-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                            selectedRegions.includes('Entire Maharashtra')
                              ? 'bg-primary border-primary text-white shadow-md hover:bg-primary/95 scale-[1.01]'
                              : 'bg-brand-bg border-brand-border text-brand-body hover:bg-brand-bg/80 hover:border-primary/50'
                          }`}
                        >
                          <MapPin className="h-5 w-5" />
                          <span>Entire Maharashtra (All Regions)</span>
                          {selectedRegions.includes('Entire Maharashtra') && (
                            <Check className="h-4 w-4 ml-1" />
                          )}
                        </button>

                        {/* Region chips */}
                        {['Pune', 'Mumbai', 'Nashik', 'Nagpur', 'Amravati', 'Aurangabad', 'Konkan'].map((r) => {
                          const isSelected = selectedRegions.includes(r);
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                let next = selectedRegions.filter(x => x !== 'Entire Maharashtra');
                                if (next.includes(r)) {
                                  next = next.filter(x => x !== r);
                                } else {
                                  next = [...next, r];
                                }
                                if (next.length === 0) {
                                  setSelectedRegions(['Entire Maharashtra']);
                                } else {
                                  setSelectedRegions(next);
                                }
                              }}
                              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/5 border-primary text-primary font-bold shadow-sm'
                                  : 'bg-brand-bg border-brand-border text-brand-body hover:bg-brand-bg/80 hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <MapPin className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-brand-muted'}`} />
                                <span>{r}</span>
                              </div>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Branch Selection */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <p className="text-xs text-brand-muted">
                        Select your primary engineering discipline group. This will filter recommendations matching your focus area.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            id: 'Computer Group',
                            title: 'Computer Group',
                            desc: 'Includes Computer Engineering, IT, AI & Data Science, Cyber Security, etc.'
                          },
                          {
                            id: 'Electronics Group',
                            title: 'Electronics Group',
                            desc: 'Includes Electronics & Telecommunication, Electrical, Instrumentation, etc.'
                          },
                          {
                            id: 'Mechanical Group',
                            title: 'Mechanical Group',
                            desc: 'Includes Mechanical Engineering, Automobile, Production, etc.'
                          },
                          {
                            id: 'Civil Group',
                            title: 'Civil Group',
                            desc: 'Includes Civil Engineering, Construction Technology, etc.'
                          }
                        ].map((group) => {
                          const isSelected = selectedBranchGroup === group.id;
                          return (
                            <button
                              key={group.id}
                              type="button"
                              onClick={() => setSelectedBranchGroup(group.id)}
                              className={`flex items-start p-5 rounded-2xl border text-left transition-all cursor-pointer group ${
                                isSelected
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.02]'
                                  : 'border-brand-border bg-brand-card hover:bg-brand-bg hover:border-primary/50'
                              }`}
                            >
                              {/* Left Checkbox */}
                              <div className="mr-4 mt-1 flex items-center justify-center">
                                <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                  isSelected 
                                    ? 'border-primary bg-primary text-white' 
                                    : 'border-brand-border bg-brand-bg group-hover:border-primary/50'
                                }`}>
                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                </div>
                              </div>

                              {/* Text Content */}
                              <div className="flex-1 min-w-0 pr-2">
                                <span className="block font-bold text-brand-heading text-sm group-hover:text-primary transition-colors">
                                  {group.title}
                                </span>
                                <span className="block text-xs text-brand-muted mt-1 leading-relaxed">
                                  {group.desc}
                                </span>
                              </div>

                              {/* Right Layers Icon */}
                              <div className={`rounded-xl p-2.5 shrink-0 ${
                                isSelected ? 'bg-primary/20 text-primary' : 'bg-brand-bg text-brand-muted group-hover:text-primary/70'
                              }`}>
                                <Layers className="h-5 w-5" />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Specific Course Dropdown */}
                      <div className="pt-4 border-t border-brand-border/60 space-y-2">
                        <label className="block text-xs font-bold text-brand-heading">
                          Select Preferred Branches (Optional)
                        </label>
                        <div className="relative group" ref={dropdownRef}>
                          <GraduationCap className="absolute left-3 top-3.5 h-4.5 w-4.5 text-brand-muted group-focus-within:text-primary transition-colors" />
                          <div
                            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                            className="flex h-12 w-full items-center justify-between rounded-xl border border-brand-border bg-brand-bg pl-10 pr-3.5 text-brand-heading focus-within:border-primary focus-within:ring-1 focus-within:ring-primary text-sm cursor-pointer select-none"
                          >
                            <span className={specificCourses.length > 0 ? "text-brand-heading font-medium" : "text-brand-muted"}>
                              {specificCourses.length > 0 
                                ? `${specificCourses.length} branch${specificCourses.length > 1 ? 'es' : ''} selected` 
                                : `All Branches in ${selectedBranchGroup}`}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-brand-muted transition-transform duration-200 ${showBranchDropdown ? 'rotate-180' : ''}`} />
                          </div>

                          {showBranchDropdown && (
                            <div className="relative mt-1.5 w-full rounded-2xl border border-brand-border bg-brand-card shadow-lg p-3 space-y-2.5 max-h-[500px] flex flex-col">
                              {/* Search Box */}
                              <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-brand-muted" />
                                <input
                                  type="text"
                                  placeholder="Search preferred branches..."
                                  value={branchSearch}
                                  onChange={(e) => setBranchSearch(e.target.value)}
                                  className="block h-9 w-full rounded-lg border border-brand-border bg-brand-bg pl-9 pr-3 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              
                              {/* Options List */}
                              <div className="overflow-y-auto custom-scrollbar space-y-0.5 max-h-[420px] pr-1">
                                {filteredUniqueBranches.length === 0 ? (
                                  <div className="text-xs text-brand-muted py-3 text-center">No branches found</div>
                                ) : (
                                  filteredUniqueBranches.map(name => {
                                    const isCourseSelected = specificCourses.includes(name);
                                    return (
                                      <button
                                        key={name}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isCourseSelected) {
                                            handleRemoveCourse(name);
                                          } else {
                                            handleAddCourse(name);
                                          }
                                        }}
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                                          isCourseSelected 
                                            ? 'bg-primary/10 text-primary font-bold' 
                                            : 'text-brand-heading hover:bg-brand-bg'
                                        }`}
                                      >
                                        <span className="truncate pr-2">{name}</span>
                                        {isCourseSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Selected Branches Chips */}
                        {specificCourses.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {specificCourses.map(course => (
                              <span 
                                key={course} 
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-semibold border border-primary/20 animate-fadeIn"
                              >
                                <span>{course}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveCourse(course);
                                  }}
                                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer text-primary"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Preferences & Summary */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      
                      {/* Grid of college priority filters */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Government', active: govToggle, setter: setGovToggle },
                          { label: 'Private', active: pvtToggle, setter: setPvtToggle },
                          { label: 'Autonomous', active: autonomous, setter: setAutonomous },
                          { label: 'NAAC A+/A', active: naac, setter: setNaac }
                        ].map(t => (
                          <button
                            key={t.label}
                            type="button"
                            onClick={() => t.setter(!t.active)}
                            className={`p-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                              t.active
                                ? 'bg-primary/5 border-primary text-primary shadow-sm'
                                : 'bg-brand-bg border-brand-border text-brand-muted hover:border-brand-border/80'
                            }`}
                          >
                            <ShieldCheck className={`h-4.5 w-4.5 mx-auto mb-1.5 ${t.active ? 'text-primary' : 'text-brand-muted'}`} />
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Extra preferences toggles (UI Only) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-bg/40">
                          <div>
                            <span className="block text-xs font-bold text-brand-heading">Hostel Facility</span>
                            <span className="block text-[10px] text-brand-muted">Require hostel accommodation info</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={hostelRequired}
                            onChange={(e) => setHostelRequired(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-brand-border text-primary focus:ring-primary cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-bg/40">
                          <div>
                            <span className="block text-xs font-bold text-brand-heading">Placement Focus</span>
                            <span className="block text-[10px] text-brand-muted">Prioritize colleges with high average LPA</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={placementPriority}
                            onChange={(e) => setPlacementPriority(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-brand-border text-primary focus:ring-primary cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* PRE-SUBMIT SUMMARY CARD */}
                      <div className="rounded-xl border border-brand-border bg-brand-bg/60 p-4 space-y-3.5 text-xs">
                        <div className="flex items-center justify-between border-b border-brand-border/60 pb-2">
                          <span className="font-bold text-brand-heading text-xs uppercase tracking-wider">Counselling Profile Summary</span>
                          <span className="text-[10px] text-brand-muted">Double check values before submission</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 leading-normal">
                          <div className="flex justify-between items-center bg-brand-card p-2 rounded-lg border border-brand-border/40">
                            <div>
                              <span className="block text-[10px] text-brand-muted uppercase">Pathway</span>
                              <strong className="text-brand-heading font-bold">{admissionType === 'CET' ? 'First Year (CET)' : 'Direct Second Year (DSE)'}</strong>
                            </div>
                            <button type="button" onClick={() => changeStep(0)} className="text-primary hover:text-indigo-600 cursor-pointer">
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex justify-between items-center bg-brand-card p-2 rounded-lg border border-brand-border/40">
                            <div>
                              <span className="block text-[10px] text-brand-muted uppercase">Student Score</span>
                              <strong className="text-brand-heading font-bold">{score} {admissionType === 'CET' ? 'Percentile' : '%'}</strong>
                            </div>
                            <button type="button" onClick={() => changeStep(1)} className="text-primary hover:text-indigo-600 cursor-pointer">
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex justify-between items-center bg-brand-card p-2 rounded-lg border border-brand-border/40">
                            <div>
                              <span className="block text-[10px] text-brand-muted uppercase">Category & Gender</span>
                              <strong className="text-brand-heading font-bold">{category} · {gender}</strong>
                            </div>
                            <button type="button" onClick={() => changeStep(1)} className="text-primary hover:text-indigo-600 cursor-pointer">
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex justify-between items-center bg-brand-card p-2 rounded-lg border border-brand-border/40">
                            <div>
                              <span className="block text-[10px] text-brand-muted uppercase">Preferred Regions</span>
                              <strong className="text-brand-heading font-bold truncate max-w-[150px] inline-block">{selectedRegions.join(', ')}</strong>
                            </div>
                            <button type="button" onClick={() => changeStep(2)} className="text-primary hover:text-indigo-600 cursor-pointer">
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex justify-between items-center bg-brand-card p-2 rounded-lg border border-brand-border/40 sm:col-span-2">
                            <div>
                              <span className="block text-[10px] text-brand-muted uppercase">Preferred Branch</span>
                              <strong className="text-brand-heading font-bold">{selectedBranchGroup}</strong>
                            </div>
                            <button type="button" onClick={() => changeStep(3)} className="text-primary hover:text-indigo-600 cursor-pointer">
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

          </div>

          {/* Nav buttons */}
          <div className="flex justify-between items-center border-t border-brand-border pt-6 mt-8">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl border border-brand-border bg-brand-card font-bold text-xs text-brand-body hover:bg-brand-bg transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center space-x-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-bold text-xs text-white shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-indigo-700 hover:from-primary-hover hover:to-indigo-800 font-bold text-sm text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center space-x-2"
              >
                <Rocket className="h-4.5 w-4.5 shrink-0" />
                <span>Predict My Colleges</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
