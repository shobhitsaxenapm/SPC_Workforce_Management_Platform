import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf-8');

// The multi_replace_file_content created duplicate ExtractedProjectData and ProjectSourceMetadata because I mismatched the end lines. Let's clean it up.
content = content.replace(/export interface ExtractedRequirementData {[\s\S]*?export interface RequirementSourceMetadata {/g, "");
// Actually, let's just make sure "RequirementSourceMetadata" is gone
content = content.replace(/RequirementSourceMetadata/g, "ProjectSourceMetadata");
content = content.replace(/ExtractedRequirementData/g, "ExtractedProjectData");
content = content.replace(/RequirementFulfilmentStatus/g, "ProjectFulfilmentStatus");
content = content.replace(/RequirementLifecycleStatus/g, "ProjectStatus");
content = content.replace(/RequirementRevision/g, "ProjectRevision");

fs.writeFileSync('src/types.ts', content);
