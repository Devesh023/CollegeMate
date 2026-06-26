// CSV Parser and Validator Service - CollegeMate
// Memory-efficient, single-pass scanner for large CSV files (up to 100MB)

/**
 * Parses CSV text into an array of string arrays.
 * Handles double-quotes, commas inside cells, escaped quotes (""), and multiple newline formats.
 */
export function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const c = text[i];
    
    if (c === '"') {
      if (inQuotes && i + 1 < len && text[i + 1] === '"') {
        row[row.length - 1] += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && i + 1 < len && text[i + 1] === '\n') {
        i++;
      }
      if (row.length > 1 || row[0] !== "") {
        lines.push(row);
      }
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }

  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }

  return lines;
}

/**
 * Automatically detects column mappings from headers.
 * Looks for common variations of database fields.
 */
export function detectColumns(headers) {
  const findMatch = (patterns) => {
    return headers.find(h => patterns.some(p => p.test(h.trim()))) || "";
  };

  return {
    collegeCode: findMatch([/college.*code/i, /inst.*code/i, /^code$/i, /col.*code/i, /clg.*code/i, /^id$/i]),
    collegeName: findMatch([/college.*name/i, /collegename/i, /inst.*name/i, /^name$/i, /institute/i]),
    city: findMatch([/city/i, /district/i, /location/i, /town/i]),
    university: findMatch([/university/i, /univ/i]),
    type: findMatch([/type/i, /status/i, /govt.*pvt/i, /autonomous/i]),
    choiceCode: findMatch([/choice.*code/i, /option.*code/i, /choicecode/i]),
    branchName: findMatch([/branch.*name/i, /branch/i, /course/i, /specialization/i, /subject/i]),
    category: findMatch([/category/i, /seat.*type/i, /caste/i, /seat/i]),
    percentile: findMatch([/percentile/i, /score/i, /marks/i, /percent/i, /percentage/i, /cutoff/i]),
    rank: findMatch([/rank/i, /merit/i, /serial/i]),
    year: findMatch([/year/i]),
    round: findMatch([/round/i])
  };
}

/**
 * Validates a mapped row to ensure all required fields are present.
 */
export function validateCSVRow(mappedRow) {
  const errors = [];

  if (!mappedRow.collegeCode || !mappedRow.collegeCode.trim()) {
    errors.push("College Code is required");
  }
  if (!mappedRow.collegeName || !mappedRow.collegeName.trim()) {
    errors.push("College Name is required");
  }
  if (!mappedRow.branchName || !mappedRow.branchName.trim()) {
    errors.push("Branch Name is required");
  }
  if (!mappedRow.category || !mappedRow.category.trim()) {
    errors.push("Category is required");
  }
  if (mappedRow.percentile === undefined || mappedRow.percentile === null || isNaN(parseFloat(mappedRow.percentile))) {
    errors.push("Percentile score is required and must be a valid number");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
