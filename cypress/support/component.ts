// Cypress Component Testing support file
import './commands';

// Component testing configuration - mount command will be available after cypress install
declare global {
  namespace Cypress {
    interface Chainable {
      mount: any;
    }
  }
}

// Global styles for component testing
import '../../client/src/index.css';