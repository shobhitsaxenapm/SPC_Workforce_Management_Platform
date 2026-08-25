import fs from 'fs';
let content = fs.readFileSync('src/data/mockData.ts', 'utf-8');

// Add engagementType to mockProjects
content = content.replace(/projectName: '(.*)', \/\/ mapped from title/g, "projectName: '$1', // mapped from title\n    engagementType: 'Direct Recruitment',");

fs.writeFileSync('src/data/mockData.ts', content);
