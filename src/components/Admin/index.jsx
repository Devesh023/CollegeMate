import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { parsePdfClient } from '../../services/pdfParser';
import { parseCSV, detectColumns, validateCSVRow } from '../../services/csvParser';
import { BRANCHES, CITIES, UNIVERSITIES } from '../../db/mockData';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  BarChart, 
  Info,
  X,
  FileText,
  MapPin,
  ArrowLeft,
  Loader,
  AlertTriangle,
  FileUp,
  Award,
  SlidersHorizontal,
  ShieldAlert,
  Users,
  Activity,
  GraduationCap,
  Layers
} from 'lucide-react';

export default function AdminPanel({ onBack }) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [colleges, setColleges] = useState([]);
  const [cutoffs, setCutoffs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms & Modal states
  const [collegeModalOpen, setCollegeModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null); // college object or null (for Add)
  const [cutoffModalOpen, setCutoffModalOpen] = useState(false);
  const [editingCutoff, setEditingCutoff] = useState(null); // cutoff object or null

  // PDF & Bulk Importer States
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Custom states for complete admin panel fix
  const [parseProgress, setParseProgress] = useState({ percent: 0, currentPage: 0, totalPages: 0, etaSeconds: 0 });
  const [parseError, setParseError] = useState(null);
  const [importLogs, setImportLogs] = useState([]);
  const [registeredStudentsCount, setRegisteredStudentsCount] = useState(0);
  const [predictionsCount, setPredictionsCount] = useState(0);
  const [cetCount, setCetCount] = useState(0);
  const [dseCount, setDseCount] = useState(0);
  const [totalBranchesCount, setTotalBranchesCount] = useState(0);

  // CSV Importer States
  const [importerType, setImporterType] = useState('csv'); // 'csv' (default) or 'pdf'
  const [csvFile, setCsvFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [csvLayout, setCsvLayout] = useState('flat'); // 'flat' or 'pivoted'
  const [columnMappings, setColumnMappings] = useState({});
  const [pivotedCategoryColumns, setPivotedCategoryColumns] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedRound, setSelectedRound] = useState('CAP1');
  const [selectedAdmissionType, setSelectedAdmissionType] = useState('FIRST_YEAR_ENGINEERING');
  const [importMode, setImportMode] = useState('dryrun'); // 'dryrun', 'append', 'replace'
  const [importHistory, setImportHistory] = useState([]);
  const [csvStats, setCsvStats] = useState(null);

  // College Form States
  const [colName, setColName] = useState('');
  const [colCode, setColCode] = useState('');
  const [colCity, setColCity] = useState('');
  const [colUniv, setColUniv] = useState('');
  const [colType, setColType] = useState('Private Autonomous');
  const [colWeb, setColWeb] = useState('');
  const [colFees, setColFees] = useState('');
  const [colAvgPkg, setColAvgPkg] = useState('');
  const [colHighPkg, setColHighPkg] = useState('');
  const [colCourses, setColCourses] = useState([]);
  const [colFacilities, setColFacilities] = useState([]);

  // Cutoff Form States
  const [cutColId, setCutColId] = useState('');
  const [cutBranch, setCutBranch] = useState('Computer Engineering');
  const [cutType, setCutType] = useState('CET');
  const [cutYear, setCutYear] = useState(2025);
  const [cutOpen, setCutOpen] = useState('');
  const [cutObc, setCutObc] = useState('');
  const [cutSc, setCutSc] = useState('');
  const [cutSt, setCutSt] = useState('');

  const reloadData = async () => {
    try {
      setLoading(true);
      const cols = await dbService.getColleges();
      const cuts = await dbService.getCutoffs();
      setColleges(cols);
      setCutoffs(cuts);
      if (cols.length > 0) setCutColId(cols[0].id);

      // Fetch profiles & count registered students
      const profiles = await dbService.getProfiles();
      const students = profiles.filter(p => p.role === 'student' || p.role === 'user');
      setRegisteredStudentsCount(students.length);

      // Count predictions generated
      const predsGen = parseInt(localStorage.getItem('collegemate_predictions_generated') || '0');
      setPredictionsCount(predsGen);

      // Count branches
      const uniqueBranches = new Set();
      cuts.forEach(c => {
        if (c.branch) {
          uniqueBranches.add(c.branch.split(' - ')[0]);
        }
      });
      setTotalBranchesCount(uniqueBranches.size);

      // Count CET and DSE category records
      let cet = 0;
      let dse = 0;
      const categories = [
        'OPEN', 'OBC', 'SC', 'ST', 'EWS', 'TFWS',
        'GOPENS', 'LOPENS', 'GSCS', 'LSCS', 'GSTS', 'LSTS', 'GOBCS', 'LOBCS',
        'GOPEN', 'LOPEN', 'GOBC', 'LOBC', 'GSC', 'LSC', 'GST', 'LST'
      ];
      
      cuts.forEach(c => {
        let rowCats = 0;
        categories.forEach(cat => {
          if (c[cat] !== undefined && c[cat] !== null && c[cat] !== '') {
            rowCats++;
          }
        });
        if (rowCats === 0) rowCats = 1;
        if (c.admissionType === 'CET' || c.admissionType === 'FIRST_YEAR_ENGINEERING') {
          cet += rowCats;
        } else {
          dse += rowCats;
        }
      });
      setCetCount(cet);
      setDseCount(dse);

      // Fetch latest uploads history
      const history = await dbService.getLatestUploads();
      setImportHistory(history);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  useEffect(() => {
    const syncSubTabWithUrl = () => {
      const path = window.location.pathname;
      if (path === '/admin/import') {
        setActiveSubTab('import');
      } else if (path === '/admin/colleges') {
        setActiveSubTab('colleges');
      } else if (path === '/admin/cutoffs') {
        setActiveSubTab('cutoffs');
      } else if (path === '/admin/analytics' || path === '/admin') {
        setActiveSubTab('overview');
      }
    };
    
    syncSubTabWithUrl();
    window.addEventListener('popstate', syncSubTabWithUrl);
    return () => window.removeEventListener('popstate', syncSubTabWithUrl);
  }, []);

  const handleSubTabClick = (tab) => {
    setActiveSubTab(tab);
    let path = '/admin';
    if (tab === 'import') path = '/admin/import';
    else if (tab === 'colleges') path = '/admin/colleges';
    else if (tab === 'cutoffs') path = '/admin/cutoffs';
    else if (tab === 'overview') path = '/admin';
    window.history.pushState(null, '', path);
  };

  // Save/Update College Handler
  const handleSaveCollege = async (e) => {
    e.preventDefault();
    if (!colName || !colCode || !colFees) return;

    const collegeData = {
      name: colName,
      code: colCode,
      city: colCity || CITIES[0],
      university: colUniv || UNIVERSITIES[0],
      type: colType,
      website: colWeb || 'https://www.google.com',
      fees: parseFloat(colFees),
      placementRating: 4.0,
      averagePackage: parseFloat(colAvgPkg) || 5.0,
      highestPackage: parseFloat(colHighPkg) || 12.0,
      facilities: colFacilities.length > 0 ? colFacilities : ["Library", "Wifi"],
      courses: colCourses.length > 0 ? colCourses : ["Computer Engineering"]
    };

    try {
      if (editingCollege) {
        await dbService.updateCollege(editingCollege.id, collegeData);
      } else {
        await dbService.addCollege(collegeData);
      }
      setCollegeModalOpen(false);
      resetCollegeForm();
      await reloadData();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const resetCollegeForm = () => {
    setEditingCollege(null);
    setColName('');
    setColCode('');
    setColCity(CITIES[0]);
    setColUniv(UNIVERSITIES[0]);
    setColType('Private Autonomous');
    setColWeb('');
    setColFees('');
    setColAvgPkg('');
    setColHighPkg('');
    setColCourses([]);
    setColFacilities([]);
  };

  const handleEditCollegeClick = (col) => {
    setEditingCollege(col);
    setColName(col.name);
    setColCode(col.code);
    setColCity(col.city);
    setColUniv(col.university);
    setColType(col.type);
    setColWeb(col.website || '');
    setColFees(col.fees ? col.fees.toString() : '');
    setColAvgPkg(col.averagePackage ? col.averagePackage.toString() : '');
    setColHighPkg(col.highestPackage ? col.highestPackage.toString() : '');
    setColCourses(col.courses || []);
    setColFacilities(col.facilities || []);
    setCollegeModalOpen(true);
  };

  const handleDeleteCollegeClick = async (id) => {
    if (confirm("Are you sure you want to delete this college? This will also purge its cutoffs.")) {
      await dbService.deleteCollege(id);
      await reloadData();
    }
  };

  // Save/Update Cutoff Handler
  const handleSaveCutoff = async (e) => {
    e.preventDefault();
    if (!cutColId || !cutOpen) return;

    const cutoffData = {
      collegeId: cutColId,
      branch: cutBranch,
      admissionType: cutType,
      year: parseInt(cutYear),
      OPEN: parseFloat(cutOpen),
      OBC: parseFloat(cutObc || cutOpen),
      SC: parseFloat(cutSc || cutOpen),
      ST: parseFloat(cutSt || cutOpen),
      gender: "Co-Ed"
    };

    try {
      if (editingCutoff) {
        const uniqueId = editingCutoff.id || editingCutoff.collegeId + '-' + editingCutoff.branch + '-' + editingCutoff.year;
        await dbService.updateCutoff(uniqueId, cutoffData);
      } else {
        await dbService.addCutoff(cutoffData);
      }
      setCutoffModalOpen(false);
      resetCutoffForm();
      await reloadData();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const resetCutoffForm = () => {
    setEditingCutoff(null);
    if (colleges.length > 0) setCutColId(colleges[0].id);
    setCutBranch('Computer Engineering');
    setCutType('CET');
    setCutYear(2025);
    setCutOpen('');
    setCutObc('');
    setCutSc('');
    setCutSt('');
  };

  const handleEditCutoffClick = (cut) => {
    setEditingCutoff(cut);
    setCutColId(cut.collegeId);
    setCutBranch(cut.branch);
    setCutType(cut.admissionType);
    setCutYear(cut.year);
    setCutOpen(cut.OPEN.toString());
    setCutObc(cut.OBC ? cut.OBC.toString() : '');
    setCutSc(cut.SC ? cut.SC.toString() : '');
    setCutSt(cut.ST ? cut.ST.toString() : '');
    setCutoffModalOpen(true);
  };

  const handleDeleteCutoffClick = async (cut) => {
    if (confirm("Delete this cutoff record?")) {
      const uniqueId = cut.id || cut.collegeId + '-' + cut.branch + '-' + cut.year;
      await dbService.deleteCutoff(uniqueId);
      await reloadData();
    }
  };

  // CSV Client-Side Parser
  const handleCSVImport = async (e) => {
    e.preventDefault();
    if (!importText.trim()) return;

    try {
      setImportStatus('Parsing lines...');
      // Expecting CSV format:
      // CollegeCode,Branch,AdmissionType,Year,OPEN,OBC,SC,ST
      const lines = importText.split('\n');
      let successCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || i === 0 && line.toLowerCase().includes('code')) {
          continue; // skip empty or headers
        }

        const parts = line.split(',');
        if (parts.length < 8) {
          skippedCount++;
          continue;
        }

        const [code, branch, type, year, openVal, obcVal, scVal, stVal] = parts;
        const matchingCollege = colleges.find(c => c.code === code.trim());
        
        if (!matchingCollege) {
          skippedCount++;
          continue;
        }

        const newCutoff = {
          collegeId: matchingCollege.id,
          branch: branch.trim(),
          admissionType: type.trim().toUpperCase(),
          year: parseInt(year.trim()) || 2025,
          OPEN: parseFloat(openVal.trim()) || 0,
          OBC: parseFloat(obcVal.trim()) || parseFloat(openVal.trim()),
          SC: parseFloat(scVal.trim()) || parseFloat(openVal.trim()),
          ST: parseFloat(stVal.trim()) || parseFloat(openVal.trim()),
          gender: "Co-Ed"
        };

        await dbService.addCutoff(newCutoff);
        successCount++;
      }

      setImportStatus(`Successfully imported ${successCount} cutoffs. Skipped ${skippedCount} unrecognized lines/codes.`);
      setImportText('');
      await reloadData();
    } catch (err) {
      setImportStatus(`Error during import: ${err.message}`);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPdfFile(file);
      setParsedResult(null);
      setImportResult(null);
      setValidationErrors([]);
    }
  };

  const runImport = async (parsedRecords, fileName) => {
    try {
      setIsImporting(true);
      setImportStatus('Importing to database...');
      setImportLogs(['Import Started', `Total parsed records to process: ${parsedRecords.length}`]);

      const countsBefore = await dbService.getDatabaseCounts();

      const startTime = Date.now();
      const res = await dbService.bulkImportParsedRecords(parsedRecords, fileName, (current, total) => {
        setImportProgress({ current, total });
        setImportLogs(prev => [
          ...prev,
          `Processed ${current} of ${total} records...`
        ]);
      });

      const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

      const countsAfter = await dbService.getDatabaseCounts();

      const countCollegesBefore = countsBefore.colleges;
      const countBranchesBefore = countsBefore.branches;
      const countCutoffsBefore = countsBefore.cutoffs;

      const countCollegesAfter = countsAfter.colleges;
      const countBranchesAfter = countsAfter.branches;
      const countCutoffsAfter = countsAfter.cutoffs;

      const countsIncreased = 
        countCollegesAfter > countCollegesBefore ||
        countBranchesAfter > countBranchesBefore ||
        countCutoffsAfter > countCutoffsBefore;

      const anyCountIsZero = 
        countCollegesAfter === 0 ||
        countBranchesAfter === 0 ||
        countCutoffsAfter === 0;

      if (anyCountIsZero || !countsIncreased) {
        setImportStatus('IMPORT FAILED');
        const failedLogs = [
          ...res.logs,
          `[ERROR] Verification failed. Counts did not increase or a table is empty.`,
          `Colleges: ${countCollegesAfter} (Before: ${countCollegesBefore})`,
          `Branches: ${countBranchesAfter} (Before: ${countBranchesBefore})`,
          `Cutoffs: ${countCutoffsAfter} (Before: ${countCutoffsBefore})`,
          `IMPORT FAILED`
        ];
        setImportResult({
          ...res,
          verificationCounts: countsAfter,
          durationSeconds,
          status: 'Failed',
          logs: failedLogs
        });
        setImportLogs(failedLogs);
      } else {
        setImportStatus('Data successfully imported!');
        setImportResult({
          ...res,
          verificationCounts: countsAfter,
          durationSeconds,
          status: 'Success'
        });
        setImportLogs(res.logs);
        setPdfFile(null);
        await reloadData();
      }
    } catch (err) {
      setImportLogs(prev => [...prev, `Import failed: ${err.message}`]);
      setImportStatus('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCSVFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setParseError(null);
    setImportResult(null);
    setCsvStats(null);
    setValidationErrors([]);
    setImportStatus('Reading CSV file...');

    // Auto-detect Admission Type from filename
    if (file.name.toLowerCase().includes('dse')) {
      setSelectedAdmissionType('DIRECT_SECOND_YEAR_ENGINEERING');
    } else if (file.name.toLowerCase().includes('engg') || file.name.toLowerCase().includes('cet')) {
      setSelectedAdmissionType('FIRST_YEAR_ENGINEERING');
    }

    try {
      const reader = new FileReader();
      
      // Read first 500KB to generate preview fast
      const previewBlob = file.slice(0, 500000);
      
      reader.onload = (event) => {
        const text = event.target.result;
        const allParsed = parseCSV(text);
        
        if (allParsed.length === 0) {
          setImportStatus('Error: CSV file is empty.');
          return;
        }

        const headers = allParsed[0].map(h => h.trim());
        setCsvHeaders(headers);
        
        const preview = allParsed.slice(1, 101);
        setCsvPreviewRows(preview);
        
        // Auto-detect columns
        const detected = detectColumns(headers);
        setColumnMappings(detected);

        // Pre-detect pivoted columns
        const potentialPivoted = headers.filter(h => 
          ['open', 'obc', 'sc', 'st', 'ews', 'tfws', 'gopens', 'lopens', 'gscs', 'lscs', 'gobcs', 'lobcs', 'gopenh', 'lopenh'].includes(h.toLowerCase().trim())
        );
        setPivotedCategoryColumns(potentialPivoted);

        // Auto-detect layout
        if (detected.category) {
          setCsvLayout('flat');
        } else if (potentialPivoted.length > 0) {
          setCsvLayout('pivoted');
        }

        setImportStatus(`Loaded ${file.name} (Preview generated). Adjust mappings below.`);
      };

      reader.readAsText(previewBlob);
    } catch (err) {
      console.error(err);
      setImportStatus(`Failed to read CSV: ${err.message}`);
    }
  };

  const handleCSVImportSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setIsParsing(true);
    setParseError(null);
    setImportStatus(importMode === 'dryrun' ? 'Running dry-run validation...' : 'Starting CSV import pipeline...');
    setValidationErrors([]);
    setImportResult(null);

    const startTime = Date.now();
    
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          const text = event.target.result;
          setImportStatus('Parsing full CSV...');
          
          const allLines = parseCSV(text);
          if (allLines.length <= 1) {
            throw new Error('CSV contains no data rows.');
          }

          const headers = allLines[0].map(h => h.trim());
          const rows = allLines.slice(1);

          setImportStatus('Validating and mapping rows...');

          let totalRows = rows.length;
          let validRows = 0;
          let invalidRows = 0;
          let duplicateRows = 0;
          const mappedRecords = [];
          const errorSample = [];
          
          const csvKeys = new Set();

          const chunkSize = 10000;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            
            chunk.forEach((row, rowIdx) => {
              const globalIdx = i + rowIdx + 2;
              
              const getValue = (field) => {
                const headerName = columnMappings[field];
                if (!headerName) return '';
                const idx = headers.indexOf(headerName);
                return idx !== -1 ? row[idx] || '' : '';
              };

              if (csvLayout === 'pivoted') {
                pivotedCategoryColumns.forEach(catName => {
                  const headerIdx = headers.indexOf(catName);
                  const percentileStr = headerIdx !== -1 ? row[headerIdx] || '' : '';
                  if (!percentileStr.trim()) return;

                  const collegeCode = getValue('collegeCode');
                  const collegeName = getValue('collegeName') || 'Unknown College';
                  const city = getValue('city') || 'Maharashtra';
                  const university = getValue('university') || 'Default University';
                  const type = getValue('type') || 'Private';
                  const choiceCode = getValue('choiceCode') || (collegeCode + '00');
                  const branchName = getValue('branchName');
                  const percentile = parseFloat(percentileStr.trim());
                  const rank = parseInt(getValue('rank')) || null;
                  const year = parseInt(selectedYear);
                  const round = selectedRound;

                  const mapped = {
                    collegeCode: collegeCode.trim(),
                    collegeName: collegeName.trim(),
                    city: city.trim(),
                    university: university.trim(),
                    type: type.trim(),
                    choiceCode: choiceCode.trim(),
                    branchName: branchName.trim(),
                    admissionType: selectedAdmissionType,
                    year,
                    round,
                    category: catName.trim().toUpperCase(),
                    percentile,
                    rank
                  };

                  const validation = validateCSVRow(mapped);
                  if (validation.isValid) {
                    const dupKey = `${mapped.collegeCode}-${mapped.branchName}-${mapped.category}-${mapped.round}-${mapped.year}`;
                    if (csvKeys.has(dupKey)) {
                      duplicateRows++;
                    } else {
                      csvKeys.add(dupKey);
                      validRows++;
                      mappedRecords.push(mapped);
                    }
                  } else {
                    invalidRows++;
                    if (errorSample.length < 5) {
                      errorSample.push(`Row ${globalIdx} (${catName}): ${validation.errors.join(', ')}`);
                    }
                  }
                });
              } else {
                const collegeCode = getValue('collegeCode');
                const collegeName = getValue('collegeName') || 'Unknown College';
                const city = getValue('city') || 'Maharashtra';
                const university = getValue('university') || 'Default University';
                const type = getValue('type') || 'Private';
                const choiceCode = getValue('choiceCode') || (collegeCode + '00');
                const branchName = getValue('branchName');
                const category = getValue('category');
                const percentile = parseFloat(getValue('percentile'));
                const rank = parseInt(getValue('rank')) || null;
                const year = parseInt(selectedYear);
                const round = selectedRound;

                const mapped = {
                  collegeCode: collegeCode.trim(),
                  collegeName: collegeName.trim(),
                  city: city.trim(),
                  university: university.trim(),
                  type: type.trim(),
                  choiceCode: choiceCode.trim(),
                  branchName: branchName.trim(),
                  admissionType: selectedAdmissionType,
                  year,
                  round,
                  category: category.trim().toUpperCase(),
                  percentile,
                  rank
                };

                const validation = validateCSVRow(mapped);
                if (validation.isValid) {
                  const dupKey = `${mapped.collegeCode}-${mapped.branchName}-${mapped.category}-${mapped.round}-${mapped.year}`;
                  if (csvKeys.has(dupKey)) {
                    duplicateRows++;
                  } else {
                    csvKeys.add(dupKey);
                    validRows++;
                    mappedRecords.push(mapped);
                  }
                } else {
                  invalidRows++;
                  if (errorSample.length < 5) {
                    errorSample.push(`Row ${globalIdx}: ${validation.errors.join(', ')}`);
                  }
                }
              }
            });

            setImportStatus(`Validating rows: ${Math.min(i + chunkSize, rows.length)} / ${rows.length}...`);
            await new Promise(resolve => setTimeout(resolve, 0));
          }

          if (errorSample.length > 0) {
            setValidationErrors([
              `Validation completed with ${invalidRows} invalid rows. Showing first ${errorSample.length} errors:`,
              ...errorSample
            ]);
          } else {
            setValidationErrors([`Validation Successful: All ${validRows} mapped rows are valid.`]);
          }

          const durationSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
          const speed = Math.round(totalRows / (durationSeconds || 0.1));
          
          setCsvStats({
            totalRows,
            validRows,
            invalidRows,
            duplicateRows,
            speedRowsPerSecond: speed,
            durationSeconds
          });

          if (importMode === 'dryrun') {
            setImportStatus('Dry Run Validation Successful. No database inserts were made.');
            setIsParsing(false);
            return;
          }

          setImportStatus(`Importing ${mappedRecords.length} records into Supabase...`);
          setIsImporting(true);
          setIsParsing(false);

          const result = await dbService.bulkImportParsedRecords(
            mappedRecords,
            csvFile.name,
            (current, total) => {
              setImportProgress({ current, total });
              setImportStatus(`Uploading to Supabase: ${current} / ${total} rows...`);
            },
            {
              mode: importMode,
              year: selectedYear,
              round: selectedRound,
              admissionType: selectedAdmissionType
            }
          );

          setImportResult(result);
          setImportStatus(`CSV Import successful. Total time: ${result.durationSeconds}s.`);
          
          // Clear states
          setCsvFile(null);
          setCsvPreviewRows([]);
          setCsvHeaders([]);

          await reloadData();
          
        } catch (innerErr) {
          console.error(innerErr);
          setParseError({
            fileName: csvFile.name,
            pageNumber: 'N/A',
            reason: innerErr.message,
            stack: innerErr.stack || ''
          });
          setImportStatus('Import failed due to error.');
        } finally {
          setIsParsing(false);
          setIsImporting(false);
        }
      };

      fileReader.readAsText(csvFile);

    } catch (err) {
      console.error(err);
      setParseError({
        fileName: csvFile.name,
        pageNumber: 'N/A',
        reason: err.message,
        stack: err.stack || ''
      });
      setIsParsing(false);
      setIsImporting(false);
    }
  };

  const handleParsePDF = async () => {
    if (!pdfFile) return;
    try {
      setIsParsing(true);
      setParseError(null);
      setImportStatus('');
      setValidationErrors([]);
      setParsedResult(null);
      setParseProgress({ percent: 0, currentPage: 0, totalPages: 0, etaSeconds: 0 });
      
      const result = await parsePdfClient(pdfFile, (prog) => {
        setParseProgress(prog);
      });
      setParsedResult(result);
      
      const errors = [];
      if (result.records.length === 0) {
        errors.push("No records could be parsed. Please check if the PDF is a valid CET or DSE CAP round cutoff document.");
      } else {
        const sample = result.records[0];
        if (!sample.collegeCode || !sample.branchName) {
          errors.push("Warning: Missing college or branch names in parsed data.");
        }
        
        const matchingCount = result.records.filter(r => colleges.some(c => c.code === r.collegeCode)).length;
        if (matchingCount === 0) {
          errors.push("Notice: None of the college codes match our current directory. New colleges will be created during import.");
        } else {
          errors.push(`Validation Success: ${matchingCount} colleges matched with existing directory. Others will be created.`);
        }
      }
      setValidationErrors(errors);

      if (result.records.length > 0) {
        setIsParsing(false);
        await runImport(result.records, pdfFile.name);
      }
      
    } catch (err) {
      setParseError({
        fileName: err.fileName || pdfFile.name,
        pageNumber: err.pageNumber || 'N/A',
        reason: err.reason || err.message,
        stack: err.stack || ''
      });
    } finally {
      setIsParsing(false);
    }
  };

  const loadMockCSVTemplate = () => {
    // Generates valid CSV values using existing college codes
    const demoColCode = colleges[0]?.code || '6006';
    const demoColCode2 = colleges[1]?.code || '3012';
    setImportText(
      `CollegeCode,Branch,AdmissionType,Year,OPEN,OBC,SC,ST\n` +
      `${demoColCode},Computer Engineering,CET,2025,99.90,99.80,98.60,95.50\n` +
      `${demoColCode},Information Technology,CET,2025,99.50,99.20,98.00,94.00\n` +
      `${demoColCode2},Computer Engineering,DSE,2025,97.50,96.80,94.00,91.00`
    );
  };

  const handleFacilityCheckbox = (fac) => {
    if (colFacilities.includes(fac)) {
      setColFacilities(colFacilities.filter(f => f !== fac));
    } else {
      setColFacilities([...colFacilities, fac]);
    }
  };

  const handleCourseCheckbox = (courseName) => {
    if (colCourses.includes(courseName)) {
      setColCourses(colCourses.filter(c => c !== courseName));
    } else {
      setColCourses([...colCourses, courseName]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
      
      {/* 1. PARSING LOADING OVERLAY */}
      {isParsing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-bg/90 backdrop-blur-md p-6">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-bounce">
              <FileUp className="h-7 w-7" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-brand-heading text-lg">Parsing PDF Document</h3>
              <p className="text-xs text-brand-muted truncate" title={pdfFile?.name}>
                Analyzing: <span className="font-semibold text-brand-heading">{pdfFile?.name}</span>
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-brand-muted">Progress</span>
                <span className="text-primary">{parseProgress.percent}%</span>
              </div>
              <div className="h-3 w-full bg-brand-bg border border-brand-border rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${parseProgress.percent}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-brand-bg border border-brand-border rounded-2xl p-3.5 text-center">
                <span className="block text-brand-muted font-medium">Pages Processed</span>
                <span className="text-sm font-extrabold text-brand-heading mt-1 block">
                  {parseProgress.currentPage} / {parseProgress.totalPages}
                </span>
              </div>
              <div className="bg-brand-bg border border-brand-border rounded-2xl p-3.5 text-center">
                <span className="block text-brand-muted font-medium">Time Remaining</span>
                <span className="text-sm font-extrabold text-brand-heading mt-1 block">
                  {parseProgress.etaSeconds > 0 ? `${parseProgress.etaSeconds}s` : 'Calculating...'}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-brand-muted leading-relaxed">
              PDF contents are being extracted locally. This process reads every single page to construct the complete college database.
            </p>
          </div>
        </div>
      )}

      {/* 2. IMPORTING LOADING OVERLAY */}
      {isImporting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-bg/90 backdrop-blur-md p-6">
          <div className="w-full max-w-lg bg-brand-card border border-brand-border rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-brand-border">
              <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
                <Loader className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <h3 className="font-extrabold text-brand-heading text-lg">Importing to Supabase</h3>
                <p className="text-xs text-brand-muted">Saving parsed cutoff records permanently in Supabase.</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-brand-muted">Records Processed</span>
                <span className="text-accent">
                  {importProgress.current.toLocaleString()} / {importProgress.total.toLocaleString()} ({Math.round((importProgress.current / importProgress.total) * 100)}%)
                </span>
              </div>
              <div className="h-3 w-full bg-brand-bg border border-brand-border rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Live Logs Terminal View */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">Live Import Log Console</span>
              <div className="h-44 w-full bg-black/95 text-green-400 font-mono text-[10px] sm:text-xs rounded-2xl p-4 overflow-y-auto space-y-1 border border-brand-border">
                {importLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold select-none">&gt;</span>
                    <span className="break-all">{log}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-brand-muted text-center leading-relaxed">
              Database rows are being saved. Duplicate colleges or branches will be automatically updated with no duplicates created.
            </p>
          </div>
        </div>
      )}
      
      {/* BACK NAVIGATION */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center space-x-1.5 text-xs font-bold text-brand-muted hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      )}

      {/* HEADER */}
      <div className="mb-6 pb-4 border-b border-brand-border flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <img src="/src/assets/logocm.png" alt="CollegeMate Logo" className="h-12 w-auto object-contain shrink-0" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-heading">
              Admin Control Panel
            </h1>
            <p className="mt-1 text-sm text-brand-body">Manage colleges directory, edit cutoffs, and import yearly datasets.</p>
          </div>
        </div>
      </div>

      {/* SUB TAB BAR */}
      <div className="flex space-x-2 mb-6 border-b border-brand-border pb-px">
        {['overview', 'colleges', 'cutoffs', 'import'].map(tab => (
          <button
            key={tab}
            onClick={() => handleSubTabClick(tab)}
            className={`pb-3 px-4 text-sm font-semibold capitalize border-b-2 transition-colors ${
              activeSubTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-brand-muted hover:text-brand-heading'
            }`}
          >
            {tab === 'import' ? 'Data Importer' : tab === 'cutoffs' ? 'Manage Cutoffs' : tab === 'colleges' ? 'Manage Colleges' : 'Overview'}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW VIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-sm text-center">
              <span className="block text-2xl font-extrabold text-primary">{colleges.length}</span>
              <span className="text-[10px] font-bold text-brand-muted uppercase mt-1 block">Total Colleges</span>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-sm text-center">
              <span className="block text-2xl font-extrabold text-accent">{totalBranchesCount}</span>
              <span className="text-[10px] font-bold text-brand-muted uppercase mt-1 block">Total Branches</span>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-sm text-center">
              <span className="block text-2xl font-extrabold text-success">{(cetCount + dseCount).toLocaleString()}</span>
              <span className="text-[10px] font-bold text-brand-muted uppercase mt-1 block">Cutoff Records</span>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-sm text-center">
              <span className="block text-2xl font-extrabold text-warning">{cetCount.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-brand-muted uppercase mt-1 block">CET Records</span>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-sm text-center">
              <span className="block text-2xl font-extrabold text-secondary">{dseCount.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-brand-muted uppercase mt-1 block">DSE Records</span>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-sm text-center">
              <span className="block text-2xl font-extrabold text-info">{registeredStudentsCount}</span>
              <span className="text-[10px] font-bold text-brand-muted uppercase mt-1 block">Students</span>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-sm text-center">
              <span className="block text-2xl font-extrabold text-primary">{predictionsCount}</span>
              <span className="text-[10px] font-bold text-brand-muted uppercase mt-1 block">Predictions</span>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
            <h3 className="font-bold text-brand-heading text-lg mb-4 flex items-center"><BarChart className="h-5 w-5 text-primary mr-1.5" /> Database Summary</h3>
            <p className="text-sm text-brand-body leading-relaxed mb-4">
              The CollegeMate administrative database is fully active and syncs automatically. Administrators can add new engineering institutes, update cutoff percentages directly, or import spreadsheets generated by DTE CAP rounds.
            </p>
            <div className="flex items-start space-x-2 bg-brand-bg rounded-xl p-3.5 text-xs text-brand-body border border-brand-border max-w-2xl">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span>
                **Important Policy**: Cutoff modifications immediately reflect in student search predictions. Always verify Open/OBC category percentages before saving.
              </span>
            </div>
          </div>

          {/* Latest 10 Imports History */}
          <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
            <h3 className="font-bold text-brand-heading text-lg mb-4 flex items-center">
              <Activity className="h-5 w-5 text-primary mr-1.5" /> 
              <span>Latest 10 Datasets Imported</span>
            </h3>
            {importHistory.length === 0 ? (
              <p className="text-xs text-brand-body leading-relaxed">No import records found.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-brand-border">
                <table className="min-w-full divide-y divide-brand-border text-xs text-left">
                  <thead className="bg-brand-bg text-brand-heading font-bold">
                    <tr>
                      <th className="px-4 py-3">File Name</th>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Imported Rows</th>
                      <th className="px-4 py-3">Failed Rows</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Import Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border bg-brand-card text-brand-body">
                    {importHistory.map((imp, idx) => (
                      <tr key={imp.id || idx} className="hover:bg-brand-bg/25">
                        <td className="px-4 py-3 font-semibold text-brand-heading truncate max-w-[200px]" title={imp.file_name}>
                          {imp.file_name}
                        </td>
                        <td className="px-4 py-3">{imp.year}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            imp.upload_status === 'Success' 
                              ? 'bg-success/15 text-success' 
                              : imp.upload_status === 'Failed' 
                              ? 'bg-error/15 text-error' 
                              : 'bg-warning/15 text-warning'
                          }`}>
                            {imp.upload_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-brand-heading">
                          {imp.imported_records?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-brand-muted">
                          {imp.failed_records?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3">{imp.duration ? `${imp.duration}s` : 'N/A'}</td>
                        <td className="px-4 py-3 text-brand-muted">
                          {imp.created_at ? new Date(imp.created_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. COLLEGES CRUD */}
      {activeSubTab === 'colleges' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-body font-semibold">Total Colleges: {colleges.length}</span>
            <button
              onClick={() => { resetCollegeForm(); setCollegeModalOpen(true); }}
              className="flex items-center space-x-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-hover transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add College</span>
            </button>
          </div>

          {/* Table (Responsive: blocks on mobile, table on desktop) */}
          <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-card shadow-sm">
            
            {/* Desktop Table View */}
            <table className="hidden md:table min-w-full divide-y divide-brand-border text-sm">
              <thead className="bg-brand-bg">
                <tr>
                  <th className="px-6 py-3.5 text-left font-bold text-brand-heading">Code</th>
                  <th className="px-6 py-3.5 text-left font-bold text-brand-heading">College Name</th>
                  <th className="px-6 py-3.5 text-left font-bold text-brand-heading">City</th>
                  <th className="px-6 py-3.5 text-left font-bold text-brand-heading">Fees</th>
                  <th className="px-6 py-3.5 text-left font-bold text-brand-heading">Avg Pkg</th>
                  <th className="px-6 py-3.5 text-center font-bold text-brand-heading">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border bg-brand-card">
                {colleges.map((col) => (
                  <tr key={col.id} className="hover:bg-brand-bg/30">
                    <td className="px-6 py-4 font-mono font-bold text-brand-muted">{col.code}</td>
                    <td className="px-6 py-4 font-semibold text-brand-heading truncate max-w-xs">{col.name}</td>
                    <td className="px-6 py-4 text-brand-body">{col.city}</td>
                    <td className="px-6 py-4 text-brand-body">{col.fees ? `₹${col.fees.toLocaleString('en-IN')}` : "Information currently unavailable."}</td>
                    <td className="px-6 py-4 text-brand-body font-bold text-accent">{col.averagePackage ? `${col.averagePackage} LPA` : "Information currently unavailable."}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleEditCollegeClick(col)}
                          className="rounded-lg p-1.5 border border-brand-border hover:bg-brand-bg text-brand-body hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCollegeClick(col.id)}
                          className="rounded-lg p-1.5 border border-brand-border hover:bg-brand-bg text-brand-body hover:text-error transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Block Cards View */}
            <div className="md:hidden divide-y divide-brand-border">
              {colleges.map((col) => (
                <div key={col.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-brand-heading text-sm">{col.name}</h4>
                    <span className="font-mono text-xs text-brand-muted bg-brand-bg px-2 py-0.5 rounded">{col.code}</span>
                  </div>
                  <div className="text-xs text-brand-body space-y-1">
                    <p>City: {col.city}</p>
                    <p>Fees: {col.fees ? `₹${col.fees.toLocaleString('en-IN')}` : "Information currently unavailable."}</p>
                    <p>Avg Placement: <span className="font-bold text-accent">{col.averagePackage ? `${col.averagePackage} LPA` : "Information currently unavailable."}</span></p>
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button 
                      onClick={() => handleEditCollegeClick(col)}
                      className="flex items-center space-x-1 rounded-lg border border-brand-border p-1.5 px-3 text-xs text-brand-body hover:bg-brand-bg hover:text-primary"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteCollegeClick(col.id)}
                      className="flex items-center space-x-1 rounded-lg border border-brand-border p-1.5 px-3 text-xs text-brand-body hover:bg-brand-bg hover:text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 3. CUTOFFS CRUD */}
      {activeSubTab === 'cutoffs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-body font-semibold">Total Cutoff Records: {cutoffs.length}</span>
            <button
              onClick={() => { resetCutoffForm(); setCutoffModalOpen(true); }}
              className="flex items-center space-x-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-hover transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Cutoff</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-card shadow-sm">
            <table className="hidden md:table min-w-full divide-y divide-brand-border text-sm">
              <thead className="bg-brand-bg">
                <tr>
                  <th className="px-6 py-3.5 text-left font-bold text-brand-heading">College</th>
                  <th className="px-6 py-3.5 text-left font-bold text-brand-heading">Branch</th>
                  <th className="px-6 py-3.5 text-left font-bold text-brand-heading">Type</th>
                  <th className="px-6 py-3.5 text-center font-bold text-brand-heading">OPEN</th>
                  <th className="px-6 py-3.5 text-center font-bold text-brand-heading">OBC</th>
                  <th className="px-6 py-3.5 text-center font-bold text-brand-heading">SC</th>
                  <th className="px-6 py-3.5 text-center font-bold text-brand-heading">ST</th>
                  <th className="px-6 py-3.5 text-center font-bold text-brand-heading">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border bg-brand-card">
                {cutoffs.slice(0, 15).map((cut, idx) => {
                  const college = colleges.find(c => c.id === cut.collegeId);
                  return (
                    <tr key={idx} className="hover:bg-brand-bg/30">
                      <td className="px-6 py-4 font-semibold text-brand-heading truncate max-w-xs">{college ? college.name : 'Unknown'}</td>
                      <td className="px-6 py-4 text-brand-body text-xs">{cut.branch}</td>
                      <td className="px-6 py-4 text-brand-body">{cut.admissionType} ({cut.year})</td>
                      <td className="px-6 py-4 text-center font-bold text-brand-heading">{cut.OPEN}</td>
                      <td className="px-6 py-4 text-center text-brand-body">{cut.OBC}</td>
                      <td className="px-6 py-4 text-center text-brand-body">{cut.SC}</td>
                      <td className="px-6 py-4 text-center text-brand-body">{cut.ST}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleEditCutoffClick(cut)}
                            className="rounded-lg p-1.5 border border-brand-border hover:bg-brand-bg text-brand-body hover:text-primary transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCutoffClick(cut)}
                            className="rounded-lg p-1.5 border border-brand-border hover:bg-brand-bg text-brand-body hover:text-error transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Mobile Block list */}
            <div className="md:hidden divide-y divide-brand-border">
              {cutoffs.slice(0, 10).map((cut, idx) => {
                const college = colleges.find(c => c.id === cut.collegeId);
                return (
                  <div key={idx} className="p-4 space-y-1">
                    <h4 className="font-semibold text-brand-heading text-sm">{college?.name || 'Unknown'}</h4>
                    <p className="text-xs text-brand-body">{cut.branch} | {cut.admissionType} ({cut.year})</p>
                    <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-center bg-brand-bg p-2 rounded-xl mt-2">
                      <div><span className="block text-[10px] text-brand-muted">OPEN</span>{cut.OPEN}</div>
                      <div><span className="block text-[10px] text-brand-muted">OBC</span>{cut.OBC}</div>
                      <div><span className="block text-[10px] text-brand-muted">SC</span>{cut.SC}</div>
                      <div><span className="block text-[10px] text-brand-muted">ST</span>{cut.ST}</div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 pt-3">
                      <button onClick={() => handleEditCutoffClick(cut)} className="flex items-center space-x-1 rounded-lg border border-brand-border p-1.5 px-3 text-xs text-brand-body">
                        <Edit className="h-3 w-3" /> <span>Edit</span>
                      </button>
                      <button onClick={() => handleDeleteCutoffClick(cut)} className="flex items-center space-x-1 rounded-lg border border-brand-border p-1.5 px-3 text-xs text-brand-muted hover:text-error">
                        <Trash2 className="h-3 w-3" /> <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {cutoffs.length > 15 && (
            <p className="text-center text-xs text-brand-muted">Showing latest 15 cutoff records. Full database contains {cutoffs.length} rows.</p>
          )}
        </div>
      )}

      {/* 4. PDF BULK DATA IMPORTER */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          
          {/* Importer Segment Selector */}
          <div className="flex border-b border-brand-border pb-px space-x-6">
            <button
              onClick={() => { setImporterType('csv'); setParseError(null); setImportStatus(''); setImportResult(null); }}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                importerType === 'csv'
                  ? 'border-primary text-primary font-extrabold'
                  : 'border-transparent text-brand-muted hover:text-brand-heading'
              }`}
            >
              CSV Dataset Importer 📊 (Primary)
            </button>
            <button
              onClick={() => { setImporterType('pdf'); setParseError(null); setImportStatus(''); setImportResult(null); }}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                importerType === 'pdf'
                  ? 'border-primary text-primary font-extrabold'
                  : 'border-transparent text-brand-muted hover:text-brand-heading'
              }`}
            >
              PDF Document Importer 📄 (Legacy)
            </button>
          </div>

          {/* Detailed Error Boundary Card */}
          {parseError && (
            <div className="rounded-2xl border border-error/20 bg-error/5 p-6 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center space-x-2.5 text-error">
                <ShieldAlert className="h-6 w-6 shrink-0" />
                <h3 className="font-extrabold text-sm sm:text-base">Data Parsing Failed</h3>
              </div>
              <p className="text-xs text-brand-body leading-relaxed">
                An error occurred during local extraction. The system could not read the formatting correctly. Verify the data layout matches the expected columns.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold pt-1">
                <div className="bg-brand-bg border border-brand-border rounded-xl p-3">
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">File Name</span>
                  <span className="text-brand-heading mt-1 block truncate" title={parseError.fileName}>{parseError.fileName}</span>
                </div>
                <div className="bg-brand-bg border border-brand-border rounded-xl p-3">
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">Location info</span>
                  <span className="text-brand-heading mt-1 block">Page / Row {parseError.pageNumber}</span>
                </div>
                <div className="bg-brand-bg border border-brand-border rounded-xl p-3 sm:col-span-2">
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">Error Reason</span>
                  <span className="text-error mt-1 block leading-normal">{parseError.reason}</span>
                </div>
                {parseError.stack && (
                  <div className="bg-brand-bg border border-brand-border rounded-xl p-3 sm:col-span-2">
                    <span className="block text-[10px] text-brand-muted uppercase font-bold mb-1">Stack Trace</span>
                    <pre className="text-brand-muted text-[10px] overflow-auto max-h-48 p-2 bg-black/10 rounded-lg leading-normal font-mono whitespace-pre-wrap">{parseError.stack}</pre>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setParseError(null)}
                  className="rounded-xl border border-brand-border bg-brand-card px-4 py-2 text-xs font-semibold text-brand-heading hover:bg-brand-bg cursor-pointer"
                >
                  Clear Error & Retry
                </button>
              </div>
            </div>
          )}

          {/* CSV IMPORTER SUB-TAB */}
          {importerType === 'csv' && (
            <div className="space-y-6">
              
              {/* Settings and Config Card */}
              <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm space-y-6">
                <h3 className="font-bold text-brand-heading text-lg flex items-center">
                  <FileSpreadsheet className="h-5 w-5 text-primary mr-1.5" />
                  <span>CSV Dataset Importer Settings</span>
                </h3>
                <p className="text-xs sm:text-sm text-brand-body leading-relaxed">
                  Import highly structured CSV data directly. Set target Year, CAP Round, Admission Type, and import modes below. Max file size: <strong>100MB</strong>.
                </p>

                {/* Import parameters form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">Target Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-bg p-2.5 text-brand-heading focus:border-primary focus:outline-none"
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">CAP Round</label>
                    <select
                      value={selectedRound}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-bg p-2.5 text-brand-heading focus:border-primary focus:outline-none"
                    >
                      <option value="CAP1">CAP Round 1</option>
                      <option value="CAP2">CAP Round 2</option>
                      <option value="CAP3">CAP Round 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">Admission Type</label>
                    <select
                      value={selectedAdmissionType}
                      onChange={(e) => setSelectedAdmissionType(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-bg p-2.5 text-brand-heading focus:border-primary focus:outline-none"
                    >
                      <option value="FIRST_YEAR_ENGINEERING">First Year Engineering (CET)</option>
                      <option value="DIRECT_SECOND_YEAR_ENGINEERING">Direct Second Year (DSE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">Import Mode</label>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-bg p-2.5 text-brand-heading focus:border-primary focus:outline-none font-bold"
                    >
                      <option value="dryrun">🔬 Dry Run (Validate Only)</option>
                      <option value="append">➕ Append Mode (Insert Missing)</option>
                      <option value="replace">🔄 Replace Existing Data</option>
                    </select>
                  </div>
                </div>

                {/* File Dropzone */}
                <div className="w-full pt-2">
                  <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">Upload CSV Dataset</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-brand-border hover:border-primary/50 bg-brand-bg hover:bg-brand-bg/50 rounded-xl px-4 py-6 cursor-pointer transition-colors w-full">
                    <Upload className="h-6 w-6 text-brand-muted mb-2 animate-pulse" />
                    <span className="text-xs font-semibold text-brand-heading">
                      {csvFile ? csvFile.name : "Click to select CAP Round CSV file"}
                    </span>
                    <span className="text-[10px] text-brand-muted mt-1">Supports flat CSVs or pivoted wide spreadsheets up to 100MB.</span>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCSVFileChange} 
                      className="hidden" 
                      disabled={isParsing || isImporting}
                    />
                  </label>
                </div>
              </div>

              {/* Status updates */}
              {importStatus && (
                <div className={`flex items-center space-x-2 rounded-xl p-3.5 text-xs border ${
                  importStatus.toLowerCase().includes('success') 
                    ? 'bg-success/10 text-success border-success/20' 
                    : importStatus.toLowerCase().includes('failed') || importStatus.toLowerCase().includes('error')
                    ? 'bg-error/10 text-error border-error/20'
                    : 'bg-primary/10 text-primary border-primary/20'
                }`}>
                  {isImporting || isParsing ? (
                    <Loader className="h-4.5 w-4.5 animate-spin shrink-0 text-primary" />
                  ) : (
                    <CheckCircle className="h-4.5 w-4.5 shrink-0 text-success" />
                  )}
                  <span className="font-semibold">{importStatus}</span>
                </div>
              )}

              {/* CSV Parsing stats & summary report */}
              {csvStats && (
                <div className="rounded-2xl border border-brand-border bg-brand-card p-5 space-y-4">
                  <h4 className="text-xs font-bold text-brand-heading uppercase tracking-wider">CSV Validation & Parsing Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                    <div className="rounded-xl bg-brand-bg border border-brand-border p-3">
                      <span className="block text-xl font-extrabold text-brand-heading">{csvStats.totalRows.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Total Rows</span>
                    </div>
                    <div className="rounded-xl bg-brand-bg border border-brand-border p-3">
                      <span className="block text-xl font-extrabold text-success">{csvStats.validRows.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Valid Rows</span>
                    </div>
                    <div className="rounded-xl bg-brand-bg border border-brand-border p-3">
                      <span className="block text-xl font-extrabold text-error">{csvStats.invalidRows.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Invalid Rows</span>
                    </div>
                    <div className="rounded-xl bg-brand-bg border border-brand-border p-3">
                      <span className="block text-xl font-extrabold text-warning">{csvStats.duplicateRows.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Duplicates</span>
                    </div>
                    <div className="rounded-xl bg-brand-bg border border-brand-border p-3">
                      <span className="block text-xl font-extrabold text-info">{csvStats.speedRowsPerSecond.toLocaleString()}/s</span>
                      <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Parse Speed</span>
                    </div>
                    <div className="rounded-xl bg-brand-bg border border-brand-border p-3">
                      <span className="block text-xl font-extrabold text-primary">{csvStats.durationSeconds}s</span>
                      <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Duration</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Column Mapping Matrix */}
              {csvFile && csvHeaders.length > 0 && (
                <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm space-y-6 animate-fade-in">
                  <h3 className="font-bold text-brand-heading text-sm uppercase tracking-wider flex items-center">
                    <SlidersHorizontal className="h-4.5 w-4.5 text-primary mr-1.5" />
                    <span>CSV Header Mapping Matrix</span>
                  </h3>
                  <p className="text-xs text-brand-body leading-relaxed">
                    Map each database target field to the corresponding column header in your CSV file. Unmapped fields will use default fallbacks.
                  </p>

                  {/* Layout selector */}
                  <div className="flex border border-brand-border rounded-xl p-1 bg-brand-bg w-max text-xs font-bold mb-4">
                    <button
                      type="button"
                      onClick={() => setCsvLayout('flat')}
                      className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                        csvLayout === 'flat' ? 'bg-primary text-white shadow-sm' : 'text-brand-muted'
                      }`}
                    >
                      Flat Layout (Single Category Column)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCsvLayout('pivoted')}
                      className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                        csvLayout === 'pivoted' ? 'bg-primary text-white shadow-sm' : 'text-brand-muted'
                      }`}
                    >
                      Pivoted Layout (Multi-Category Columns)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                    <div>
                      <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">College Code *</label>
                      <select
                        value={columnMappings.collegeCode || ""}
                        onChange={(e) => setColumnMappings(prev => ({ ...prev, collegeCode: e.target.value }))}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg p-2 text-brand-heading focus:outline-none"
                      >
                        <option value="">-- Choose Header --</option>
                        {csvHeaders.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">College Name *</label>
                      <select
                        value={columnMappings.collegeName || ""}
                        onChange={(e) => setColumnMappings(prev => ({ ...prev, collegeName: e.target.value }))}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg p-2 text-brand-heading focus:outline-none"
                      >
                        <option value="">-- Choose Header --</option>
                        {csvHeaders.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">Choice Code / Option Code</label>
                      <select
                        value={columnMappings.choiceCode || ""}
                        onChange={(e) => setColumnMappings(prev => ({ ...prev, choiceCode: e.target.value }))}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg p-2 text-brand-heading focus:outline-none"
                      >
                        <option value="">-- Choose Header --</option>
                        {csvHeaders.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">Branch Name *</label>
                      <select
                        value={columnMappings.branchName || ""}
                        onChange={(e) => setColumnMappings(prev => ({ ...prev, branchName: e.target.value }))}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg p-2 text-brand-heading focus:outline-none"
                      >
                        <option value="">-- Choose Header --</option>
                        {csvHeaders.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">City / District</label>
                      <select
                        value={columnMappings.city || ""}
                        onChange={(e) => setColumnMappings(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg p-2 text-brand-heading focus:outline-none"
                      >
                        <option value="">-- Choose Header --</option>
                        {csvHeaders.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">University</label>
                      <select
                        value={columnMappings.university || ""}
                        onChange={(e) => setColumnMappings(prev => ({ ...prev, university: e.target.value }))}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg p-2 text-brand-heading focus:outline-none"
                      >
                        <option value="">-- Choose Header --</option>
                        {csvHeaders.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">College Type (Govt/Pvt)</label>
                      <select
                        value={columnMappings.type || ""}
                        onChange={(e) => setColumnMappings(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg p-2 text-brand-heading focus:outline-none"
                      >
                        <option value="">-- Choose Header --</option>
                        {csvHeaders.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {csvLayout === 'flat' && (
                      <>
                        <div>
                          <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">Category Name *</label>
                          <select
                            value={columnMappings.category || ""}
                            onChange={(e) => setColumnMappings(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full rounded-xl border border-brand-border bg-brand-bg p-2 text-brand-heading focus:outline-none"
                          >
                            <option value="">-- Choose Header --</option>
                            {csvHeaders.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">Percentile / Score Column *</label>
                          <select
                            value={columnMappings.percentile || ""}
                            onChange={(e) => setColumnMappings(prev => ({ ...prev, percentile: e.target.value }))}
                            className="w-full rounded-xl border border-brand-border bg-brand-bg p-2 text-brand-heading focus:outline-none"
                          >
                            <option value="">-- Choose Header --</option>
                            {csvHeaders.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-[10px] text-brand-muted uppercase font-bold mb-1.5">Merit Rank Column</label>
                      <select
                        value={columnMappings.rank || ""}
                        onChange={(e) => setColumnMappings(prev => ({ ...prev, rank: e.target.value }))}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg p-2 text-brand-heading focus:outline-none"
                      >
                        <option value="">-- Choose Header --</option>
                        {csvHeaders.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Pivoted Mode Columns checklist */}
                  {csvLayout === 'pivoted' && (
                    <div className="pt-4 border-t border-brand-border/40 mt-4 space-y-3 text-left">
                      <label className="block text-[10px] text-brand-muted uppercase font-bold">Select Category Score Columns (Pivoted)</label>
                      <p className="text-[10px] text-brand-muted mb-2">Check the CSV column headers that contain category percentiles (e.g. OPEN, OBC, EWS):</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {csvHeaders.map((hdr, idx) => {
                          const isChecked = pivotedCategoryColumns.includes(hdr);
                          return (
                            <label key={idx} className="flex items-center space-x-2 p-2 border border-brand-border rounded-xl bg-brand-bg cursor-pointer hover:bg-brand-card select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPivotedCategoryColumns(prev => [...prev, hdr]);
                                  } else {
                                    setPivotedCategoryColumns(prev => prev.filter(x => x !== hdr));
                                  }
                                }}
                                className="rounded text-primary focus:ring-primary"
                              />
                              <span className="text-[10px] font-bold text-brand-heading truncate" title={hdr}>{hdr}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CSV Preview */}
                  {csvPreviewRows.length > 0 && (
                    <div className="pt-6 border-t border-brand-border/40 mt-6 space-y-3">
                      <h4 className="text-xs font-bold text-brand-heading uppercase tracking-wider flex items-center">
                        <FileText className="h-4.5 w-4.5 text-accent mr-1.5" />
                        <span>Parsed CSV Rows Preview (First 100 lines)</span>
                      </h4>
                      <div className="overflow-x-auto max-h-64 border border-brand-border rounded-xl">
                        <table className="min-w-full divide-y divide-brand-border text-[10px] text-left">
                          <thead className="bg-brand-bg text-brand-heading font-bold sticky top-0">
                            <tr>
                              {csvHeaders.map((hdr, idx) => (
                                <th key={idx} className="px-3 py-2 bg-brand-bg truncate max-w-[120px]" title={hdr}>{hdr}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border bg-brand-card text-brand-body">
                            {csvPreviewRows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-brand-bg/25">
                                {row.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="px-3 py-2 truncate max-w-[120px]" title={cell}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-brand-border/40">
                    <button
                      type="button"
                      onClick={() => { setCsvFile(null); setCsvPreviewRows([]); setCsvHeaders([]); setCsvStats(null); }}
                      className="rounded-xl border border-brand-border px-5 py-2.5 text-xs font-bold text-brand-body hover:bg-brand-bg cursor-pointer"
                      disabled={isParsing || isImporting}
                    >
                      Clear File
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCSVImportSubmit}
                      className="flex items-center space-x-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-hover transition-all cursor-pointer"
                      disabled={isParsing || isImporting || (csvLayout === 'pivoted' && pivotedCategoryColumns.length === 0)}
                    >
                      {isParsing ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Validating CSV...</span>
                        </>
                      ) : isImporting ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Uploading Chunks...</span>
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>{importMode === 'dryrun' ? 'Validate CSV (Dry Run)' : 'Start CSV Import Pipeline'}</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* PDF IMPORTER SUB-TAB (LEGACY) */}
          {importerType === 'pdf' && (
            <div className="space-y-6">
              
              {/* Main Uploader Box */}
              <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
                <h3 className="font-bold text-brand-heading text-lg mb-2 flex items-center">
                  <Upload className="h-5 w-5 text-primary mr-1.5" />
                  <span>Legacy Cutoff PDF Document Importer</span>
                </h3>
                <p className="text-xs sm:text-sm text-brand-body leading-relaxed mb-6">
                  Upload a DTE CAP round cutoff PDF (e.g. <em>2024ENGG_CAP1_CutOff.pdf</em> or <em>DSE_CAP1_CutOff_2025_26.pdf</em>) to parse and insert the real records directly into the database.
                </p>

                {importStatus && (
                  <div className={`mb-6 flex items-center space-x-2 rounded-xl p-3.5 text-xs border ${
                    importStatus.toLowerCase().includes('success') 
                      ? 'bg-success/10 text-success border-success/20' 
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {isImporting ? (
                      <Loader className="h-4.5 w-4.5 animate-spin shrink-0 text-primary" />
                    ) : (
                      <CheckCircle className="h-4.5 w-4.5 shrink-0 text-success" />
                    )}
                    <span className="font-semibold">{importStatus}</span>
                  </div>
                )}

                {/* Importer Controls Form */}
                <div className="w-full">
                  <label className="block text-xs font-bold text-brand-body uppercase tracking-wider mb-2">Select Cutoff PDF File</label>
                  <div className="w-full">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-brand-border hover:border-primary/50 bg-brand-bg hover:bg-brand-bg/50 rounded-xl px-4 py-6 cursor-pointer transition-colors w-full">
                      <FileUp className="h-6 w-6 text-brand-muted mb-2 animate-pulse" />
                      <span className="text-xs font-semibold text-brand-heading">{pdfFile ? pdfFile.name : "Click to select CAP round PDF document"}</span>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleFileChange} 
                        className="hidden" 
                        disabled={isParsing || isImporting}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  {pdfFile && (
                    <button
                      onClick={() => { setParsedResult(null); setPdfFile(null); }}
                      className="rounded-xl border border-brand-border px-5 py-2.5 text-xs font-bold text-brand-body hover:bg-brand-bg cursor-pointer"
                      disabled={isParsing || isImporting}
                    >
                      Cancel
                    </button>
                  )}
                  
                  <button
                    onClick={handleParsePDF}
                    className="flex items-center space-x-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-hover transition-all cursor-pointer disabled:opacity-50"
                    disabled={!pdfFile || isParsing || isImporting}
                  >
                    {isParsing ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Parsing PDF...</span>
                      </>
                    ) : isImporting ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Importing to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Parse & Import PDF</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Validation & Preview Section */}
              {parsedResult && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Validation Summary */}
                  <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
                    <h3 className="font-bold text-brand-heading text-sm uppercase tracking-wider mb-4 flex items-center">
                      <SlidersHorizontal className="h-4.5 w-4.5 text-primary mr-1.5" />
                      <span>Validation Matrix & Document Summary</span>
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="rounded-xl bg-brand-bg border border-brand-border p-3.5">
                        <span className="block text-[10px] font-bold text-brand-muted uppercase">Admission Type</span>
                        <span className="text-xs font-bold text-brand-heading mt-0.5 block truncate">
                          {parsedResult.admissionType === 'CET' ? 'First Year CET' : 'Direct Second Year DSE'}
                        </span>
                      </div>
                      <div className="rounded-xl bg-brand-bg border border-brand-border p-3.5">
                        <span className="block text-[10px] font-bold text-brand-muted uppercase">Total Pages</span>
                        <span className="text-xs font-bold text-brand-heading mt-0.5 block">{parsedResult.totalPages} Pages</span>
                      </div>
                      <div className="rounded-xl bg-brand-bg border border-brand-border p-3.5">
                        <span className="block text-[10px] font-bold text-primary uppercase">Total Colleges</span>
                        <span className="text-xs font-bold text-brand-heading mt-0.5 block">
                          {new Set(parsedResult.records.map(r => r.collegeCode)).size} Colleges
                        </span>
                      </div>
                      <div className="rounded-xl bg-brand-bg border border-brand-border p-3.5">
                        <span className="block text-[10px] font-bold text-accent uppercase">Total Branches</span>
                        <span className="text-xs font-bold text-brand-heading mt-0.5 block">
                          {new Set(parsedResult.records.map(r => r.choiceCode)).size} Branches
                        </span>
                      </div>
                      <div className="rounded-xl bg-brand-bg border border-brand-border p-3.5">
                        <span className="block text-[10px] font-bold text-success uppercase">Total Records</span>
                        <span className="text-xs font-bold text-brand-heading mt-0.5 block">{parsedResult.records.length.toLocaleString()} Rows</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {validationErrors.map((err, idx) => (
                        <div key={idx} className={`flex items-start space-x-2 text-xs p-3 rounded-xl border ${
                          err.toLowerCase().includes('success') 
                            ? 'bg-success/5 border-success/15 text-success' 
                            : (err.toLowerCase().includes('warning') || err.toLowerCase().includes('notice'))
                            ? 'bg-warning/5 border-warning/15 text-warning'
                            : 'bg-primary/5 border-primary/15 text-primary'
                        }`}>
                          {err.toLowerCase().includes('success') ? (
                            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                          )}
                          <span className="font-semibold">{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Records Preview Table */}
                  <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm overflow-hidden">
                    <h3 className="font-bold text-brand-heading text-sm uppercase tracking-wider mb-4 flex items-center">
                      <FileText className="h-4.5 w-4.5 text-accent mr-1.5" />
                      <span>Parsed Cutoffs Preview (Showing first 100 rows)</span>
                    </h3>
                    
                    <div className="overflow-y-auto max-h-96 rounded-xl border border-brand-border">
                      <table className="min-w-full divide-y divide-brand-border text-xs">
                        <thead className="bg-brand-bg text-brand-heading font-bold sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2.5 text-left bg-brand-bg">Code</th>
                            <th className="px-4 py-2.5 text-left bg-brand-bg">College Name</th>
                            <th className="px-4 py-2.5 text-left bg-brand-bg">Choice Code</th>
                            <th className="px-4 py-2.5 text-left bg-brand-bg">Branch</th>
                            <th className="px-4 py-2.5 text-center bg-brand-bg">Category</th>
                            <th className="px-4 py-2.5 text-center bg-brand-bg">Percentile</th>
                            <th className="px-4 py-2.5 text-center bg-brand-bg">Merit Rank</th>
                            <th className="px-4 py-2.5 text-center bg-brand-bg">Round</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border bg-brand-card text-brand-body">
                          {parsedResult.records.slice(0, 100).map((row, idx) => (
                            <tr key={idx} className="hover:bg-brand-bg/25">
                              <td className="px-4 py-2.5 font-bold text-brand-heading">{row.collegeCode}</td>
                              <td className="px-4 py-2.5 truncate max-w-[180px]" title={row.collegeName}>{row.collegeName}</td>
                              <td className="px-4 py-2.5 font-mono">{row.choiceCode}</td>
                              <td className="px-4 py-2.5 truncate max-w-[150px]" title={row.branchName}>{row.branchName}</td>
                              <td className="px-4 py-2.5 text-center font-semibold text-brand-heading">{row.category}</td>
                              <td className="px-4 py-2.5 text-center font-bold text-primary">{row.percentile}%</td>
                              <td className="px-4 py-2.5 text-center font-bold text-accent">#{row.rank ? row.rank.toLocaleString() : 'N/A'}</td>
                              <td className="px-4 py-2.5 text-center">{row.round}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* Bulk Import Results Console (Common for both) */}
          {importResult && (
            <div className={`rounded-2xl p-5 space-y-4 border ${
              importResult.status === 'Failed' 
                ? 'bg-error/5 border-error/15' 
                : 'bg-success/5 border-success/15'
            }`}>
              {importResult.status === 'Failed' ? (
                <div className="flex items-center space-x-2 text-error font-bold">
                  <AlertTriangle className="h-5 w-5" />
                  <span>IMPORT FAILED - Verification Check Unsuccessful</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-success font-bold">
                  <CheckCircle className="h-5 w-5" />
                  <span>Bulk Import Completed Successfully!</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="rounded-xl bg-brand-bg border border-brand-border p-3">
                  <span className="block text-xl font-extrabold text-brand-heading">{importResult.processed.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Processed</span>
                </div>
                <div className="rounded-xl bg-brand-bg border border-brand-border p-3">
                  <span className="block text-xl font-extrabold text-success">{importResult.inserted.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Imported Colleges</span>
                </div>
                <div className="rounded-xl bg-brand-bg border border-brand-border p-3">
                  <span className="block text-xl font-extrabold text-accent">{importResult.cutoffCount.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Imported Cutoffs</span>
                </div>
                <div className="rounded-xl bg-brand-bg border border-brand-border p-3">
                  <span className="block text-xl font-extrabold text-error">{importResult.failed.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Failed / Skipped</span>
                </div>
              </div>

              {importResult.verificationCounts && (
                <div className="pt-4 border-t border-brand-border/40 mt-4 space-y-3">
                  <h4 className="text-xs font-bold text-brand-heading uppercase tracking-wider text-left">Supabase Database Verification Counts</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-brand-bg border border-brand-border rounded-xl p-3">
                      <span className="block text-lg font-extrabold text-brand-heading">{importResult.verificationCounts.colleges}</span>
                      <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Colleges Count</span>
                    </div>
                    <div className="bg-brand-bg border border-brand-border rounded-xl p-3">
                      <span className="block text-lg font-extrabold text-brand-heading">{importResult.verificationCounts.branches}</span>
                      <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Branches Count</span>
                    </div>
                    <div className="bg-brand-bg border border-brand-border rounded-xl p-3">
                      <span className="block text-lg font-extrabold text-brand-heading">{importResult.verificationCounts.cutoffs}</span>
                      <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Cutoffs Count</span>
                    </div>
                  </div>
                </div>
              )}

              {importResult.durationSeconds && (
                <div className="text-xs text-brand-muted text-left">
                  Import Duration: <span className="font-semibold text-brand-heading">{importResult.durationSeconds} seconds</span>
                </div>
              )}

              {/* Import Log console */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider text-left">Transaction Logs</span>
                <div className="h-32 w-full bg-black/95 text-green-400 font-mono text-xs rounded-xl p-3 overflow-y-auto space-y-0.5 border border-brand-border text-left">
                  {importResult.logs.map((log, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-green-600 mr-2 font-bold select-none">&gt;</span>
                      <span className="break-all">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* --- COLLEGE CRUD MODAL --- */}
      {collegeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-brand-border bg-brand-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-3 border-b border-brand-border mb-4">
              <h3 className="font-bold text-brand-heading text-lg">
                {editingCollege ? 'Edit College Details' : 'Add New College'}
              </h3>
              <button 
                onClick={() => setCollegeModalOpen(false)}
                className="rounded-xl border border-brand-border p-1.5 text-brand-muted hover:text-brand-heading hover:bg-brand-bg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCollege} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-brand-heading mb-1">College Name</label>
                  <input
                    type="text"
                    required
                    placeholder="COEP Technological University"
                    value={colName}
                    onChange={(e) => setColName(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-brand-heading mb-1">College DTE Code</label>
                  <input
                    type="text"
                    required
                    placeholder="6006"
                    value={colCode}
                    onChange={(e) => setColCode(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-brand-heading mb-1">City</label>
                  <select
                    value={colCity}
                    onChange={(e) => setColCity(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none"
                  >
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-brand-heading mb-1">University</label>
                  <select
                    value={colUniv}
                    onChange={(e) => setColUniv(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none"
                  >
                    {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-brand-heading mb-1">Type</label>
                  <select
                    value={colType}
                    onChange={(e) => setColType(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none"
                  >
                    <option value="Government Autonomous">Government Autonomous</option>
                    <option value="Government Aided">Government Aided</option>
                    <option value="Private Autonomous">Private Autonomous</option>
                    <option value="Private Unaided">Private Unaided</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-medium text-brand-heading mb-1">Tuition Fees (Annual)</label>
                  <input
                    type="number"
                    required
                    placeholder="125000"
                    value={colFees}
                    onChange={(e) => setColFees(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-brand-heading mb-1">Average Pkg (LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="6.5"
                    value={colAvgPkg}
                    onChange={(e) => setColAvgPkg(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-brand-heading mb-1">Highest Pkg (LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="25.0"
                    value={colHighPkg}
                    onChange={(e) => setColHighPkg(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-brand-heading mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://pict.edu"
                    value={colWeb}
                    onChange={(e) => setColWeb(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Courses offered checkboxes */}
              <div>
                <label className="block font-medium text-brand-heading mb-1.5">Courses/Branches Offered</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-brand-bg p-3 rounded-xl border border-brand-border">
                  {BRANCHES.map(b => (
                    <label key={b.code} className="flex items-center space-x-2 text-xs text-brand-body cursor-pointer">
                      <input
                        type="checkbox"
                        checked={colCourses.includes(b.name)}
                        onChange={() => handleCourseCheckbox(b.name)}
                        className="rounded border-brand-border text-primary focus:ring-primary"
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Facilities checkboxes */}
              <div>
                <label className="block font-medium text-brand-heading mb-1.5">Facilities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-brand-bg p-3 rounded-xl border border-brand-border">
                  {["Hostel", "Gym", "Library", "Wifi", "Sports Complex", "Research Labs", "AC Classrooms"].map(fac => (
                    <label key={fac} className="flex items-center space-x-2 text-xs text-brand-body cursor-pointer">
                      <input
                        type="checkbox"
                        checked={colFacilities.includes(fac)}
                        onChange={() => handleFacilityCheckbox(fac)}
                        className="rounded border-brand-border text-primary focus:ring-primary"
                      />
                      <span>{fac}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCollegeModalOpen(false)}
                  className="rounded-xl border border-brand-border px-4 py-2 font-semibold text-brand-body hover:bg-brand-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-hover shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CUTOFF CRUD MODAL --- */}
      {cutoffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-brand-border bg-brand-card p-6 shadow-xl">
            
            <div className="flex items-start justify-between pb-3 border-b border-brand-border mb-4">
              <h3 className="font-bold text-brand-heading text-lg">
                {editingCutoff ? 'Edit Cutoff Record' : 'Add Cutoff Record'}
              </h3>
              <button 
                onClick={() => setCutoffModalOpen(false)}
                className="rounded-xl border border-brand-border p-1.5 text-brand-muted hover:text-brand-heading hover:bg-brand-bg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCutoff} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-brand-heading mb-1">Target College</label>
                <select
                  disabled={!!editingCutoff}
                  value={cutColId}
                  onChange={(e) => setCutColId(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none"
                >
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-brand-heading mb-1">Branch</label>
                  <select
                    disabled={!!editingCutoff}
                    value={cutBranch}
                    onChange={(e) => setCutBranch(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none"
                  >
                    {BRANCHES.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-brand-heading mb-1">Admission Type & Year</label>
                  <div className="flex space-x-2">
                    <select
                      disabled={!!editingCutoff}
                      value={cutType}
                      onChange={(e) => setCutType(e.target.value)}
                      className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none"
                    >
                      <option value="CET">CET</option>
                      <option value="DSE">DSE</option>
                    </select>
                    <select
                      disabled={!!editingCutoff}
                      value={cutYear}
                      onChange={(e) => setCutYear(e.target.value)}
                      className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none"
                    >
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-brand-bg p-4 rounded-xl border border-brand-border">
                <div>
                  <label className="block text-xs font-semibold text-brand-body mb-1">OPEN</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cutOpen}
                    onChange={(e) => setCutOpen(e.target.value)}
                    className="block h-9 w-full rounded-lg border border-brand-border bg-brand-card px-2 text-brand-heading focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-body mb-1">OBC</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cutObc}
                    onChange={(e) => setCutObc(e.target.value)}
                    className="block h-9 w-full rounded-lg border border-brand-border bg-brand-card px-2 text-brand-heading focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-body mb-1">SC</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cutSc}
                    onChange={(e) => setCutSc(e.target.value)}
                    className="block h-9 w-full rounded-lg border border-brand-border bg-brand-card px-2 text-brand-heading focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-body mb-1">ST</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cutSt}
                    onChange={(e) => setCutSt(e.target.value)}
                    className="block h-9 w-full rounded-lg border border-brand-border bg-brand-card px-2 text-brand-heading focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCutoffModalOpen(false)}
                  className="rounded-xl border border-brand-border px-4 py-2 font-semibold text-brand-body hover:bg-brand-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-hover shadow-sm"
                >
                  Save Cutoff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
