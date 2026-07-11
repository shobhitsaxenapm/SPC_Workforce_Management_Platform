import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientsList from './components/ClientsList';
import ClientDetail from './components/ClientDetail';
import RequirementsList from './components/RequirementsList';
import RequirementDetail from './components/RequirementDetail';
import JobsList from './components/JobsList';
import JobDetail from './components/JobDetail';
import CandidatesList from './components/CandidatesList';
import CandidateDetail from './components/CandidateDetail';
import InterviewsList from './components/InterviewsList';
import OffersList from './components/OffersList';
import TalentPoolList from './components/TalentPoolList';
import Settings from './components/Settings';
import UsersList from './components/UsersList';
import CareersAdmin from './components/CareersAdmin';
import CareersPage from './components/CareersPage';
import Reports from './components/Reports';

// Operations
import OnboardingList from './components/OnboardingList';
import EmployeesList from './components/EmployeesList';
import DeploymentsList from './components/DeploymentsList';
import AttendanceList from './components/AttendanceList';
import BillingList from './components/BillingList';
import OffboardingList from './components/OffboardingList';

export default function App() {
  return (
    <Routes>
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        
        <Route path="clients" element={<ClientsList />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        
        <Route path="requirements" element={<RequirementsList />} />
        <Route path="requirements/:id" element={<RequirementDetail />} />
        
        <Route path="jobs" element={<JobsList />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        
        <Route path="candidates" element={<CandidatesList />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        
        <Route path="interviews" element={<InterviewsList />} />
        <Route path="offers" element={<OffersList />} />
        <Route path="talent-pool" element={<TalentPoolList />} />
        
        {/* Operations */}
        <Route path="onboarding" element={<OnboardingList />} />
        <Route path="employees" element={<EmployeesList />} />
        <Route path="deployments" element={<DeploymentsList />} />
        <Route path="attendance" element={<AttendanceList />} />
        <Route path="billing" element={<BillingList />} />
        <Route path="offboarding" element={<OffboardingList />} />
        
        <Route path="reports" element={<Reports />} />
        <Route path="careers-page" element={<CareersAdmin />} />
        
        <Route path="users" element={<UsersList />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
