const fs = require('fs');
const content = fs.readFileSync('src/data/mockData.ts', 'utf8');

// Find the start and end of mockCandidates array
const startMarker = 'export const mockCandidates: Candidate[] = [';
const startIndex = content.indexOf(startMarker);
const endMarker = '];\n\nexport const mockApplications';
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find mockCandidates block.");
  process.exit(1);
}

const mockCandidatesStr = content.substring(startIndex, endIndex + 1);

// A simple regex approach won't parse it as JSON since it's TS objects.
// But we can just replace the whole block with hardcoded enriched data.
