
# BadVendor - Implementation Plan

## Overview
BadVendor is a verified misconduct registry platform for Nigeria that protects consumers from documented vendor fraud. The platform requires evidence-based verification and at least 3 unique complaints before publicly listing any vendor.

---

## 🎨 Branding & Design
**Modern & Accessible** style with a friendly, approachable feel:
- **Color Palette**: Warm neutrals (cream, soft grays) with teal/green accents for trust, and amber/orange for warnings
- **Typography**: Clean, readable fonts that work well on mobile
- **Tone**: Serious purpose, approachable presentation - making consumer protection feel accessible, not intimidating
- **Logo**: Simple, memorable mark incorporating the concept of verification/protection

---

## 🏠 Core Pages

### 1. Landing Page
- Hero section explaining BadVendor's mission
- Quick search bar (the primary action)
- How it works section (3-step explanation)
- Trust indicators and statistics
- Call-to-action to report a vendor

### 2. Search & Results
- Search by phone number, vendor name, bank account, or social media handle
- Clear results showing severity badges (Critical/Risky/Unreliable)
- "No verified complaints found" message when vendor is clean
- Link to submit a report if vendor isn't found

### 3. Vendor Detail Page
- Severity badge prominently displayed with explanation
- Number of verified complaints and date of first complaint
- All known vendor identifiers (phone numbers, social handles, bank accounts)
- Anonymized evidence summaries (protecting reporter privacy)
- Severity category explanation

### 4. Authentication Pages
- Registration with email and phone verification (SMS OTP)
- Login page
- Optional enhanced credibility (government ID upload placeholder for Phase 2)

### 5. Report Submission Flow
Multi-step form guiding reporters through:
1. **Vendor Identification** - Name, phone numbers, social media, bank details
2. **Category Selection** - Critical, Risky, or Unreliable with clear descriptions
3. **Incident Details** - Date, amount, narrative description, current status
4. **Evidence Upload** - Multiple file types (images, PDFs), up to 20 files per report
5. **Review & Submit** - Summary, confirmation checkboxes, submission

### 6. Report Status Dashboard (Reporter View)
- List of submitted reports with status tracking
- Status indicators: Submitted → Under Review → Approved/Rejected
- Notifications when status changes
- Ability to provide additional evidence if requested

### 7. Moderator Dashboard (Admin View)
- Queue of pending reports with filters (status, category, priority)
- Evidence review interface with checklist
- Approve/Reject/Request Evidence/Escalate actions
- Basic stats (pending count, avg review time)
- Vendor profile management (merging duplicates, adjusting severity)

---

## 🗄️ Backend (Lovable Cloud)

### Database Tables
- **users** - Registration, verification status, role
- **vendors** - Aggregated vendor profiles with identifiers
- **complaints** - Individual reports with status tracking
- **evidence** - File attachments linked to complaints
- **audit_logs** - All actions for compliance

### Authentication
- Email + password authentication via Supabase Auth
- Phone number verification via SMS OTP
- Role-based access (reporter, moderator, admin)

### Key Backend Logic
- 3-complaint threshold: Vendors only become public after 3 verified complaints
- Severity assignment: Uses highest severity among approved complaints
- Duplicate detection: Merge vendor profiles with matching identifiers
- Reporter anonymization: Never expose reporter identities publicly

### Security & Privacy
- Row-Level Security (RLS) policies protecting all data
- Evidence files encrypted and stored securely
- Reporter identities never visible on public pages
- Comprehensive audit logging

---

## 📱 Notifications
- Email notifications for status changes
- SMS notifications for key events (report approved, vendor published)
- User notification preferences

---

## 🚀 What's Included in MVP (Phase 1)

✅ User registration with email + phone verification  
✅ Report submission with evidence upload (images, PDFs)  
✅ Moderator dashboard with approval workflow  
✅ Three-tier severity classification  
✅ 3-complaint threshold before publication  
✅ Public search by phone number and vendor name  
✅ Vendor detail pages with anonymized evidence  
✅ Email and SMS notifications  
✅ Mobile-responsive design  

---

## 🔮 Deferred to Phase 2
- Vendor appeal system (manual email process initially)
- Video evidence support
- Government ID verification integration
- Advanced fraud detection automation

---

## Deliverables
A fully functional MVP with consumer-facing search, reporter submission flow, and moderator tools - ready for testing and initial user feedback.
