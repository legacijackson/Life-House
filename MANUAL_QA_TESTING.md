# Life House - Manual QA Testing Guide

This comprehensive manual testing guide covers all critical functionality of the Life House transitional housing case management system.

## Pre-Testing Setup

### Required Environment
- Server running on http://localhost:5000
- PostgreSQL database connected
- All background jobs running (Resource Crawler, STOP ARMS Reminder, etc.)
- OpenAI API key configured (if testing AI features)
- Stripe API key configured (if testing donations)

### Test Data Requirements
- At least 5 test residents with different statuses
- 10+ case notes across different categories  
- 5+ community resources in different categories
- 3+ maintenance tickets with different priorities
- Sample property and room data

## 1. Authentication & Authorization Testing

### 1.1 Landing Page (Unauthenticated)
**Test Steps:**
1. Navigate to http://localhost:5000
2. Verify Life House branding and logo display correctly
3. Check "Apply Now" button is visible and clickable
4. Check "Staff Login" button is visible and clickable
5. Verify responsive design on mobile/tablet
6. Test all navigation links work properly

**Expected Results:**
- Professional, culturally appropriate landing page
- All buttons functional and styled correctly
- Responsive design works across devices
- No authentication required to view public content

### 1.2 Staff Login
**Test Steps:**
1. Click "Staff Login" button
2. Verify login modal appears
3. Test with valid credentials (sarah.williams@lifehouse.org / password123)
4. Test with invalid credentials
5. Verify proper error messages for invalid login
6. Test "Forgot Password" functionality if implemented

**Expected Results:**
- Modal opens properly with form fields
- Valid login redirects to appropriate dashboard
- Invalid login shows clear error message
- Form validation works correctly

### 1.3 Role-Based Access Control
**Test for each role: Resident, Case Manager, Admin, Intake, Referrer, Auditor**

**Resident Access Test:**
1. Login as resident user
2. Navigate to /app/resident-portal
3. Verify access to: maintenance requests, savings tracker, resource browser
4. Try accessing /app/residents (should be denied)
5. Try accessing /app/admin-panel (should be denied)

**Case Manager Access Test:**
1. Login as case manager
2. Verify access to: residents, case notes, attendance, resources, reports
3. Test CRUD operations on residents and case notes
4. Verify cannot access admin-only features

**Admin Access Test:**
1. Login as admin user
2. Verify access to ALL system features
3. Test admin panel functionality
4. Verify can modify system settings

**Expected Results:**
- Each role sees only appropriate menu items
- Unauthorized pages show access denied or redirect
- Role-specific dashboards display correctly
- Permissions enforced at API level

## 2. Resident Management Testing

### 2.1 Resident List View
**Test Steps:**
1. Navigate to /app/residents as Case Manager/Admin
2. Verify resident list displays with key information
3. Test search functionality with different criteria
4. Test filtering by status (Active, Inactive, Discharged)
5. Test filtering by justice status
6. Test sorting by different columns
7. Verify pagination if many residents

**Expected Results:**
- Clean, organized list view with resident cards
- Search returns accurate results
- Filters work correctly and update URL
- Sorting functions properly
- Performance acceptable with large datasets

### 2.2 Resident Profile Management
**Test Steps:**
1. Click on a resident from the list
2. Verify complete profile information displays
3. Test editing resident information
4. Update emergency contact details
5. Modify justice status and admission date
6. Save changes and verify persistence
7. Test form validation for required fields

**Expected Results:**
- Complete resident profile loads quickly
- All information sections present and accurate
- Edit functionality works smoothly
- Changes save successfully
- Validation prevents invalid data entry

### 2.3 Add New Resident
**Test Steps:**
1. Click "Add Resident" button
2. Fill out complete resident form
3. Test all required field validations
4. Test email format validation
5. Test phone number formatting
6. Add emergency contact information
7. Submit form and verify resident appears in list

**Expected Results:**
- Form opens in modal or new page
- All validation rules enforced
- Successful submission creates resident
- New resident appears immediately in list
- Confirmation message displayed

## 3. Case Notes Management Testing

### 3.1 Case Notes List and Creation
**Test Steps:**
1. Navigate to /app/case-notes
2. Verify case notes display with author, date, resident
3. Test filtering by resident
4. Test filtering by category (General, Housing, Employment, etc.)
5. Test sorting by date, resident, category
6. Click "Add Case Note" button
7. Fill out form with all required fields
8. Test character limits and formatting
9. Save note and verify it appears in list

