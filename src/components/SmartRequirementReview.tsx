import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ExtractedRequirementData, RequirementSourceMetadata, Priority, Client } from '../types';
import { AlertTriangle, CheckCircle, Info, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { cn } from '../lib/utils';

interface SmartRequirementReviewProps {
  extractedDataArray: ExtractedRequirementData[];
  sourceText: string;
  metadata: RequirementSourceMetadata;
  onSaveAsDraft: () => void;
  onDiscard: () => void;
}

export default function SmartRequirementReview({ extractedDataArray, sourceText, metadata, onSaveAsDraft, onDiscard }: SmartRequirementReviewProps) {
  const { clients, currentUser, createRequirement, createClient } = useApp();

  // Roles State
  const [roles, setRoles] = useState(
    extractedDataArray.map((ext, idx) => ({
      id: `role_${idx}`,
      selected: true,
      clientId: '',
      roleTitle: ext.roleTitle || '',
      title: ext.businessUnit || '',
      projectName: ext.projectName || '',
      locations: ext.locations?.join(', ') || '',
      positionsRequired: ext.positionsRequired || 1,
      employmentType: ext.employmentType || 'Full-time',
      contractDuration: ext.contractDuration || '',
      targetJoiningDate: ext.targetJoiningDate || '',
      priority: (['Critical', 'High', 'Medium', 'Low'].includes(ext.priority || '') ? ext.priority : 'Medium') as Priority,
      requiredSkills: ext.requiredSkills?.join(', ') || '',
      preferredSkills: ext.preferredSkills?.join(', ') || '',
      assignedRecruiterId: currentUser?.id || '',
      notes: ext.notes || '',
      _extractedClientName: ext.clientName || '',
    }))
  );

  const [globalClientId, setGlobalClientId] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState<any>('OTHER');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Attempt global client match based on the first role's client name
    const firstClientName = roles[0]?._extractedClientName;
    if (firstClientName) {
      const match = clients.find(c => c.name.toLowerCase() === firstClientName.toLowerCase());
      if (match) {
        setGlobalClientId(match.id);
        setRoles(prev => prev.map(r => ({ ...r, clientId: match.id })));
      }
    }
  }, []);

  const handleGlobalClientChange = (id: string) => {
    setGlobalClientId(id);
    setRoles(prev => prev.map(r => ({ ...r, clientId: id })));
  };

  const handleCreateNewClient = () => {
    if (!newClientName.trim()) return;
    const res = createClient({
      name: newClientName,
      industry: newClientIndustry,
      primaryContactName: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
      locations: [],
      activeRequirementsCount: 0,
      openPositionsCount: 0,
      lastActivity: new Date().toISOString()
    });
    
    if (res.success) {
      // The client list is updated, we need to find the newly created client
      // Since createClient is synchronous and updates local state/storage, we can wait a tick or just rely on the user to select it, but we can also just let the parent re-render.
      // For simplicity, we just close the form. The user can select it from the dropdown.
      setShowNewClientForm(false);
      setNewClientName('');
    } else {
      alert(res.error);
    }
  };

  const toggleRole = (id: string) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const updateRole = (id: string, field: string, value: any) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const selectedRoles = roles.filter(r => r.selected);
    
    if (selectedRoles.length === 0) {
      newErrors.general = 'You must select at least one role to save.';
    }

    selectedRoles.forEach((r, idx) => {
      if (!r.clientId) newErrors[`${r.id}_clientId`] = 'Client is required';
      if (!r.roleTitle) newErrors[`${r.id}_roleTitle`] = 'Role Title is required';
      if (!r.targetJoiningDate) newErrors[`${r.id}_targetJoiningDate`] = 'Target Date is required';
      if (r.positionsRequired < 1) newErrors[`${r.id}_positionsRequired`] = 'Positions must be >= 1';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    const selectedRoles = roles.filter(r => r.selected);
    const reqsToCreate = selectedRoles.map(r => ({
      clientId: r.clientId,
      title: r.title,
      roleTitle: r.roleTitle,
      projectName: r.projectName,
      locations: r.locations.split(',').map(s => s.trim()).filter(Boolean),
      positionsRequired: r.positionsRequired,
      employmentType: r.employmentType,
      contractDuration: r.contractDuration,
      targetJoiningDate: r.targetJoiningDate,
      priority: r.priority,
      assignedRecruiterId: r.assignedRecruiterId,
      notes: r.notes,
      sourceMetadata: metadata,
      status: 'Draft' as const // Enforce draft status per rule
    }));

    // Atomic creation support in AppContext
    createRequirement(reqsToCreate);
    onSaveAsDraft();
  };

  return (
    <div className="flex h-[800px] w-full max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      
      {/* Source Text Pane */}
      <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h3 className="font-semibold text-slate-800">Source Document</h3>
          <p className="text-xs text-slate-500 truncate">{metadata.originalFilename}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
            {sourceText}
          </pre>
        </div>
      </div>

      {/* Editable Form Pane */}
      <div className="w-2/3 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              Review Requirements
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{roles.length} Roles Detected</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Select and verify the roles you want to create.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onDiscard} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
              Discard
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Save Selected as Draft
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          
          {/* Client Resolution Card */}
          <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h4 className="font-semibold text-slate-800 mb-2">Global Client Resolution</h4>
            <p className="text-sm text-slate-600 mb-4">Select the client for these requirements. The AI detected: <span className="font-semibold text-slate-900">"{roles[0]?._extractedClientName || 'Unknown'}"</span></p>
            
            {!showNewClientForm ? (
              <div className="flex items-center gap-3">
                <select 
                  value={globalClientId}
                  onChange={(e) => handleGlobalClientChange(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 p-2.5 text-sm"
                >
                  <option value="">-- Select Existing Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                  ))}
                </select>
                <span className="text-sm text-slate-500">or</span>
                <button 
                  onClick={() => setShowNewClientForm(true)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Create New Client
                </button>
              </div>
            ) : (
              <div className="flex items-end gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">New Client Name</label>
                  <input 
                    type="text" 
                    value={newClientName} 
                    onChange={e => setNewClientName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-sm"
                    placeholder="Enter client name"
                  />
                </div>
                <button 
                  onClick={handleCreateNewClient}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Client
                </button>
                <button 
                  onClick={() => setShowNewClientForm(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {errors.general && (
              <p className="text-red-500 text-sm mt-3 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {errors.general}</p>
            )}
          </div>

          {/* Multiple Roles List */}
          {roles.map((role, index) => (
            <div key={role.id} className={cn("bg-white p-6 rounded-xl border shadow-sm transition-all", role.selected ? "border-slate-200" : "border-slate-200 opacity-60")}>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleRole(role.id)} className="text-slate-500 hover:text-blue-600 focus:outline-none">
                    {role.selected ? <CheckSquare className="w-6 h-6 text-blue-600" /> : <Square className="w-6 h-6" />}
                  </button>
                  <h4 className="font-semibold text-slate-800">Role {index + 1}: {role.roleTitle || 'Untitled Role'}</h4>
                </div>
                <button onClick={() => toggleRole(role.id)} className="text-xs text-slate-500 hover:text-slate-800">
                  {role.selected ? 'Exclude Role' : 'Include Role'}
                </button>
              </div>
              
              {role.selected && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Role Title <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={role.roleTitle} 
                        onChange={e => updateRole(role.id, 'roleTitle', e.target.value)}
                        className={cn("w-full rounded-md border p-2 text-sm", errors[`${role.id}_roleTitle`] ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Positions <span className="text-red-500">*</span></label>
                      <input 
                        type="number" 
                        value={role.positionsRequired} 
                        onChange={e => updateRole(role.id, 'positionsRequired', parseInt(e.target.value) || 1)}
                        className={cn("w-full rounded-md border p-2 text-sm", errors[`${role.id}_positionsRequired`] ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Locations</label>
                      <input 
                        type="text" 
                        value={role.locations} 
                        onChange={e => updateRole(role.id, 'locations', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-slate-50 p-2 text-sm"
                        placeholder="Comma separated"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Target Date <span className="text-red-500">*</span></label>
                      <input 
                        type="date" 
                        value={role.targetJoiningDate} 
                        onChange={e => updateRole(role.id, 'targetJoiningDate', e.target.value)}
                        className={cn("w-full rounded-md border p-2 text-sm", errors[`${role.id}_targetJoiningDate`] ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Project/Business</label>
                      <input 
                        type="text" 
                        value={role.projectName} 
                        onChange={e => updateRole(role.id, 'projectName', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-slate-50 p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Employment Type</label>
                      <select 
                        value={role.employmentType}
                        onChange={e => updateRole(role.id, 'employmentType', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-slate-50 p-2 text-sm"
                      >
                        <option>Full-time</option>
                        <option>Contract</option>
                        <option>Part-time</option>
                      </select>
                    </div>
                  </div>
                  
                  {errors[`${role.id}_clientId`] && (
                    <p className="text-red-500 text-xs mt-1">Client mapping is missing. Please select a Global Client.</p>
                  )}
                </div>
              )}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
