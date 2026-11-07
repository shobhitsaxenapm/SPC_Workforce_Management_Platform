import { Job } from '../types';

export interface JobIntelligence {
  roleMission: [string, string];
  mustHaveSkills: string[];
  goodToHaveSkills: string[];
  candidatePersona: {
    targetBackground: string;
    keyAttributes: string;
  };
  impactPillars: {
    title: string;
    description: string;
    tag: string;
  }[];
  screeningQuestions: string[];
  sourcingGuardrails: {
    experience: string;
    education: string;
    workModel: string;
    noticePeriod: string;
  };
}

/**
 * Derives rich, structured intelligence for any Job Description across SPC domains
 * (Operations, Logistics, Data Digitisation, BPO, Tech, Leadership, etc.)
 */
export function getJobIntelligence(job: Job): JobIntelligence {
  const title = (job.title || '').trim();
  const lowerTitle = title.toLowerCase();
  const location = job.location || 'Flexible';
  const expRange = job.experienceRange || '3-5 Years';
  const rawSkills = (job.requiredSkills || []).map(s => s.trim()).filter(Boolean);
  const preferred = (job.preferredSkills || []).map(s => s.trim()).filter(Boolean);
  const qualifications = (job.qualifications || []).map(q => q.trim()).filter(Boolean);

  // Helper to check if summary is a broken or raw mock string
  const isMockSummary = !job.summary || 
    job.summary.toLowerCase().includes('gemini api key was invalid') || 
    job.summary.toLowerCase().includes('mock summary') ||
    job.summary.trim().length < 20;

  // 1. DATA ENTRY OPERATOR
  if (lowerTitle.includes('data entry') || lowerTitle.includes('digitisation') || lowerTitle.includes('digitization')) {
    return {
      roleMission: [
        `Accurately digitize, transcribe, and validate high-volume patient records and clinical documents into central databases in ${location}.`,
        'Maintain zero-defect data confidentiality, verify source records with precision, and consistently achieve daily throughput targets.'
      ],
      mustHaveSkills: rawSkills.length > 0 ? rawSkills : ['Typing Speed > 40 WPM', 'MS Excel', 'Data Validation', 'Document Verification'],
      goodToHaveSkills: preferred.length > 0 ? preferred : ['Healthcare Terminology', 'Electronic Medical Records (EMR)', 'Accuracy Checks'],
      candidatePersona: {
        targetBackground: 'Detail-oriented data operators or administrative clerks with verified high-speed typing and spreadsheet accuracy.',
        keyAttributes: 'High focus on zero-error accuracy, adherence to patient confidentiality, and stamina for repetitive digital entry.'
      },
      impactPillars: [
        {
          title: 'High-Volume Digitisation & Speed',
          description: 'Transcribe patient demographic information and medical records with continuous speed > 40 WPM.',
          tag: 'Throughput'
        },
        {
          title: 'Source Verification & QA',
          description: 'Cross-reference digitized data against physical clinical forms to catch discrepancies before committing records.',
          tag: 'Quality Control'
        },
        {
          title: 'Compliance & Confidentiality',
          description: 'Uphold strict healthcare data governance standards, preventing unauthorized disclosure or data leakage.',
          tag: 'Governance'
        }
      ],
      screeningQuestions: [
        'What is your verified typing speed in words per minute (WPM), and what average accuracy percentage do you maintain?',
        'How comfortable are you handling large datasets in MS Excel, and which validation formulas (e.g. VLOOKUP, filters) do you use?',
        'Have you previously worked with sensitive or confidential data where zero-error compliance was mandatory?'
      ],
      sourcingGuardrails: {
        experience: expRange,
        education: qualifications[0] || 'Any Graduate / 12th Pass',
        workModel: `${job.employmentType || 'Contract'} • On-site in ${location}`,
        noticePeriod: 'Immediate to 15 Days'
      }
    };
  }

  // 2. WAREHOUSE & LOGISTICS ASSOCIATES
  if (lowerTitle.includes('warehouse') || lowerTitle.includes('loading') || lowerTitle.includes('sorting') || lowerTitle.includes('inventory clerk')) {
    return {
      roleMission: [
        `Oversee daily warehouse floor fulfillment, stock intake, sorting, and pallet dispatch at the ${location} distribution hub.`,
        'Maintain real-time inventory precision, enforce safety standards, and ensure timely freight turnaround for active client orders.'
      ],
      mustHaveSkills: rawSkills.length > 0 ? rawSkills : ['Inventory Management', 'Order Packing', 'Loading & Unloading', 'Physical Fitness'],
      goodToHaveSkills: preferred.length > 0 ? preferred : ['Forklift Operation', 'WMS Barcode Scanners', 'Basic English'],
      candidatePersona: {
        targetBackground: 'Active warehouse associates or logistics fulfillment staff with experience in fast-paced distribution hubs or retail supply chains.',
        keyAttributes: 'Physical stamina, punctuality, cycle count precision, and comfort with rotational floor shifts.'
      },
      impactPillars: [
        {
          title: 'Freight Intake & Truck Turnaround',
          description: 'Safely unload incoming delivery trucks, verify shipment waybills, and move freight into staging racks.',
          tag: 'Logistics'
        },
        {
          title: 'Order Packing & Despatch',
          description: 'Pick and securely pack client orders with speed, tagging packages with barcode labels for courier handover.',
          tag: 'Fulfillment'
        },
        {
          title: 'Floor Safety & Stock Audit',
          description: 'Participate in weekly stock counting audits and maintain zero-hazard warehouse cleanliness standards.',
          tag: 'Safety'
        }
      ],
      screeningQuestions: [
        'Are you comfortable with shift-based physical loading and standing for extended operational shifts in a logistics hub?',
        'Do you have hands-on experience using handheld barcode scanners or Warehouse Management Systems (WMS)?',
        'Can you join immediately for rotating shift schedules at the facility?'
      ],
      sourcingGuardrails: {
        experience: expRange,
        education: qualifications[0] || '10th / 12th Pass',
        workModel: `${job.employmentType || 'Full-time'} • On-site Hub in ${location}`,
        noticePeriod: 'Immediate Joiner Preferred'
      }
    };
  }

  // 3. PATIENT SUPPORT & CUSTOMER CARE BPO
  if (lowerTitle.includes('patient') || lowerTitle.includes('support') || lowerTitle.includes('customer care') || lowerTitle.includes('bpo') || lowerTitle.includes('telecaller')) {
    return {
      roleMission: [
        `Manage patient appointment scheduling, query resolution, and diagnostic inquiries for a premier healthcare network in ${location}.`,
        'Deliver empathetic, high-quality patient communication across voice channels, resolving scheduling escalations promptly.'
      ],
      mustHaveSkills: rawSkills.length > 0 ? rawSkills : ['Customer Service', 'Verbal Empathy', 'Bilingual (Hindi & English)', 'Inbound Call Handling'],
      goodToHaveSkills: preferred.length > 0 ? preferred : ['Healthcare / Diagnostic Clinic Knowledge', 'CRM / Telephony Systems', 'Appointment Scheduling'],
      candidatePersona: {
        targetBackground: 'Customer care or healthcare BPO representatives known for polite tone, active listening, and composure under pressure.',
        keyAttributes: 'Empathetic verbal delivery, active listening, patience with anxious callers, and quick digital CRM navigation.'
      },
      impactPillars: [
        {
          title: 'Patient Inquiry & Booking Management',
          description: 'Guide callers through diagnostic test prerequisites, slot availability, and confirm home collection or center visits.',
          tag: 'Communication'
        },
        {
          title: 'Empathetic Escalation Resolution',
          description: 'Address patient concerns regarding test delay timelines or booking rescheduling with calm professionalism.',
          tag: 'Service Quality'
        },
        {
          title: 'CRM Logging & SLA Adherence',
          description: 'Accurately tag call dispositions, document patient feedback, and maintain first-contact resolution standards.',
          tag: 'Governance'
        }
      ],
      screeningQuestions: [
        'How comfortable are you switching fluently between Hindi and English when assisting callers on the phone?',
        'Can you give an example of how you resolved an anxious or upset customer inquiry in your previous customer support role?',
        'What CRM or telephony tools have you used to manage daily inbound or outbound calls?'
      ],
      sourcingGuardrails: {
        experience: expRange,
        education: qualifications[0] || 'Graduate in any discipline',
        workModel: `${job.employmentType || 'Full-time'} • ${location}`,
        noticePeriod: '15 to 30 Days'
      }
    };
  }

  // 4. DEPUTY MANAGER / OPERATIONS LEADERSHIP
  if (lowerTitle.includes('deputy manager') || lowerTitle.includes('operations manager') || lowerTitle.includes('operations lead') || lowerTitle.includes('operations')) {
    return {
      roleMission: [
        `Lead ground operations, field team execution, and vendor partner SLAs across operational facilities in ${location}.`,
        'Identify process bottlenecks, scale daily throughput, and maintain rigorous operational and safety standards.'
      ],
      mustHaveSkills: rawSkills.length > 0 ? rawSkills : ['Operations Management', 'Team Leadership', 'Process Optimization', 'SLA Tracking', 'KPI Reporting'],
      goodToHaveSkills: preferred.length > 0 ? preferred : ['Vendor Management', 'Supply Chain Analytics', 'Incident Management', 'Lean Practices'],
      candidatePersona: {
        targetBackground: 'Operations leaders or assistant managers with 3-5 years driving high-volume field, warehouse, or facility operations.',
        keyAttributes: 'Decisive problem-solver under operational pressure, strong people manager, and data-driven tracker of operational KPIs.'
      },
      impactPillars: [
        {
          title: 'Ground Operational Oversight',
          description: 'Supervise daily shift allocations, floor throughput, and cross-functional team execution to meet delivery quotas.',
          tag: 'Operations'
        },
        {
          title: 'Process Optimization & SLA Governance',
          description: 'Analyze operational bottlenecks, streamline handover procedures, and enforce standard operating protocols.',
          tag: 'Continuous Improvement'
        },
        {
          title: 'Team Leadership & Performance Review',
          description: 'Mentor supervisors and field associates, conduct performance evaluations, and maintain high team morale.',
          tag: 'Leadership'
        }
      ],
      screeningQuestions: [
        'What is the size of the team or facility you have directly managed, and what were your top 3 daily operational KPIs?',
        'How do you handle severe operational bottlenecks or vendor SLA breaches during peak business hours?',
        'Can you share an initiative where you improved operational turnaround time or reduced process defects?'
      ],
      sourcingGuardrails: {
        experience: expRange,
        education: qualifications[0] || "Bachelor's Degree in Business, Engineering, or Operations",
        workModel: `${job.employmentType || 'Full-time'} • ${location}`,
        noticePeriod: '30 Days or Less'
      }
    };
  }

  // 5. SOFTWARE / FRONTEND / REACT / TECH ROLES
  if (lowerTitle.includes('react') || lowerTitle.includes('developer') || lowerTitle.includes('engineer') || lowerTitle.includes('software')) {
    return {
      roleMission: [
        `Architect and build high-performance, accessible web applications using React, TypeScript, and modern component workflows.`,
        'Collaborate closely with product designers and backend services to ship scalable, intuitive user interfaces.'
      ],
      mustHaveSkills: rawSkills.length > 0 ? rawSkills : ['React.js', 'TypeScript', 'State Management (Zustand/Redux)', 'RESTful APIs', 'Tailwind CSS'],
      goodToHaveSkills: preferred.length > 0 ? preferred : ['Next.js', 'Node.js', 'GraphQL', 'Automated Testing (Vitest/Jest)', 'CI/CD Pipelines'],
      candidatePersona: {
        targetBackground: 'Frontend software engineers with 3-6 years of production experience building complex single-page applications.',
        keyAttributes: 'Clean code architecture, attention to UI/UX performance, and strong collaborative communication.'
      },
      impactPillars: [
        {
          title: 'Frontend Architecture & Components',
          description: 'Design modular, reusable UI components using Tailwind CSS and type-safe interfaces.',
          tag: 'Architecture'
        },
        {
          title: 'App Performance & State Scalability',
          description: 'Optimize rendering cycles, minimize bundle sizes, and manage complex application state predictably.',
          tag: 'Performance'
        },
        {
          title: 'Technical Collaboration & Code Reviews',
          description: 'Conduct peer code reviews, mentor junior engineers, and partner with product owners on technical feasibility.',
          tag: 'Quality'
        }
      ],
      screeningQuestions: [
        'How do you approach complex state management and performance optimization in large-scale React applications?',
        'Can you walk through your experience with TypeScript type safety, custom hooks, and API integration?',
        'Have you collaborated directly with product and design teams to refine component specifications and technical feasibility?'
      ],
      sourcingGuardrails: {
        experience: expRange,
        education: qualifications[0] || "Bachelor's Degree in Computer Science or equivalent practical rigor",
        workModel: `${job.employmentType || 'Full-time'} • ${location}`,
        noticePeriod: '30 to 60 Days'
      }
    };
  }

  // 6. PRODUCT MANAGEMENT
  if (lowerTitle.includes('product manager') || lowerTitle.includes('product lead') || lowerTitle.includes('ai product')) {
    return {
      roleMission: [
        `Lead product discovery, roadmap prioritisation, and sprint delivery for core business platforms in ${location}.`,
        'Transform complex operational workflows into intuitive software experiences delivering measurable client value.'
      ],
      mustHaveSkills: rawSkills.length > 0 ? rawSkills : ['Product Strategy', 'Discovery & User Research', 'Roadmapping', 'PRDs & User Stories', 'Product Analytics'],
      goodToHaveSkills: preferred.length > 0 ? preferred : ['AI / Generative AI Workflows', 'B2B SaaS Systems', 'Wireframing (Figma)', 'SQL'],
      candidatePersona: {
        targetBackground: 'Product managers with hands-on experience driving customer discovery and shipping B2B software products.',
        keyAttributes: 'Strategic vision, structured analytical problem-solving, and cross-functional empathy.'
      },
      impactPillars: [
        {
          title: 'Product Strategy & Roadmapping',
          description: 'Define clear quarterly milestones aligned with business goals and validated customer pain points.',
          tag: 'Strategy'
        },
        {
          title: 'Execution & Sprint Prioritisation',
          description: 'Write crisp PRDs, prioritize engineering backlogs, and drive weekly delivery with design and tech leads.',
          tag: 'Execution'
        },
        {
          title: 'Measurement & Feedback Loops',
          description: 'Track adoption metrics, run qualitative customer interviews, and iterate rapidly based on user data.',
          tag: 'Analytics'
        }
      ],
      screeningQuestions: [
        'Can you share an example of a product or major feature you took from ambiguous discovery to measurable production launch?',
        'How do you balance customer feature requests against technical debt and engineering bandwidth?',
        'What metrics and analytics frameworks do you rely on to measure post-launch feature success?'
      ],
      sourcingGuardrails: {
        experience: expRange,
        education: qualifications[0] || "Bachelor's or Master's Degree in Technology, Business, or related discipline",
        workModel: `${job.employmentType || 'Full-time'} • ${location}`,
        noticePeriod: '30 to 60 Days'
      }
    };
  }

  // 7. UNIVERSAL DEFAULT (Any other role)
  const cleanSummary = isMockSummary
    ? `Drive core deliverables and functional excellence as ${title} in ${location}.`
    : job.summary.trim();

  return {
    roleMission: [
      cleanSummary,
      `Collaborate across operational and client teams to ensure timely execution, SLA compliance, and high quality standards.`
    ],
    mustHaveSkills: rawSkills.length > 0 ? rawSkills : ['Core Functional Expertise', 'Problem Solving', 'Task Execution', 'Team Collaboration'],
    goodToHaveSkills: preferred.length > 0 ? preferred : ['Continuous Improvement', 'Reporting & Documentation', 'Client Communication'],
    candidatePersona: {
      targetBackground: `Qualified professionals with ${expRange} of verified experience in ${title} or adjacent operational functions.`,
      keyAttributes: 'Proven track record of dependable task execution, process compliance, and collaborative attitude.'
    },
    impactPillars: (job.responsibilities && job.responsibilities.length > 0 && !job.responsibilities[0].toLowerCase().includes('mock responsibility'))
      ? job.responsibilities.slice(0, 3).map((r, i) => ({
          title: i === 0 ? 'Primary Execution & Daily Deliverables' : i === 1 ? 'Process Integrity & Quality Checks' : 'Cross-Functional Coordination',
          description: r,
          tag: i === 0 ? 'Core Execution' : i === 1 ? 'Quality' : 'Collaboration'
        }))
      : [
          {
            title: 'Core Functional Execution',
            description: `Execute daily responsibilities aligned with the ${title} scope, meeting all output and turnaround targets.`,
            tag: 'Execution'
          },
          {
            title: 'Quality & Process Compliance',
            description: 'Maintain strict adherence to client standard operating procedures, documentation, and quality guidelines.',
            tag: 'Quality'
          },
          {
            title: 'Team Alignment & Reporting',
            description: 'Participate in team standups, report operational status to management, and escalate blockers promptly.',
            tag: 'Coordination'
          }
        ],
    screeningQuestions: [
      `Can you walk through your hands-on background and top accomplishments as ${title}?`,
      'How do you handle high-pressure deadlines or sudden changes in operational priorities?',
      `Are you comfortable with the location (${location}) and confirmed for immediate / near-term availability?`
    ],
    sourcingGuardrails: {
      experience: expRange,
      education: qualifications[0] || 'Graduate / Equivalent Diploma',
      workModel: `${job.employmentType || 'Full-time'} • ${location}`,
      noticePeriod: '30 Days or Less'
    }
  };
}
