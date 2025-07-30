describe('Resident Management', () => {
  beforeEach(() => {
    cy.loginAs('CaseManager');
    cy.seedTestData();
    cy.visit('/app/residents');
    cy.waitForApi();
  });

  afterEach(() => {
    cy.cleanTestData();
  });

  it('should display residents list', () => {
    cy.contains('Residents');
    cy.get('[data-testid="residents-list"]').should('be.visible');
    cy.get('[data-testid="resident-card"]').should('have.length.at.least', 1);
  });

  it('should allow searching residents', () => {
    cy.get('[data-testid="resident-search"]').type('John');
    cy.get('[data-testid="resident-card"]').should('contain', 'John');
  });

  it('should allow filtering residents by status', () => {
    cy.get('[data-testid="status-filter"]').click();
    cy.get('[data-testid="status-active"]').click();
    cy.get('[data-testid="resident-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'Active');
    });
  });

  it('should open resident profile on click', () => {
    cy.get('[data-testid="resident-card"]').first().click();
    cy.url().should('include', '/app/residents/');
    cy.contains('Resident Profile');
    cy.get('[data-testid="resident-details"]').should('be.visible');
  });

  it('should allow adding new resident', () => {
    cy.get('[data-testid="add-resident-button"]').click();
    cy.get('[data-testid="resident-form-modal"]').should('be.visible');
    
    // Fill in resident form
    cy.get('input[name="firstName"]').type('Jane');
    cy.get('input[name="lastName"]').type('Smith');
    cy.get('input[name="email"]').type('jane.smith@example.com');
    cy.get('input[name="phone"]').type('555-0123');
    cy.get('input[name="dateOfBirth"]').type('1988-05-10');
    
    cy.get('[data-testid="submit-resident"]').click();
    cy.contains('Resident added successfully');
    cy.get('[data-testid="resident-card"]').should('contain', 'Jane Smith');
  });

  it('should allow editing resident information', () => {
    cy.get('[data-testid="resident-card"]').first().click();
    cy.get('[data-testid="edit-resident-button"]').click();
    
    cy.get('input[name="phone"]').clear().type('555-9999');
    cy.get('[data-testid="save-resident"]').click();
    
    cy.contains('Resident updated successfully');
    cy.get('[data-testid="resident-details"]').should('contain', '555-9999');
  });
});