// Cypress E2E support file
import './commands';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing the test on uncaught exceptions
  // that are not critical to the test flow
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Custom commands for authentication
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login as different user roles
       */
      loginAs(role: 'Resident' | 'CaseManager' | 'Admin' | 'Intake' | 'Referrer' | 'Auditor'): Chainable<void>;
      
      /**
       * Wait for API calls to complete
       */
      waitForApi(): Chainable<void>;
      
      /**
       * Seed test data
       */
      seedTestData(): Chainable<void>;
      
      /**
       * Clean test data
       */
      cleanTestData(): Chainable<void>;
    }
  }
}

beforeEach(() => {
  // Intercept common API calls
  cy.intercept('GET', '/api/users/current', { fixture: 'currentUser.json' }).as('getCurrentUser');
  cy.intercept('GET', '/api/residents', { fixture: 'residents.json' }).as('getResidents');
  cy.intercept('GET', '/api/resources', { fixture: 'resources.json' }).as('getResources');
  cy.intercept('GET', '/api/case-notes', { fixture: 'caseNotes.json' }).as('getCaseNotes');
});