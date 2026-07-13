import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-8">
          Your account permissions do not allow you to access this administration page.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="w-full py-3 px-4 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
