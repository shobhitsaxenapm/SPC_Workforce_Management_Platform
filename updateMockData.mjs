import fs from 'fs';
let content = fs.readFileSync('src/data/mockData.ts', 'utf-8');

// Replace mockRequirements with mockProjects
content = content.replace(/export const mockRequirements: Project\[\] = \[/g, "export const mockProjects: Project[] = [");
content = content.replace(/ClientRequirement/g, 'Project');
content = content.replace(/activeRequirementsCount/g, 'activeProjectsCount');

// Update project codes from REQ- to PRJ-
content = content.replace(/code: 'REQ-(\d+-\d+)'/g, "code: 'PRJ-$1'");

// Replace project fields
content = content.replace(/title: '(.*)',\n\s+projectName: '(.*)',/g, "projectName: '$1', // mapped from title\n    engagementType: 'Direct Recruitment',");
content = content.replace(/positionsFilled: \d+,\n\s+/g, "");
content = content.replace(/priority: '.*',\n\s+/g, "");
content = content.replace(/assignedRecruiterId: '.*',\n\s+/g, "");
content = content.replace(/lifecycleStatus: 'Open'/g, "status: 'Active'");

// Update jobs and apps
content = content.replace(/requirementId:/g, "projectId:");

// Insert engagement type into mockJobs
content = content.replace(/filled: (\d+),/g, "filled: $1,\n    engagementType: 'Direct Recruitment',");

fs.writeFileSync('src/data/mockData.ts', content);