**Expected Results:**
- Notes list loads with proper formatting
- Filtering and sorting work accurately
- New note form validates properly
- Notes save successfully with metadata
- Real-time updates if multiple users

### 3.2 AI-Assisted Case Note Creation
**Test Steps:**
1. Start creating new case note
2. Click "AI Assist" button
3. Enter prompt describing resident interaction
4. Verify AI generates appropriate note content
5. Review and edit AI-generated content
6. Accept AI suggestion and complete note
7. Test various prompt types and scenarios

**Expected Results:**
- AI assistance loads quickly
- Generated content is relevant and professional
- User can edit before accepting
- Integration feels seamless
- Fallback if AI service unavailable

### 3.3 Private Case Notes
**Test Steps:**
1. Create case note marked as "Private"
2. Verify private indicator appears
3. Test that appropriate roles can/cannot view
4. Edit private note and maintain privacy setting
5. Test bulk privacy operations if available

**Expected Results:**
- Private notes clearly marked
- Access restricted based on role
- Privacy settings persist correctly
- Audit trail for private note access

## 4. Community Resources Testing

### 4.1 Resource Management
**Test Steps:**
1. Navigate to /app/resources
2. Verify resources display with categories
3. Test search by name, location, services
4. Test category filtering (Employment, Healthcare, Housing, etc.)
5. Test availability status filtering
6. Add new resource with complete information
7. Edit existing resource information
8. Test contact information accuracy

**Expected Results:**
- Resources display in organized cards/list
- Search and filtering work accurately
- New resources save with all details
- Contact information formatted properly
- Availability status updates correctly

### 4.2 Resource Referrals
**Test Steps:**
1. Click on a resource
2. Click "Refer Resident" button
3. Select resident from dropdown
4. Add referral notes and reasoning
5. Submit referral
6. Verify referral appears in resident profile
7. Test referral tracking and follow-up

**Expected Results:**
- Referral modal opens properly
- All residents available in dropdown
- Referral saves with complete information
- Tracking system works for follow-up
- Notifications sent as appropriate

### 4.3 Resource Availability Tracking
**Test Steps:**
1. Check current resource availability statuses
2. Test updating availability (Available/Unavailable)
3. Verify status changes reflect immediately
4. Test automated availability checking (if implemented)
5. Check historical availability data

**Expected Results:**
- Status updates save instantly
- Visual indicators clear and accurate
- Automated checks work reliably
- Historical data maintains integrity

## 5. Maintenance System Testing

### 5.1 Maintenance Ticket Creation
**Test Steps:**
1. Navigate to /app/maintenance
2. Click "Create Ticket" button
3. Fill out complete ticket information
4. Set priority level and category
5. Add location and detailed description
6. Attach photos if functionality exists
7. Submit ticket and verify creation

**Expected Results:**
- Ticket form captures all necessary information
- Priority and category options appropriate
- Location field helps with organization
- Ticket appears in list immediately
- Assignment workflow functions correctly

### 5.2 Ticket Management and Updates
**Test Steps:**
1. Open existing maintenance ticket
2. Update status (Open → In Progress → Completed)
3. Add work notes and time tracking
4. Upload completion photos if applicable
5. Assign ticket to maintenance staff
6. Test notification system for updates

**Expected Results:**
- Status updates save correctly
- Work notes maintain chronological order
- Assignment notifications work
- Completion tracking accurate
- Resident notifications appropriate

### 5.3 Resident Maintenance Portal
**Test Steps:**
1. Login as resident
2. Navigate to resident portal
3. Create new maintenance request
4. View status of submitted requests
5. Add comments or updates to existing requests
6. Test request priority guidelines

**Expected Results:**
- Residents can easily submit requests
- Status visibility appropriate for residents
- Communication channel works both ways
- Priority guidelines clear and helpful

## 6. Public Forms Testing

### 6.1 Housing Application Process
**Test Steps:**
1. Navigate to public site (logged out)
2. Click "Apply Now" button
3. Complete Step 1: Personal Information
4. Complete Step 2: Justice Status Information
5. Complete Step 3: Housing History
6. Complete Step 4: Support Network
7. Complete Step 5: Goals & Additional Needs
8. Submit complete application
9. Verify confirmation message and next steps

