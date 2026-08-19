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
import Settings from './components/Settings';
import UsersList from './components/UsersList';
import CareersAdmin from './components/CareersAdmin';
import CareersPage from './components/CareersPage';
import Reports from './components/Reports';
import Login from './components/Login';
import Unauthorized from './components/Unauthorized';
import RouteGuard from './components/RouteGuard';

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
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/jobs" element={<CareersPage />} />
      
      <Route path="/" element={<RouteGuard><Layout /></RouteGuard>}>
        <Route index element={<Dashboard />} />
        
        <Route path="clients" element={<ClientsList />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        
        <Route path="requirements" element={<RequirementsList />} />
        <Route path="requirements/:id" element={<RequirementDetail />} />
        
        <Route path="job-desk" element={<JobsList />} />
        <Route path="job-desk/:id" element={<JobDetail />} />
        
        <Route path="candidates" element={<CandidatesList />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        
        <Route path="interviews" element={<InterviewsList />} />
        <Route path="offers" element={<OffersList />} />
        
        {/* Operations */}
        <Route path="onboarding" element={<OnboardingList />} />
        <Route path="employees" element={<EmployeesList />} />
        <Route path="deployments" element={<DeploymentsList />} />
        <Route path="attendance" element={<AttendanceList />} />
        <Route path="billing" element={<BillingList />} />
        <Route path="offboarding" element={<OffboardingList />} />
        
        <Route path="reports" element={<Reports />} />
        <Route path="careers-page" element={<CareersAdmin />} />
        
        <Route path="users" element={
          <RouteGuard allowedRoles={['ADMIN']}>
            <UsersList />
          </RouteGuard>
        } />
        
        <Route path="settings" element={
          <RouteGuard allowedRoles={['ADMIN']}>
            <Settings />
          </RouteGuard>
        } />
      </Route>
    </Routes>
  );
}
