import openpyxl
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.utils import get_column_letter
import os

wb = openpyxl.Workbook()
wb.remove(wb.active)

def create_table(ws, title, headers, data):
    ws.append(headers)
    for row in data:
        ws.append(row)
    
    # Needs a valid range for table
    tab = Table(displayName=title.replace(" ", "_"), ref=f"A1:{get_column_letter(len(headers))}{len(data)+1}")
    style = TableStyleInfo(name="TableStyleMedium9", showFirstColumn=False, showLastColumn=False, showRowStripes=True, showColumnStripes=False)
    tab.tableStyleInfo = style
    ws.add_table(tab)
    
    ws.freeze_panes = "A2"
    for i in range(len(headers)):
        ws.column_dimensions[get_column_letter(i+1)].width = 25

# --- Sheet 1: Executive Summary ---
ws1 = wb.create_sheet("Executive Summary")
h1 = ['Module', 'Entity', 'Status Dimension', 'Purpose', 'Source of Truth', 'Initial Value', 'Number of Implemented Values', 'Current Owner/Component', 'Cross-Module Dependencies', 'Audit Confidence', 'Key Finding']
d1 = [
    ['Candidate', 'Candidate', 'Duplicate Status', 'Identify duplicates', 'AppContext (candidates)', 'None', 3, 'AppContext.tsx', 'None', 'High', 'Candidate master does not have a lifecycle stage. Pipeline stage is tied to the Application.'],
    ['Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Tracks applicant progress', 'AppContext (applications)', 'New', 12, 'AppContext.tsx', 'Interviews, Offers', 'High', 'Stored as currentStage.'],
    ['Candidate-Job', 'Application', 'Candidate-job Substate', 'Detailed tracking inside a stage', 'AppContext (applications)', 'Application Received', 20, 'AppContext.tsx', 'Interviews, Offers', 'Medium', 'Stored as currentSubstate. Mixed levels of granularity.'],
    ['Job', 'Job', 'Job Status', 'Job lifecycle status', 'AppContext (jobs)', 'Draft', 5, 'AppContext.tsx', 'Matching, Applications', 'High', 'Lifecycle and publication combined into one status field.'],
    ['Job', 'Job', 'Job Visibility', 'Job visibility', 'AppContext (jobs)', 'Private', 2, 'AppContext.tsx', 'None', 'High', 'Separate from Job Status.'],
    ['Interview', 'Interview', 'Interview-event status', 'State of scheduled interview', 'AppContext (interviews)', 'Scheduled', 5, 'AppContext.tsx', 'Application Substate updates', 'High', 'Feedback states are separate from event statuses.'],
    ['Interview', 'Interview', 'Feedback Recommendation', 'Recruiter recommendation post-interview', 'AppContext (interviews)', 'Not Started', 3, 'AppContext.tsx', 'Application Stage', 'High', 'Stored on the Interview object itself.'],
    ['Offer', 'Offer', 'Offer case status', 'Overall state of offer', 'AppContext (offers)', 'Offer Draft', 14, 'AppContext.tsx', 'Application Stage', 'High', 'Both versioning and lifecycle are mixed.'],
]
create_table(ws1, "ExecutiveSummary", h1, d1)


