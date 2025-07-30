import { describe, it, expect } from 'vitest';
import { hasPermission, getAccessibleRoutes, filterSidebarItems } from '../lib/rbac';

describe('RBAC Utilities', () => {
  describe('hasPermission', () => {
    it('should grant admin full access', () => {
      expect(hasPermission('Admin', 'residents', 'create')).toBe(true);
      expect(hasPermission('Admin', 'case-notes', 'delete')).toBe(true);
      expect(hasPermission('Admin', 'any-resource', 'any-action')).toBe(true);
    });

    it('should grant auditor read-only access', () => {
      expect(hasPermission('Auditor', 'residents', 'view')).toBe(true);
      expect(hasPermission('Auditor', 'case-notes', 'view')).toBe(true);
      expect(hasPermission('Auditor', 'residents', 'create')).toBe(false);
      expect(hasPermission('Auditor', 'case-notes', 'delete')).toBe(false);
    });

    it('should limit resident permissions', () => {
      expect(hasPermission('Resident', 'profile', 'view')).toBe(true);
      expect(hasPermission('Resident', 'profile', 'edit')).toBe(true);
      expect(hasPermission('Resident', 'case-notes', 'view')).toBe(true);
      expect(hasPermission('Resident', 'case-notes', 'create')).toBe(false);
      expect(hasPermission('Resident', 'residents', 'view')).toBe(false);
    });

    it('should grant case manager appropriate permissions', () => {
      expect(hasPermission('CaseManager', 'residents', 'view')).toBe(true);
      expect(hasPermission('CaseManager', 'residents', 'edit')).toBe(true);
      expect(hasPermission('CaseManager', 'case-notes', 'create')).toBe(true);
      expect(hasPermission('CaseManager', 'case-notes', 'delete')).toBe(true);
      expect(hasPermission('CaseManager', 'reports', 'generate')).toBe(true);
    });

    it('should limit intake staff permissions', () => {
      expect(hasPermission('Intake', 'applications', 'create')).toBe(true);
      expect(hasPermission('Intake', 'referrals', 'edit')).toBe(true);
      expect(hasPermission('Intake', 'residents', 'create')).toBe(true);
      expect(hasPermission('Intake', 'reports', 'generate')).toBe(false);
    });

    it('should limit referrer permissions', () => {
      expect(hasPermission('Referrer', 'referrals', 'create')).toBe(true);
      expect(hasPermission('Referrer', 'resources', 'view')).toBe(true);
      expect(hasPermission('Referrer', 'residents', 'view')).toBe(false);
      expect(hasPermission('Referrer', 'case-notes', 'view')).toBe(false);
    });
  });

  describe('getAccessibleRoutes', () => {
    it('should return correct routes for residents', () => {
      const routes = getAccessibleRoutes('Resident');
      expect(routes).toContain('/app');
      expect(routes).toContain('/app/resident-portal');
      expect(routes).not.toContain('/app/residents');
      expect(routes).not.toContain('/app/admin-panel');
    });

    it('should return correct routes for case managers', () => {
      const routes = getAccessibleRoutes('CaseManager');
      expect(routes).toContain('/app');
      expect(routes).toContain('/app/residents');
      expect(routes).toContain('/app/case-notes');
      expect(routes).toContain('/app/staff-dashboard');
      expect(routes).not.toContain('/app/admin-panel');
    });

    it('should return all routes for admin', () => {
      const routes = getAccessibleRoutes('Admin');
      expect(routes).toContain('/app');
      expect(routes).toContain('/app/residents');
      expect(routes).toContain('/app/case-notes');
      expect(routes).toContain('/app/admin-panel');
      expect(routes).toContain('/app/staff-dashboard');
    });
  });

  describe('filterSidebarItems', () => {
    const mockSidebarItems = [
      { href: '/app/residents', title: 'Residents' },
      { href: '/app/case-notes', title: 'Case Notes' },
      { href: '/app/admin-panel', title: 'Admin Panel' },
      { href: '/app/resident-portal', title: 'Resident Portal' }
    ];

    it('should filter items for residents', () => {
      const filtered = filterSidebarItems(mockSidebarItems, 'Resident');
      expect(filtered.length).toBeLessThan(mockSidebarItems.length);
      expect(filtered.find(item => item.href === '/app/resident-portal')).toBeDefined();
      expect(filtered.find(item => item.href === '/app/residents')).toBeUndefined();
    });

    it('should show all items for admin', () => {
      const filtered = filterSidebarItems(mockSidebarItems, 'Admin');
      expect(filtered.length).toBe(mockSidebarItems.length);
    });
  });
});