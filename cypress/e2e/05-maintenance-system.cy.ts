describe('Maintenance System', () => {
  beforeEach(() => {
    cy.loginAs('CaseManager');
    cy.seedTestData();
    cy.visit('/app/maintenance');
    cy.waitForApi();
  });

  afterEach(() => {
    cy.cleanTestData();
  });

  it('should display maintenance tickets', () => {
    cy.contains('Maintenance Tickets');
    cy.get('[data-testid="maintenance-list"]').should('be.visible');
  });

  it('should allow creating maintenance request', () => {
    cy.get('[data-testid="create-ticket-button"]').click();
    cy.get('[data-testid="maintenance-form-modal"]').should('be.visible');
    
    // Fill in maintenance form
    cy.get('input[name="title"]').type('Broken faucet in bathroom');
    cy.get('textarea[name="description"]').type('The faucet is leaking and needs repair');
    cy.get('select[name="priority"]').select('Medium');
    cy.get('select[name="category"]').select('Plumbing');
    cy.get('input[name="location"]').type('Room 101');
    
    cy.get('[data-testid="submit-ticket"]').click();
    cy.contains('Maintenance request created');
    cy.get('[data-testid="ticket-item"]').should('contain', 'Broken faucet');
  });

  it('should allow filtering tickets by status', () => {
    cy.get('[data-testid="status-filter"]').select('Open');
    cy.get('[data-testid="ticket-item"]').each(($ticket) => {
      cy.wrap($ticket).should('contain', 'Open');
    });
  });

  it('should allow filtering tickets by priority', () => {
    cy.get('[data-testid="priority-filter"]').select('High');
    cy.get('[data-testid="ticket-item"]').each(($ticket) => {
      cy.wrap($ticket).should('contain', 'High');
    });
  });

  it('should allow updating ticket status', () => {
    cy.get('[data-testid="ticket-item"]').first().click();
    cy.get('[data-testid="status-dropdown"]').select('In Progress');
    cy.get('[data-testid="update-status"]').click();
    
    cy.contains('Status updated');
    cy.get('[data-testid="ticket-status"]').should('contain', 'In Progress');
  });

  it('should allow adding comments to tickets', () => {
    cy.get('[data-testid="ticket-item"]').first().click();
    cy.get('[data-testid="add-comment-button"]').click();
    
    cy.get('textarea[name="comment"]').type('Work has begun on this issue');
    cy.get('[data-testid="submit-comment"]').click();
    
    cy.contains('Comment added');
    cy.get('[data-testid="ticket-comments"]').should('contain', 'Work has begun');
  });

  describe('Resident View', () => {
    beforeEach(() => {
      cy.loginAs('Resident');
      cy.visit('/app/resident-portal');
      cy.waitForApi();
    });

    it('should allow residents to create maintenance requests', () => {
      cy.get('[data-testid="maintenance-requests-section"]').within(() => {
        cy.get('[data-testid="create-request-button"]').click();
      });
      
      cy.get('[data-testid="maintenance-form-modal"]').should('be.visible');
      cy.get('input[name="title"]').type('Air conditioning not working');
      cy.get('textarea[name="description"]').type('AC unit is not cooling properly');
      cy.get('select[name="priority"]').select('High');
      
      cy.get('[data-testid="submit-ticket"]').click();
      cy.contains('Request submitted successfully');
    });

    it('should show resident their own maintenance requests', () => {
      cy.get('[data-testid="my-requests"]').should('be.visible');
      cy.get('[data-testid="request-item"]').should('have.length.at.least', 0);
    });
  });
});