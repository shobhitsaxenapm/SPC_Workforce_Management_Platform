/**
 * Utility helper to generate clean, easy-to-understand 2-line executive summaries
 * for candidate profiles, avoiding heavy technical buzzwords.
 */
export function getEasyTwoLineSummary(candidate: {
  currentRole?: string;
  totalExperience?: string;
  professionalSummary?: string;
  skills?: string[] | string;
}): [string, string] {
  const role = candidate.currentRole?.trim() || 'Product Professional';
  const exp = candidate.totalExperience?.trim() || '4+ Years';
  const roleLower = role.toLowerCase();

  // 1. Product Management Roles
  if (roleLower.includes('product') || roleLower.includes('pm') || roleLower.includes('program')) {
    return [
      `${role} with ${exp} building AI automation tools, LLM workflows, and B2B SaaS platforms.`,
      'Proven track record taking features from concept to launch with strong user adoption and business impact.'
    ];
  }

  // 2. Engineering & Developer Roles
  if (
    roleLower.includes('engineer') ||
    roleLower.includes('developer') ||
    roleLower.includes('architect') ||
    roleLower.includes('backend') ||
    roleLower.includes('frontend') ||
    roleLower.includes('fullstack')
  ) {
    return [
      `${role} with ${exp} developing scalable backend systems, APIs, and cloud services.`,
      'Strong engineering background delivering reliable architectures with clean code, fast release cycles, and high uptime.'
    ];
  }

  // 3. Customer Operations & Support Roles
  if (
    roleLower.includes('customer') ||
    roleLower.includes('support') ||
    roleLower.includes('executive') ||
    roleLower.includes('operations') ||
    roleLower.includes('associate')
  ) {
    return [
      `${role} with ${exp} managing client support, issue resolution, and daily service operations.`,
      'Demonstrated reliability in maintaining high customer satisfaction and efficient team workflows.'
    ];
  }

  // 4. Design & UX Roles
  if (roleLower.includes('design') || roleLower.includes('ux') || roleLower.includes('ui')) {
    return [
      `${role} with ${exp} designing intuitive user interfaces and modern SaaS product experiences.`,
      'Skilled in user research, wireframing, and collaborating closely with engineering for seamless delivery.'
    ];
  }

  // 5. Data & AI/ML Specialist Roles
  if (roleLower.includes('data') || roleLower.includes('ai') || roleLower.includes('ml')) {
    return [
      `${role} with ${exp} building intelligent data pipelines, predictive models, and analytics dashboards.`,
      'Experienced in converting complex datasets into actionable business decisions and automated workflows.'
    ];
  }

  // Generic Clean Fallback
  return [
    `${role} with ${exp} delivering high-impact workflows and scalable domain solutions.`,
    'Proven ability to translate business goals into reliable results with cross-functional team collaboration.'
  ];
}
