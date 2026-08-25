import fs from 'fs';

const filesToUpdate = [
  'src/components/ProjectsList.tsx',
  'src/components/ProjectDetail.tsx',
  'src/components/ProjectQuickViewModal.tsx',
  'src/components/ProjectFormModal.tsx',
  'src/components/LinkProjectModal.tsx',
  'src/components/SmartProjectUpload.tsx',
  'src/components/SmartProjectReview.tsx',
  'src/components/ClientDetail.tsx',
  'src/components/ClientDetailDrawer.tsx',
  'src/components/Dashboard.tsx',
  'src/components/JobDetail.tsx',
  'src/components/JobFormModal.tsx',
  'src/components/JobsList.tsx',
  'src/components/CandidateDetail.tsx',
  'src/components/CandidatesList.tsx',
  'src/components/Layout.tsx'
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // UI text replacements
    content = content.replace(/Client Requirement/g, 'Project');
    content = content.replace(/Client Requirements/g, 'Projects');
    content = content.replace(/Project Requirement/g, 'Project');
    content = content.replace(/Project Requirements/g, 'Projects');
    content = content.replace(/Requirement Details/g, 'Project Details');
    content = content.replace(/Requirement Name/g, 'Project Name');
    content = content.replace(/Edit Requirement/g, 'Edit Project');
    content = content.replace(/Requirement Status/g, 'Project Status');
    content = content.replace(/Requirement created successfully/g, 'Project created successfully');
    content = content.replace(/No requirements found/g, 'No projects found');
    content = content.replace(/Create Job from Requirement/g, 'Create Job from Project');
    content = content.replace(/Linked Requirement/g, 'Linked Project');
    content = content.replace(/No linked requirements/gi, 'No linked projects');
    content = content.replace(/reqs \>/gi, 'Projects >');
    content = content.replace(/> REQ-/g, '> PRJ-');

    // Breadcrumbs matching Req
    content = content.replace(/Reqs \//g, 'Projects /');
    content = content.replace(/Reqs /g, 'Projects ');
    
    // Replace standalone "Requirement" safely
    content = content.replace(/(?<!\w)Requirement(?!\w)/g, 'Project');
    content = content.replace(/(?<!\w)Requirements(?!\w)/g, 'Projects');

    fs.writeFileSync(file, content);
  }
});
