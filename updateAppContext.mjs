import fs from 'fs';
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

// Replace mock Requirements with mock Projects
content = content.replace(/mockRequirements/g, 'mockProjects');

// Replace state variables
content = content.replace(/const \[requirements, setRequirements\] = useState<ClientRequirement\[\]>/g, 'const [projects, setProjects] = useState<Project[]>');
content = content.replace(/setRequirements\(mockRequirements\)/g, 'setProjects(mockProjects)');
content = content.replace(/const \[quickViewRequirementId, setQuickViewRequirementId\] = useState<string \| null>\(null\);/g, 'const [quickViewProjectId, setQuickViewProjectId] = useState<string | null>(null);');

// Replace RequirementLifecycleStatus with ProjectStatus
content = content.replace(/RequirementLifecycleStatus/g, 'ProjectStatus');
content = content.replace(/ClientRequirement/g, 'Project');
content = content.replace(/updateRequirementLifecycle/g, 'updateProjectStatus');
content = content.replace(/deleteRequirement/g, 'deleteProject');
content = content.replace(/createRequirement/g, 'createProject');
content = content.replace(/updateRequirement/g, 'updateProject');

// Context Provider values
content = content.replace(/requirements,\n/g, 'projects,\n');
content = content.replace(/quickViewRequirementId,\n/g, 'quickViewProjectId,\n');
content = content.replace(/setQuickViewRequirementId,\n/g, 'setQuickViewProjectId,\n');

content = content.replace(/setRequirements/g, 'setProjects');
content = content.replace(/requirements\./g, 'projects.');

content = content.replace(/activeRequirementsCount/g, 'activeProjectsCount');
content = content.replace(/requirementId/g, 'projectId');

fs.writeFileSync('src/context/AppContext.tsx', content);
