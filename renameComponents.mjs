import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/components/ProjectsList.tsx',
  'src/components/ProjectDetail.tsx',
  'src/components/ProjectQuickViewModal.tsx',
  'src/components/ProjectFormModal.tsx',
  'src/components/LinkProjectModal.tsx',
  'src/components/SmartProjectUpload.tsx',
  'src/components/SmartProjectReview.tsx',
  'src/lib/smartProject.test.ts',
  'src/components/ClientDetail.tsx',
  'src/components/ClientDetailDrawer.tsx',
  'src/components/Dashboard.tsx',
  'src/components/JobDetail.tsx',
  'src/components/JobFormModal.tsx',
  'src/components/JobsList.tsx',
  'src/components/CandidateDetail.tsx',
  'src/components/CandidatesList.tsx',
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Replace component imports
    content = content.replace(/RequirementsList/g, 'ProjectsList');
    content = content.replace(/RequirementDetail/g, 'ProjectDetail');
    content = content.replace(/RequirementQuickViewModal/g, 'ProjectQuickViewModal');
    content = content.replace(/ClientRequirementFormModal/g, 'ProjectFormModal');
    content = content.replace(/LinkRequirementModal/g, 'LinkProjectModal');
    content = content.replace(/SmartRequirementUpload/g, 'SmartProjectUpload');
    content = content.replace(/SmartRequirementReview/g, 'SmartProjectReview');
    content = content.replace(/smartRequirement/g, 'smartProject');

    // Context changes
    content = content.replace(/requirements\./g, 'projects.');
    content = content.replace(/requirements,/g, 'projects,');
    content = content.replace(/requirements\.map/g, 'projects.map');
    content = content.replace(/requirements\.filter/g, 'projects.filter');
    content = content.replace(/requirements\.find/g, 'projects.find');
    content = content.replace(/requirements\.reduce/g, 'projects.reduce');
    content = content.replace(/requirements\.length/g, 'projects.length');
    content = content.replace(/setRequirements/g, 'setProjects');
    
    content = content.replace(/quickViewRequirementId/g, 'quickViewProjectId');
    content = content.replace(/setQuickViewRequirementId/g, 'setQuickViewProjectId');
    content = content.replace(/deleteRequirement/g, 'deleteProject');
    content = content.replace(/createRequirement/g, 'createProject');
    content = content.replace(/updateRequirementLifecycle/g, 'updateProjectStatus');
    content = content.replace(/updateRequirement/g, 'updateProject');

    content = content.replace(/requirementId/g, 'projectId');
    
    // Type and object renames
    content = content.replace(/ClientRequirement/g, 'Project');
    content = content.replace(/RequirementLifecycleStatus/g, 'ProjectStatus');
    
    // Specific variable renames
    content = content.replace(/clientReqs/g, 'clientProjects');

    fs.writeFileSync(file, content);
  }
});
