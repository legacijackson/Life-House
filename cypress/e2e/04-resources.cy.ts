describe('Resource Management', () => {
  beforeEach(() => {
    cy.loginAs('CaseManager');
    cy.seedTestData();
    cy.visit('/app/resources');
    cy.waitForApi();
  });

  afterEach(() => {
    cy.cleanTestData();
  });

  it('should display resources list', () => {
    cy.contains('Community Resources');
    cy.get('[data-testid="resources-list"]').should('be.visible');
    cy.get('[data-testid="resource-card"]').should('have.length.at.least', 1);
  });

  it('should allow searching resources', () => {
    cy.get('[data-testid="resource-search"]').type('Job Training');
    cy.get('[data-testid="resource-card"]').should('contain', 'Job Training');
  });

  it('should allow filtering resources by category', () => {
    cy.get('[data-testid="category-filter"]').select('Employment');
    cy.get('[data-testid="resource-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'Employment');
    });
  });

  it('should allow adding new resource', () => {
    cy.get('[data-testid="add-resource-button"]').click();
    cy.get('[data-testid="resource-form-modal"]').should('be.visible');
    
    // Fill in resource form
    cy.get('input[name="name"]').type('New Community Center');
    cy.get('select[name="category"]').select('Housing');
    cy.get('textarea[name="description"]').type('Provides temporary housing assistance');
    cy.get('input[name="location"]').type('123 Main St');
    cy.get('input[name="phone"]').type('555-1234');
    cy.get('input[name="email"]').type('info@center.org');
    
    cy.get('[data-testid="submit-resource"]').click();
    cy.contains('Resource added successfully');
    cy.get('[data-testid="resource-card"]').should('contain', 'New Community Center');
  });

  it('should show resource availability status', () => {
    cy.get('[data-testid="resource-card"]').first().within(() => {
      cy.get('[data-testid="availability-status"]').should('be.visible');
    });
  });

  it('should allow referring residents to resources', () => {
    cy.get('[data-testid="resource-card"]').first().click();
    cy.get('[data-testid="refer-resident-button"]').click();
    
    cy.get('[data-testid="refer-modal"]').should('be.visible');
    cy.get('select[name="residentId"]').select('John Doe');
    cy.get('textarea[name="notes"]').type('Resident needs job training assistance');
    
    cy.get('[data-testid="submit-referral"]').click();
    cy.contains('Referral created successfully');
  });

  it('should display resource contact information', () => {
    cy.get('[data-testid="resource-card"]').first().click();
    cy.get('[data-testid="resource-details"]').should('be.visible');
    cy.get('[data-testid="contact-info"]').should('contain', '555');
  });
});