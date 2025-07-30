describe('Public Forms', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Housing Application', () => {
    it('should complete housing application flow', () => {
      cy.get('[data-testid="apply-now-button"]').click();
      cy.get('[data-testid="application-modal"]').should('be.visible');
      
      // Step 1: Personal Information
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Applicant');
      cy.get('input[name="email"]').type('john.applicant@example.com');
      cy.get('input[name="phone"]').type('555-0123');
      cy.get('input[name="dateOfBirth"]').type('1985-05-15');
      cy.get('[data-testid="next-step"]').click();
      
      // Step 2: Justice Status
      cy.get('select[name="justiceStatus"]').select('Formerly Incarcerated');
      cy.get('input[name="releaseDate"]').type('2024-01-01');
      cy.get('[data-testid="next-step"]').click();
      
      // Step 3: Housing History
      cy.get('select[name="currentLivingSituation"]').select('Temporary Housing');
      cy.get('textarea[name="housingHistory"]').type('Currently staying at temporary shelter');
      cy.get('[data-testid="next-step"]').click();
      
      // Step 4: Support Network
      cy.get('input[name="emergencyContactName"]').type('Jane Doe');
      cy.get('input[name="emergencyContactPhone"]').type('555-0456');
      cy.get('input[name="emergencyContactRelation"]').type('Sister');
      cy.get('[data-testid="next-step"]').click();
      
      // Step 5: Goals & Needs
      cy.get('textarea[name="goals"]').type('Find stable housing and employment');
      cy.get('textarea[name="additionalNeeds"]').type('Job training and counseling services');
      cy.get('[data-testid="submit-application"]').click();
      
      cy.contains('Application submitted successfully');
      cy.contains('Thank you for your application');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="apply-now-button"]').click();
      cy.get('[data-testid="next-step"]').click();
      
      cy.contains('First name is required');
      cy.contains('Last name is required');
      cy.contains('Email is required');
    });
  });

  describe('Program Inquiry', () => {
    it('should submit program inquiry', () => {
      cy.get('[data-testid="learn-more-button"]').click();
      cy.get('[data-testid="inquiry-modal"]').should('be.visible');
      
      cy.get('input[name="name"]').type('Sarah Johnson');
      cy.get('input[name="email"]').type('sarah.johnson@example.com');
      cy.get('input[name="phone"]').type('555-0789');
      cy.get('select[name="inquiryType"]').select('General Information');
      cy.get('textarea[name="message"]').type('I would like to learn more about your programs');
      
      cy.get('[data-testid="submit-inquiry"]').click();
      cy.contains('Inquiry submitted successfully');
    });
  });

  describe('Donation System', () => {
    it('should process donation form', () => {
      cy.get('[data-testid="donate-button"]').click();
      cy.get('[data-testid="donation-modal"]').should('be.visible');
      
      // Select donation amount
      cy.get('[data-testid="amount-50"]').click();
      
      // Fill donor information
      cy.get('input[name="donorName"]').type('Michael Smith');
      cy.get('input[name="donorEmail"]').type('michael.smith@example.com');
      cy.get('input[name="donorPhone"]').type('555-1234');
      
      // Mock Stripe payment
      cy.intercept('POST', '/api/donate', { statusCode: 200, body: { success: true } });
      
      cy.get('[data-testid="submit-donation"]').click();
      cy.contains('Thank you for your donation');
    });
  });

  describe('Referral Portal', () => {
    it('should submit organization referral', () => {
      cy.get('[data-testid="referral-portal-button"]').click();
      cy.get('[data-testid="referral-modal"]').should('be.visible');
      
      // Organization information
      cy.get('input[name="organizationName"]').type('Community Health Center');
      cy.get('input[name="contactName"]').type('Dr. Lisa Brown');
      cy.get('input[name="contactEmail"]').type('lisa.brown@health.org');
      cy.get('input[name="contactPhone"]').type('555-2468');
      
      // Client information
      cy.get('input[name="clientFirstName"]').type('Robert');
      cy.get('input[name="clientLastName"]').type('Wilson');
      cy.get('input[name="clientEmail"]').type('robert.wilson@example.com');
      cy.get('select[name="justiceStatus"]').select('Pre-Trial');
      cy.get('textarea[name="referralReason"]').type('Client needs transitional housing support');
      
      cy.get('[data-testid="submit-referral"]').click();
      cy.contains('Referral submitted successfully');
    });
  });
});