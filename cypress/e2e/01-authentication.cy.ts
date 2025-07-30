describe('Authentication & Authorization', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display landing page for unauthenticated users', () => {
    cy.contains('Life House');
    cy.contains('Empowering Lives Through Housing');
    cy.get('[data-testid="apply-now-button"]').should('be.visible');
    cy.get('[data-testid="staff-login-button"]').should('be.visible');
  });

  it('should allow staff login and redirect to dashboard', () => {
    cy.get('[data-testid="staff-login-button"]').click();
    cy.get('[data-testid="login-modal"]').should('be.visible');
    
    // Fill in login form
    cy.get('input[name="email"]').type('sarah.williams@lifehouse.org');  
    cy.get('input[name="password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/app');
    cy.contains('Dashboard');
  });

  describe('Role-Based Access Control', () => {
    it('should show resident-only features for residents', () => {
      cy.loginAs('Resident');
      cy.visit('/app');
      cy.waitForApi();
      
      // Resident should see their dashboard
      cy.contains('Resident Portal');
      cy.get('[data-testid="maintenance-requests"]').should('be.visible');
      cy.get('[data-testid="savings-tracker"]').should('be.visible');
      
      // Should not see case management features
      cy.get('[data-testid="residents-list"]').should('not.exist');
    });

    it('should show case manager features for case managers', () => {
      cy.loginAs('CaseManager');
      cy.visit('/app');
      cy.waitForApi();
      
      // Case manager should see full dashboard
      cy.contains('Dashboard');
      cy.get('[data-testid="residents-count"]').should('be.visible');
      cy.get('[data-testid="case-notes-count"]').should('be.visible');
      
      // Should have access to residents page
      cy.visit('/app/residents');
      cy.contains('Residents');
      cy.get('[data-testid="residents-list"]').should('be.visible');
    });

    it('should show admin features for admin users', () => {
      cy.loginAs('Admin');
      cy.visit('/app');
      cy.waitForApi();
      
      // Admin should see all features
      cy.visit('/app/admin-panel');
      cy.contains('Admin Panel');
      cy.get('[data-testid="admin-settings"]').should('be.visible');
    });

    it('should restrict access based on permissions', () => {
      cy.loginAs('Resident');
      
      // Residents should not access admin panel
      cy.visit('/app/admin-panel');
      cy.contains('Access Denied').or(cy.url().should('include', '/app'));
      
      // Residents should not access staff dashboard
      cy.visit('/app/staff-dashboard');
      cy.contains('Access Denied').or(cy.url().should('include', '/app'));
    });
  });
});