**Expected Results:**
- Multi-step wizard flows smoothly
- Each step validates before proceeding
- Progress indicator shows current step
- All information saves properly
- Confirmation provides clear next steps
- Staff notification of new application

### 6.2 Program Inquiry Form
**Test Steps:**
1. Click "Learn More" or inquiry button
2. Fill out inquiry form completely
3. Select appropriate inquiry type
4. Test form validation
5. Submit inquiry
6. Verify confirmation message

**Expected Results:**
- Form captures sufficient information
- Inquiry types cover common questions
- Staff receives inquiry for follow-up
- Confirmation reassures user

### 6.3 Donation Processing
**Test Steps:**
1. Click "Donate" button
2. Select donation amount or enter custom
3. Choose one-time or recurring
4. Fill out donor information
5. Select donation designation
6. Process payment through Stripe
7. Verify receipt generation
8. Test recurring donation setup

**Expected Results:**
- Payment processing secure and reliable
- Receipt generated immediately
- Donor information stored properly
- Recurring donations set up correctly
- Thank you messaging appropriate

### 6.4 Organization Referral Portal
**Test Steps:**
1. Access referral portal
2. Fill out organization information
3. Complete client referral details
4. Include reason for referral
5. Submit referral
6. Verify intake staff notification

**Expected Results:**
- Sufficient information collected
- Intake workflow triggered properly
- Communication with referring organization
- Referral tracking in system

## 7. Staff Dashboard and Reporting

### 7.1 Dashboard Metrics
**Test Steps:**
1. Login as Case Manager/Admin
2. Verify dashboard loads quickly
3. Check resident count accuracy
4. Verify case notes counter
5. Check maintenance ticket summary
6. Test resource availability overview
7. Verify recent activity feed

**Expected Results:**
- All counters display accurate numbers
- Charts and graphs load properly
- Recent activity shows relevant information
- Performance metrics helpful
- Real-time updates work

### 7.2 Report Generation
**Test Steps:**
1. Navigate to /app/reports
2. Select resident progress report
3. Choose date range
4. Apply filters as needed
5. Generate report
6. Download as PDF/Excel
7. Test different report types
8. Verify data accuracy in reports

**Expected Results:**
- Report generation completes successfully
- Data accuracy matches system records
- Export formats work properly
- Reports formatted professionally
- Performance acceptable for large datasets

### 7.3 STOP TouchPoint Tracking
**Test Steps:**
1. Verify STOP TouchPoint counter on dashboard
2. Test touchpoint logging functionality
3. Check reminder system for overdue touchpoints
4. Verify compliance reporting
5. Test automated notifications

**Expected Results:**
- Touchpoint tracking accurate
- Reminders sent appropriately  
- Compliance metrics correct
- Staff workflow efficient

## 8. System Administration

### 8.1 Admin Panel Access
**Test Steps:**
1. Login as Admin user
2. Navigate to /app/admin-panel
3. Verify access to all admin features
4. Test user management functionality
5. Check system configuration options
6. Test Slack webhook configuration
7. Verify S3 bucket configuration

**Expected Results:**
- Admin panel loads with all features
- User management works correctly
- System configurations save properly
- Integration settings function

### 8.2 Audit Logging
**Test Steps:**
1. Perform various actions in system
2. Check audit log for recorded actions
3. Verify user, timestamp, and action details
4. Test audit log filtering and search
5. Check data retention policies

**Expected Results:**
- All significant actions logged
- Log entries contain sufficient detail
- Search and filtering work properly
- Retention policies enforced

## 9. Background Job System

### 9.1 Resource Crawler
**Test Steps:**
1. Verify Resource Crawler runs every 6 hours
2. Check resource availability updates
3. Monitor crawler performance and logs
4. Test failure recovery and notifications

**Expected Results:**
- Crawler runs on schedule
- Resource statuses update correctly
- Error handling works properly
- Performance within acceptable limits

### 9.2 STOP ARMS Reminder System
**Test Steps:**
1. Verify reminders run every 4 hours during business hours
2. Check touchpoint reminder notifications
3. Test escalation for overdue touchpoints
4. Verify staff notification system