# --- Sheet 2: Master Status Catalog ---
ws2 = wb.create_sheet("Master Status Catalog")
h2 = ['Inventory ID', 'Module', 'Entity', 'Status Dimension', 'Classification', 'Exact Code Value', 'Display Label', 'Business Meaning', 'Authoritative or Derived', 'Derivation Rule', 'Initial State', 'Terminal State', 'Active or Historical', 'Allowed Actor', 'Where Displayed', 'Available Actions', 'Source File', 'Source Symbol/Component', 'Source Line', 'Test Coverage', 'Usage Status', 'Notes']
d2 = [
    ['CAT_001', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'New', 'New', 'Candidate applied or matched', 'Authoritative', '-', 'Yes', 'No', 'Active', 'System', 'CandidateDetail', 'Screen, Reject', 'src/types.ts', 'ApplicationStage', '9', 'Unknown', 'Active', ''],
    ['CAT_002', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Under Review', 'Under Review', 'Manual review started', 'Authoritative', '-', 'No', 'No', 'Active', 'Recruiter', 'CandidateDetail', 'Interview, Reject', 'src/types.ts', 'ApplicationStage', '10', 'Unknown', 'Active', ''],
    ['CAT_003', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Application Rejected', 'Application Rejected', 'Rejected at screening', 'Authoritative', '-', 'No', 'Yes', 'Active', 'Recruiter', 'CandidateDetail', 'None', 'src/types.ts', 'ApplicationStage', '11', 'Unknown', 'Active', ''],
    ['CAT_004', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Sourced', 'Sourced', 'Sourced via search', 'Authoritative', '-', 'Yes', 'No', 'Active', 'Recruiter', 'CandidateDetail', 'Screen', 'src/types.ts', 'ApplicationStage', '12', 'Unknown', 'Active', ''],
    ['CAT_005', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Screening', 'Screening', 'Initial screening phase', 'Authoritative', '-', 'No', 'No', 'Active', 'Recruiter', 'CandidateDetail', 'Interview, Reject', 'src/types.ts', 'ApplicationStage', '13', 'Unknown', 'Active', ''],
    ['CAT_006', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Interviewing', 'Interviewing', 'Candidate in interview process', 'Authoritative', '-', 'No', 'No', 'Active', 'Recruiter', 'CandidateDetail', 'Schedule Next Round', 'src/types.ts', 'ApplicationStage', '14', 'Unknown', 'Active', ''],
    ['CAT_007', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Selected', 'Selected', 'Selected after interviews', 'Authoritative', '-', 'No', 'No', 'Active', 'Recruiter', 'CandidateDetail', 'Prepare Offer', 'src/types.ts', 'ApplicationStage', '15', 'Unknown', 'Active', ''],
    ['CAT_008', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Offered', 'Offered', 'Offer is issued', 'Authoritative', '-', 'No', 'No', 'Active', 'Recruiter', 'CandidateDetail', 'Revise Offer', 'src/types.ts', 'ApplicationStage', '16', 'Unknown', 'Active', ''],
    ['CAT_009', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Hired', 'Hired', 'Offer accepted', 'Authoritative', '-', 'No', 'No', 'Active', 'Candidate', 'CandidateDetail', 'Onboard', 'src/types.ts', 'ApplicationStage', '17', 'Unknown', 'Active', ''],
    ['CAT_010', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Joined', 'Joined', 'Candidate started', 'Authoritative', '-', 'No', 'Yes', 'Active', 'HR', 'CandidateDetail', 'None', 'src/types.ts', 'ApplicationStage', '18', 'Unknown', 'Active', ''],
    ['CAT_011', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Rejected', 'Rejected', 'Rejected post screening', 'Authoritative', '-', 'No', 'Yes', 'Active', 'Recruiter', 'CandidateDetail', 'None', 'src/types.ts', 'ApplicationStage', '19', 'Unknown', 'Active', ''],
    ['CAT_012', 'Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Authoritative entity status', 'Withdrawn', 'Withdrawn', 'Candidate withdrew', 'Authoritative', '-', 'No', 'Yes', 'Active', 'Candidate', 'CandidateDetail', 'None', 'src/types.ts', 'ApplicationStage', '20', 'Unknown', 'Active', ''],
    ['CAT_013', 'Job', 'Job', 'Job Status', 'Authoritative entity status', 'Draft', 'Draft', 'Job created but not live', 'Authoritative', '-', 'Yes', 'No', 'Active', 'Recruiter', 'JobsList', 'Publish', 'src/types.ts', 'JobStatus', '6', 'Unknown', 'Active', ''],
    ['CAT_014', 'Job', 'Job', 'Job Status', 'Authoritative entity status', 'Published', 'Published', 'Job is live', 'Authoritative', '-', 'No', 'No', 'Active', 'Recruiter', 'JobsList', 'Pause, Close', 'src/types.ts', 'JobStatus', '6', 'Unknown', 'Active', ''],
    ['CAT_015', 'Job', 'Job', 'Job Status', 'Authoritative entity status', 'Paused', 'Paused', 'Job temporarily hidden', 'Authoritative', '-', 'No', 'No', 'Active', 'Recruiter', 'JobsList', 'Publish', 'src/types.ts', 'JobStatus', '6', 'Unknown', 'Active', ''],
    ['CAT_016', 'Job', 'Job', 'Job Status', 'Authoritative entity status', 'Filled', 'Filled', 'Target headcount met', 'Authoritative', '-', 'No', 'No', 'Active', 'System', 'JobsList', 'Close', 'src/types.ts', 'JobStatus', '6', 'Unknown', 'Active', ''],
    ['CAT_017', 'Job', 'Job', 'Job Status', 'Authoritative entity status', 'Closed', 'Closed', 'Job no longer active', 'Authoritative', '-', 'No', 'Yes', 'Active', 'Recruiter', 'JobsList', 'None', 'src/types.ts', 'JobStatus', '6', 'Unknown', 'Active', ''],
    ['CAT_018', 'Interview', 'Interview', 'Interview Status', 'Authoritative entity status', 'Scheduled', 'Scheduled', 'Interview is planned', 'Authoritative', '-', 'Yes', 'No', 'Active', 'Recruiter', 'InterviewsList', 'Cancel, Reschedule', 'src/types.ts', 'InterviewStatus', '35', 'Unknown', 'Active', ''],
    ['CAT_019', 'Interview', 'Interview', 'Interview Status', 'Authoritative entity status', 'Completed', 'Completed', 'Interview occurred', 'Authoritative', '-', 'No', 'Yes', 'Active', 'Interviewer', 'InterviewsList', 'Provide Feedback', 'src/types.ts', 'InterviewStatus', '35', 'Unknown', 'Active', ''],
    ['CAT_020', 'Interview', 'Interview', 'Interview Status', 'Authoritative entity status', 'Cancelled', 'Cancelled', 'Interview cancelled', 'Authoritative', '-', 'No', 'Yes', 'Active', 'Recruiter', 'InterviewsList', 'None', 'src/types.ts', 'InterviewStatus', '35', 'Unknown', 'Active', ''],
    ['CAT_021', 'Interview', 'Interview', 'Interview Status', 'Authoritative entity status', 'Rescheduled', 'Rescheduled', 'Interview rescheduled', 'Authoritative', '-', 'No', 'Yes', 'Active', 'Recruiter', 'InterviewsList', 'None', 'src/types.ts', 'InterviewStatus', '35', 'Unknown', 'Active', ''],
    ['CAT_022', 'Interview', 'Interview', 'Interview Status', 'Authoritative entity status', 'No Show', 'No Show', 'Candidate or Interviewer did not attend', 'Authoritative', '-', 'No', 'Yes', 'Active', 'Recruiter', 'InterviewsList', 'None', 'src/types.ts', 'InterviewStatus', '35', 'Unknown', 'Active', ''],
    ['CAT_023', 'Offer', 'Offer', 'Offer Status', 'Authoritative entity status', 'Offer Draft', 'Offer Draft', 'Offer drafted', 'Authoritative', '-', 'Yes', 'No', 'Active', 'Recruiter', 'OffersList', 'Submit', 'src/types.ts', 'OfferStatus', '36', 'Unknown', 'Active', ''],
    ['CAT_024', 'Offer', 'Offer', 'Offer Status', 'Authoritative entity status', 'Accepted', 'Accepted', 'Offer accepted', 'Authoritative', '-', 'No', 'Yes', 'Active', 'Candidate', 'OffersList', 'Onboard', 'src/types.ts', 'OfferStatus', '36', 'Unknown', 'Active', ''],
    ['CAT_025', 'Interview', 'Interview', 'Filter or work-queue view', 'Filter or work-queue view', 'Overdue', 'Overdue', 'Interview time passed but not marked completed', 'Derived', 'status === Scheduled && end < now', 'No', 'No', 'Active', '-', 'InterviewsList', '-', 'src/components/InterviewsList.tsx', 'derivedDisplayStatus', '102', 'Unknown', 'Active', 'Derived from time.'],
    ['CAT_026', 'Interview', 'Interview', 'Filter or work-queue view', 'Filter or work-queue view', 'Feedback Pending', 'Feedback Pending', 'Completed but no feedback', 'Derived', 'status === Completed && feedbackStatus !== Submitted', 'No', 'No', 'Active', '-', 'InterviewsList', '-', 'src/components/InterviewsList.tsx', 'summaryCounts', '111', 'Unknown', 'Active', 'Derived state in UI tabs.'],
]
create_table(ws2, "MasterStatusCatalog", h2, d2)


# --- Sheet 3: Transition Matrix ---
ws3 = wb.create_sheet("Transition Matrix")
h3 = ['Module', 'Entity', 'Status Dimension', 'From Status', 'To Status', 'Trigger/CTA', 'Actor', 'Entry Point', 'Preconditions', 'Confirmation Required', 'Required Inputs', 'Side Effects', 'Related Entity Updated', 'Resulting Cross-Module Status', 'History/Timeline Event', 'Reversible', 'Failure/Blocked Condition', 'Source File', 'Source Symbol', 'Source Line', 'Test Reference', 'Notes']
d3 = [
    ['Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'New', 'Interviewing', 'Schedule Interview', 'Recruiter', 'CandidateDetail', 'None', 'No', 'Interview Details', 'Yes', 'Interview', 'Scheduled', 'Yes', 'No', 'None', 'src/context/AppContext.tsx', 'scheduleInterview', '950', 'None', 'Also creates an Interview entity.'],
    ['Candidate-Job', 'Application', 'Candidate-job Pipeline stage', 'Interviewing', 'Selected', 'Confirm Selection', 'Recruiter', 'InterviewsList', 'Feedback Submitted', 'Yes', 'None', 'Yes', 'None', 'None', 'Yes', 'No', 'None', 'src/context/AppContext.tsx', 'updateApplicationStage', '735', 'None', 'Triggered from view_detail in InterviewsList.'],
    ['Offer', 'Offer', 'Offer Status', 'Offer Draft', 'Offer Issued', 'Issue Offer', 'Recruiter', 'OffersList', 'Approval complete if required', 'Yes', 'None', 'Yes', 'Application', 'Offered', 'Yes', 'No', 'None', 'src/context/AppContext.tsx', 'issueOffer', '1088', 'None', 'Updates Application to Offered.'],
    ['Offer', 'Offer', 'Offer Status', 'Offer Issued', 'Accepted', 'Record Response', 'Recruiter', 'CandidateDetail', 'None', 'Yes', 'None', 'Yes', 'Application', 'Hired', 'Yes', 'No', 'None', 'src/context/AppContext.tsx', 'recordOfferResponse', '1110', 'None', 'Updates Application to Hired.'],
]
create_table(ws3, "TransitionMatrix", h3, d3)


# --- Sheet 4: Cross-Module Synchronization ---
ws4 = wb.create_sheet("Cross-Module Synchronization")
h4 = ['Triggering Module', 'Triggering Entity', 'Triggering Status/Action', 'Dependent Module', 'Dependent Entity', 'Expected Dependent Result', 'Actual Implemented Result', 'Shared Record/Identifier', 'Synchronization Method', 'Single Source of Truth', 'Risk of Divergence', 'Source Reference', 'Notes']
d4 = [
    ['Interview', 'Interview', 'Schedule Interview', 'Candidate-Job', 'Application', 'Stage -> Interviewing', 'Stage -> Interviewing, Substate -> scheduled', 'ApplicationId', 'Context function', 'Yes', 'Low', 'AppContext.tsx (scheduleInterview)', 'Automatically moves application into Interviewing.'],
    ['Interview', 'Interview', 'Confirm Selection', 'Candidate-Job', 'Application', 'Stage -> Selected', 'Stage -> Selected', 'ApplicationId', 'Context function', 'Yes', 'Low', 'InterviewsList.tsx (handleConfirmSelection)', 'Recruiter explicit action post-feedback.'],
    ['Offer', 'Offer', 'Issue Offer', 'Candidate-Job', 'Application', 'Stage -> Offered', 'Stage -> Offered', 'ApplicationId', 'Context function', 'Yes', 'Low', 'AppContext.tsx (issueOffer)', 'Updates application stage to Offered.'],
    ['Offer', 'Offer', 'Accept Offer', 'Candidate-Job', 'Application', 'Stage -> Hired', 'Stage -> Hired', 'ApplicationId', 'Context function', 'Yes', 'Low', 'AppContext.tsx (recordOfferResponse)', 'Candidate accepting offer triggers Hired stage.'],
    ['Offer', 'Offer', 'Reject Offer', 'Candidate-Job', 'Application', 'Stage -> Rejected', 'Stage -> Rejected', 'ApplicationId', 'Context function', 'Yes', 'Low', 'AppContext.tsx (recordOfferResponse)', 'Candidate declining offer triggers Rejected stage.'],
]
create_table(ws4, "CrossModuleSynchronization", h4, d4)


# --- Sheet 5: UI and Filter Mapping ---
ws5 = wb.create_sheet("UI and Filter Mapping")
h5 = ['Module', 'Screen/Tab', 'UI Element', 'Element Type', 'Display Label', 'Underlying Value', 'Authoritative Status or Derived View', 'Filter/Derivation Logic', 'Can Combine With Other Filters', 'Result Count Source', 'Empty-State Behaviour', 'Source File', 'Source Line', 'Notes']
d5 = [
    ['Interview', 'InterviewsList', 'Summary Tabs', 'Tab', 'Overdue', 'Overdue', 'Derived View', 'isOverdue === true', 'Yes', 'Array filter', 'Shows No interviews found', 'InterviewsList.tsx', '312', 'Combined with manual filters.'],
    ['Interview', 'InterviewsList', 'Summary Tabs', 'Tab', 'Feedback Pending', 'Feedback Pending', 'Derived View', 'status===Completed && feedbackStatus!==Submitted', 'Yes', 'Array filter', 'Shows No interviews found', 'InterviewsList.tsx', '312', 'Combined with manual filters.'],
    ['Interview', 'InterviewsList', 'Dropdown Menu', 'Action', 'Mark No-Show', 'No Show', 'Authoritative Status', 'status is Scheduled or Overdue', 'N/A', 'N/A', 'N/A', 'InterviewsList.tsx', '512', 'Action opens modal.'],
]
create_table(ws5, "UIAndFilterMapping", h5, d5)


# --- Sheet 6: Module Status Maps ---
ws6 = wb.create_sheet("Module Status Maps")
h6 = ['Module', 'Sequence', 'Status/Stage', 'Previous Statuses', 'Next Statuses', 'Entry Action', 'Exit Action', 'Terminal', 'Exception Path', 'Notes']
d6 = [
    ['Candidate-Job', '1', 'New', 'None', 'Under Review, Interviewing, Rejected', 'Apply/Sourced', 'Screen/Schedule', 'No', '-', 'Initial stage.'],
    ['Candidate-Job', '2', 'Interviewing', 'New, Under Review', 'Selected, Rejected', 'Schedule Interview', 'Confirm Selection', 'No', '-', 'Iterative rounds possible.'],
    ['Candidate-Job', '3', 'Selected', 'Interviewing', 'Offered, Rejected', 'Confirm Selection', 'Issue Offer', 'No', '-', 'Recruiter decision.'],
    ['Candidate-Job', '4', 'Offered', 'Selected', 'Hired, Rejected', 'Issue Offer', 'Candidate Response', 'No', '-', 'Offer sent to candidate.'],
    ['Candidate-Job', '5', 'Hired', 'Offered', 'Joined', 'Accept Offer', 'Onboarding Complete', 'No', '-', 'Candidate accepted.'],
    ['Interview', '1', 'Scheduled', 'None', 'Completed, Cancelled, Rescheduled, No Show', 'Create Interview', 'Attend/Cancel', 'No', 'No Show', 'Starts interview lifecycle.'],
]
create_table(ws6, "ModuleStatusMaps", h6, d6)


# --- Sheet 7: Gaps and Contradictions ---
ws7 = wb.create_sheet("Gaps and Contradictions")
h7 = ['Gap ID', 'Severity', 'Module', 'Entity', 'Issue Type', 'Current Behaviour', 'Conflicting Behaviour', 'User Impact', 'Engineering Risk', 'Relevant Statuses', 'Source References', 'Recommended Product Decision', 'Recommended Engineering Follow-up', 'Confidence']
d7 = [
    ['GAP_001', 'Medium', 'Job', 'Job', 'Combined Concepts', 'Job Status stores Draft/Published/Filled.', 'Lifecycle (Filled/Closed) mixed with visibility (Published).', 'Can cause confusion if a filled job needs to remain published.', 'Harder to query visibility independently of lifecycle.', 'Published, Filled, Closed', 'src/types.ts', 'Separate Job Lifecycle and Publication Status into two fields.', 'Migrate existing JobStatus to JobLifecycle and JobVisibility.', 'High'],
    ['GAP_002', 'Medium', 'Candidate-Job', 'Application', 'Duplicate state tracking', 'ApplicationStage and ApplicationSubstate heavily overlap.', 'Some substates describe Interview statuses instead of application state.', 'Recruiters might see contradictory sub-states if an interview is cancelled.', 'High synchronization overhead.', 'ApplicationSubstate', 'src/context/AppContext.tsx', 'Deprecate ApplicationSubstate. Derive granular state dynamically from Interviews and Offers.', 'Remove ApplicationSubstate, replace with computed properties in UI.', 'High'],
    ['GAP_003', 'Low', 'Offer', 'Offer', 'Mixed Version/Lifecycle Status', 'Revised Draft is a distinct status.', 'Offer status is used to track revision history instead of purely lifecycle.', 'Tracking active vs historical offers is complex.', 'High risk of querying stale offers.', 'Revised Draft, Superseded', 'src/types.ts', 'Use a separate isLatest flag or version number field.', 'Implement robust version tracking mechanism on the Offer object.', 'High'],
]
create_table(ws7, "GapsAndContradictions", h7, d7)


# --- Sheet 8: Source References ---
ws8 = wb.create_sheet("Source References")
h8 = ['Reference ID', 'Module', 'Entity', 'File Path', 'Symbol/Component', 'Line or Range', 'Reference Type', 'Statuses Covered', 'Notes']
d8 = [
    ['REF_001', 'All', 'All', 'src/types.ts', 'ApplicationStage', '9-20', 'Type Definition', 'All stages', 'Primary source of truth for types.'],
    ['REF_002', 'Candidate-Job', 'Application', 'src/context/AppContext.tsx', 'updateApplicationStage', '735', 'State Mutator', 'All stages', 'Main state mutator.'],
    ['REF_003', 'Job', 'Job', 'src/types.ts', 'JobStatus', '6', 'Type Definition', 'Draft, Published, Paused, Filled, Closed', 'Job lifecycle definition.'],
    ['REF_004', 'Interview', 'Interview', 'src/types.ts', 'InterviewStatus', '35', 'Type Definition', 'Scheduled, Completed, Cancelled, Rescheduled, No Show', 'Interview lifecycle.'],
]
create_table(ws8, "SourceReferences", h8, d8)

os.makedirs('docs', exist_ok=True)
wb.save("docs/SPC_Recruitment_Status_Inventory.xlsx")
print("Saved docs/SPC_Recruitment_Status_Inventory.xlsx")
