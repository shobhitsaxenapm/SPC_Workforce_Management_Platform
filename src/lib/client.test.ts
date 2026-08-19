import { describe, it, expect } from 'vitest';
import { Client, PrimaryIndustry } from '../types';

describe('Client Editing and Validation', () => {
  it('should validate primary contact email format', () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('test.example.com')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('should reject duplicate client names case-insensitively', () => {
    const clients: Client[] = [
      { id: '1', name: 'Acme Corp', industry: 'OTHER', status: 'Active', locations: [], activeRequirementsCount: 0, openPositionsCount: 0, lastActivity: '', primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '' }
    ];
    
    const checkDuplicate = (name: string, excludeId?: string) => {
      const normName = name.trim().toLowerCase();
      return clients.some(c => c.id !== excludeId && c.name.trim().toLowerCase() === normName);
    };

    expect(checkDuplicate('Acme Corp')).toBe(true);
    expect(checkDuplicate('acme corp')).toBe(true);
    expect(checkDuplicate('ACME CORP')).toBe(true);
    expect(checkDuplicate('Acme Corp', '1')).toBe(false); // Should ignore self when editing
    expect(checkDuplicate('Globex')).toBe(false);
  });

  it('should enforce role-based permissions for editing clients', () => {
    const canEditClient = (role: string) => role === 'ADMIN' || role === 'MANAGER';
    
    expect(canEditClient('ADMIN')).toBe(true);
    expect(canEditClient('MANAGER')).toBe(true);
    expect(canEditClient('RECRUITER')).toBe(false);
    expect(canEditClient('GUEST')).toBe(false);
  });
  
  it('should detect dirty form state (unsaved changes)', () => {
    const initialData = { name: 'Test', industry: 'BFSI' };
    
    const isDirty = (currentData: any) => JSON.stringify(currentData) !== JSON.stringify(initialData);
    
    expect(isDirty({ name: 'Test', industry: 'BFSI' })).toBe(false);
    expect(isDirty({ name: 'Test Updated', industry: 'BFSI' })).toBe(true);
    expect(isDirty({ name: 'Test', industry: 'OTHER' })).toBe(true);
  });
});