**Expected Results:**
- Reminders sent at correct times
- Staff receive appropriate notifications
- Escalation workflow functions
- Compliance maintained

### 9.3 Overdue Notes Watchdog
**Test Steps:**
1. Verify watchdog runs every 2 hours
2. Check detection of residents without recent notes
3. Test notification to case managers
4. Verify threshold settings work correctly

**Expected Results:**
- Overdue detection accurate
- Case manager notifications sent
- Threshold configuration works
- Follow-up tracking functions

## 10. Performance and Reliability

### 10.1 Load Testing
**Test Steps:**
1. Test with maximum expected concurrent users
2. Monitor response times under load
3. Test database performance with large datasets
4. Check memory usage and resource consumption
5. Verify system stability over extended periods

**Expected Results:**
- Response times remain acceptable
- System handles concurrent users properly
- Database queries optimized
- No memory leaks or resource issues
- System remains stable under load

### 10.2 Error Handling
**Test Steps:**
1. Test with invalid inputs across forms
2. Simulate network connectivity issues
3. Test database connection failures
4. Verify graceful handling of API failures
5. Check error message clarity for users

**Expected Results:**
- Invalid inputs handled gracefully
- Network issues don't crash system
- Database failures recovered properly
- API failures show helpful messages
- User experience maintained during errors

### 10.3 Data Integrity
**Test Steps:**
1. Verify all database constraints enforced
2. Test referential integrity between tables
3. Check data validation at all entry points
4. Test backup and recovery procedures
5. Verify audit trail completeness

**Expected Results:**
- Database constraints prevent invalid data
- Referential integrity maintained
- All data validated before storage
- Backup/recovery procedures work
- Complete audit trail for compliance

## 11. Security Testing

### 11.1 Authentication Security
**Test Steps:**
1. Test password strength requirements
2. Verify session timeout functionality
3. Test protection against brute force attacks
4. Check secure password reset process
5. Verify logout functionality

**Expected Results:**
- Strong password policies enforced
- Sessions timeout appropriately
- Brute force protection active
- Password reset secure and functional
- Complete logout clears session

### 11.2 Authorization Security
**Test Steps:**
1. Test role-based access controls
2. Verify API endpoint protection
3. Test direct URL access restrictions
4. Check data access permissions
5. Verify cross-user data isolation

**Expected Results:**
- Role permissions enforced consistently
- API endpoints require proper authorization
- Direct access attempts blocked
- Users see only authorized data
- No cross-user data leakage

### 11.3 Data Protection
**Test Steps:**
1. Verify sensitive data encryption
2. Test secure data transmission (HTTPS)
3. Check database security measures
4. Verify logging of security events
5. Test data anonymization procedures

**Expected Results:**
- Sensitive data encrypted at rest
- All transmission uses HTTPS
- Database access properly secured
- Security events logged appropriately
- Data anonymization works correctly

## Test Completion Checklist

### Critical Functionality ✅
- [ ] User authentication and authorization
- [ ] Resident management (CRUD operations)
- [ ] Case notes creation and management
- [ ] Resource management and referrals
- [ ] Maintenance ticket system
- [ ] Public forms (application, inquiry, donation, referral)
- [ ] Role-based access control
- [ ] Background job processing
- [ ] Dashboard and reporting
- [ ] Admin panel functionality

### Performance & Reliability ✅
- [ ] Load testing completed
- [ ] Error handling verified
- [ ] Data integrity confirmed
- [ ] Security testing passed
- [ ] Mobile responsiveness verified

### Integration Testing ✅
- [ ] Database operations
- [ ] External API integrations (Stripe, OpenAI)
- [ ] Email notifications
- [ ] File uploads and storage
- [ ] Background job scheduling

### Documentation & Training ✅
- [ ] User guides updated
- [ ] Admin documentation complete
- [ ] Training materials prepared
- [ ] Support procedures documented

## Bug Reporting Template

When issues are found during testing:

**Bug ID:** [Unique identifier]
**Severity:** [Critical/High/Medium/Low]
**Priority:** [1-4]
**Component:** [Module/Feature affected]
**Environment:** [Testing environment details]

**Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Videos:**
[Attach if applicable]

**Workaround:**
[Temporary solution if available]

---

This comprehensive manual testing guide ensures all critical functionality is validated before production deployment. Each test should be performed systematically with results documented for compliance and quality assurance purposes.