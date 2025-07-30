// Custom Cypress commands for Life House application

Cypress.Commands.add('loginAs', (role) => {
  // Mock authentication by setting user role in localStorage
  const userData = {
    'Resident': { 
      id: 'resident-1', 
      name: 'John Doe', 
      email: 'john.doe@example.com', 
      role: 'Resident' 
    },
    'CaseManager': { 
      id: 'cm-1', 
      name: 'Sarah Williams', 
      email: 'sarah.williams@lifehouse.org', 
      role: 'CaseManager' 
    },
    'Admin': { 
      id: 'admin-1', 
      name: 'Admin User', 
      email: 'admin@lifehouse.org', 
      role: 'Admin' 
    },
    'Intake': { 
      id: 'intake-1', 
      name: 'Maria Garcia', 
      email: 'maria.garcia@lifehouse.org', 
      role: 'Intake' 
    },
    'Referrer': { 
      id: 'referrer-1', 
      name: 'David Chen', 
      email: 'david.chen@community.org', 
      role: 'Referrer' 
    },
    'Auditor': { 
      id: 'auditor-1', 
      name: 'Janet Smith', 
      email: 'janet.smith@auditor.com', 
      role: 'Auditor' 
    }
  };

  cy.window().then((win) => {
    win.localStorage.setItem('lifehouse_user', JSON.stringify(userData[role]));
  });
  
  // Intercept the current user API call with the selected role
  cy.intercept('GET', '/api/users/current', userData[role]).as('mockAuth');
});

Cypress.Commands.add('waitForApi', () => {
  cy.wait(['@getCurrentUser'], { timeout: 10000 });
});

Cypress.Commands.add('seedTestData', () => {
  // Seed database with test data via API
  cy.request('POST', '/api/test/seed', {
    residents: 5,
    caseNotes: 20,
    resources: 10,
    maintenance: 8
  });
});

Cypress.Commands.add('cleanTestData', () => {
  // Clean test data from database
  cy.request('POST', '/api/test/clean');
});