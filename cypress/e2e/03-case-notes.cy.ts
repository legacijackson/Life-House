describe('Case Notes Management', () => {
  beforeEach(() => {
    cy.loginAs('CaseManager');
    cy.seedTestData();
    cy.visit('/app/case-notes');
    cy.waitForApi();
  });

  afterEach(() => {
    cy.cleanTestData();
  });

  it('should display case notes list', () => {
    cy.contains('Case Notes');
    cy.get('[data-testid="case-notes-list"]').should('be.visible');
    cy.get('[data-testid="case-note-item"]').should('have.length.at.least', 1);
  });

  it('should allow creating new case note', () => {
    cy.get('[data-testid="add-case-note-button"]').click();
    cy.get('[data-testid="case-note-form-modal"]').should('be.visible');
    
    // Fill in case note form
    cy.get('select[name="residentId"]').select('John Doe');
    cy.get('input[name="title"]').type('Progress Update');
    cy.get('textarea[name="content"]').type('Resident is making excellent progress on their goals.');
    cy.get('select[name="category"]').select('General');
    
    cy.get('[data-testid="submit-case-note"]').click();
    cy.contains('Case note created successfully');
    cy.get('[data-testid="case-note-item"]').should('contain', 'Progress Update');
  });

  it('should allow AI-assisted case note creation', () => {
    cy.get('[data-testid="add-case-note-button"]').click();
    cy.get('[data-testid="ai-assist-button"]').click();
    
    cy.get('[data-testid="ai-prompt-input"]').type('Client attended job interview and showed confidence');
    cy.get('[data-testid="generate-note"]').click();
    
    cy.get('[data-testid="ai-generated-content"]').should('be.visible');
    cy.get('[data-testid="accept-ai-note"]').click();
    
    cy.get('textarea[name="content"]').should('not.be.empty');
  });

  it('should allow filtering case notes by resident', () => {
    cy.get('[data-testid="resident-filter"]').select('John Doe');
    cy.get('[data-testid="case-note-item"]').each(($note) => {
      cy.wrap($note).should('contain', 'John Doe');
    });
  });

  it('should allow editing case notes', () => {
    cy.get('[data-testid="case-note-item"]').first().click();
    cy.get('[data-testid="edit-case-note-button"]').click();
    
    cy.get('textarea[name="content"]').clear().type('Updated case note content');
    cy.get('[data-testid="save-case-note"]').click();
    
    cy.contains('Case note updated successfully');
    cy.get('[data-testid="case-note-content"]').should('contain', 'Updated case note content');
  });

  it('should handle private case notes properly', () => {
    cy.get('[data-testid="add-case-note-button"]').click();
    cy.get('input[name="isPrivate"]').check();
    
    cy.get('input[name="title"]').type('Private Note');
    cy.get('textarea[name="content"]').type('This is a private case note');
    cy.get('[data-testid="submit-case-note"]').click();
    
    cy.get('[data-testid="case-note-item"]').should('contain', 'Private');
  });
});