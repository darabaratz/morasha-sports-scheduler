PRODUCT REQUIREMENTS DOCUMENT
Sports Period Scheduling Tool
Camp Sports Department — Internal Tool
Version	1.0 — Draft
Date	June 2026
Author	Talia
Primary User	Daniella (Head of Sports)
Status	Ready for Engineering Review

1. Overview & Problem Statement
The camp sports department currently operates on a fully manual scheduling process. Each night, the Head of Sports prints a paper schedule template, hand-writes staff assignments for the following day (staff name, sport, age group, location, time slot), photographs the paper, and distributes the image via WhatsApp. This process is error-prone, time-consuming, produces no historical record, and offers no safeguards against common scheduling conflicts such as double-booking a location or unevenly distributing workload across staff.
This document defines the requirements for a lightweight, web-based scheduling tool that digitizes and streamlines this workflow, built exclusively for the Head of Sports to use on a nightly basis.

2. Goals & Non-Goals
2.1 Goals
•	Replace the paper-and-photo workflow with a fast, form-based digital scheduling interface
•	Surface real-time validation warnings to prevent common scheduling errors
•	Persist all schedule data across the summer season for lookback and lookahead views
•	Produce a clean, shareable daily schedule output suitable for WhatsApp distribution
•	Support a setup phase for admin and Daniella to configure the season before it begins
2.2 Non-Goals
•	No native staff-facing login or push notification system (out of scope for v1)
•	No multi-department support (tool is purpose-built for sports only)
•	No automated schedule generation or AI suggestions
•	No integration with external camp management software
•	Formal authentication / user account management is out of scope for v1

3. Users & Roles
There are two roles in this system. No formal authentication is required for v1 — role access can be managed via a simple PIN or toggled in settings.

Role	Person	Access
Admin	Builder / Talia	Full system configuration: period schedule templates, full staff roster, locations list, age groups. Can also do everything the Scheduler role can do.
Scheduler	Daniella	Daily assignment creation and editing. Staff restriction management. Schedule view (daily, weekly). Export/share daily schedule. Cannot modify master period templates or staff roster.

4. Core Data Model & Definitions
The following entities form the backbone of the system. Engineers should treat this as the canonical reference for schema design.
4.1 Season
•	A Season represents one summer camp session (e.g. Summer 2026).
•	All data (schedules, staff, templates) is scoped to a Season.
•	The system should support creating a new Season at the start of each summer without losing prior season data.
•	Only one Season is “active” at a time.
4.2 Schedule Template
•	Defines the period structure for each day of the week.
•	Sun–Thu share one template. Friday has a separate template. Saturday has no template (day off).
•	A template consists of an ordered list of Period Slots (e.g. 9:00–10:00 AM, 10:00–11:00 AM, etc.).
•	Each Period Slot in the template specifies which Age Groups have sports during that slot.
•	Templates are configured once at season setup and persist unless explicitly modified by the Admin.
•	Approximate scale: ~9 periods for Sun–Thu, ~6 periods for Friday (exact counts configurable at setup).
4.3 Staff Member
•	Each staff member has: Name, and optionally a profile photo or initials avatar.
•	Staff roster is created by the Admin at season setup. Daniella cannot add or remove staff, but she can manage their restrictions.
•	Staff count is 8–12 per season.
4.4 Staff Restriction
•	A restriction is a constraint attached to a staff member that limits their assignability. Types:
◦	Age Group Restriction: staff can only be assigned to specific age groups (e.g. “senior campers only”).
◦	Sport Restriction: staff can only be assigned to specific sports (e.g. cannot run basketball).
◦	Availability Block: staff is unavailable for a specific period, day, or range of days (e.g. day off, non-sports duty).
◦	Free-text Note: open-ended note visible to Daniella during assignment (e.g. “Cannot supervise swimming unsupervised”).
•	Restrictions are set by Daniella at the start of the season or updated at any time.
•	Restrictions should surface as warnings or filters during the daily assignment workflow — they do NOT hard-block unless a location or time-slot conflict is detected (see Validations section).
4.5 Sport Session (the atomic unit of scheduling)
•	A Sport Session is the core schedulable entity. It represents one assignment for one period slot on one day.
•	A Sport Session has exactly: one Staff Member, one Sport, one Location, one Period Slot, one Date, and one Age Group (for informational purposes).
•	Multiple Sport Sessions can exist for the same Period Slot on the same day (one per concurrent activity).
•	One staff member cannot be assigned to more than one Sport Session in the same Period Slot on the same day.
4.6 Sports List
•	A configurable list of sports that can be assigned (e.g. basketball, soccer, tennis, swimming, etc.).
•	Set by Daniella at season setup. Can be updated at any time.
4.7 Locations List
•	A configurable list of physical locations where sports are played (e.g. Main Field, Basketball Court, Pool, etc.).
•	Set by the Admin at season setup.
•	Location capacity (max concurrent sessions per slot) is either: 1 by default, or configurable per location if some locations support multiple concurrent activities.

5. Feature Requirements
5.1 Season & System Setup (Admin)
Performed once at the start of each summer by the Admin before Daniella begins using the scheduling features.

ID	Requirement	Notes / Acceptance Criteria	Priority
S-01	Admin can create a new Season with a name and year	E.g. ‘Summer 2026’. System marks it as the active season.	P0
S-02	Admin can configure the Sun–Thu period template	List of time slots with label, start time, end time, and which age groups have sports in that slot	P0
S-03	Admin can configure a separate Friday period template	Same structure as S-02 but independent from the Sun–Thu template	P0
S-04	Admin can configure the Locations list	CRUD operations on locations. Each location has a name and optional max-concurrent-sessions value (default: 1)	P0
S-05	Admin can create and manage the Staff Roster	Add/remove/edit staff members. Name is required. Optional photo or avatar initials.	P0
S-06	Admin can configure the Age Groups list	Ordered list of 6 age groups with names (e.g. Junior 1, Junior 2… Senior 2)	P0
5.2 Staff & Restriction Management (Daniella)
Daniella manages restrictions on her staff at the start of the season and updates them as needed throughout the summer.

ID	Requirement	Notes / Acceptance Criteria	Priority
R-01	Daniella can view all staff members with their current restrictions	A staff roster page showing each person and their active restrictions at a glance	P0
R-02	Daniella can add an Age Group restriction to any staff member	Select which age groups they ARE allowed to work with. Default is all.	P0
R-03	Daniella can add a Sport restriction to any staff member	Select which sports they ARE allowed to teach. Default is all.	P0
R-04	Daniella can mark a staff member unavailable for a specific date or date range	E.g. full day off, or specific period(s) on a specific day	P0
R-05	Daniella can add a free-text note to any staff member	Visible as a tooltip or inline note during assignment. Not a hard block.	P1
R-06	Restrictions persist for the season unless manually removed	Removing a restriction restores full availability for that dimension	P0
5.3 Daily Schedule Assignment (Daniella — Core Workflow)
This is the primary nightly workflow. Daniella opens the tool, selects tomorrow’s date, and fills in assignments period by period.

ID	Requirement	Notes / Acceptance Criteria	Priority
D-01	Daniella can select a target date to schedule	Defaults to tomorrow. The correct period template (Sun–Thu vs Friday) loads automatically based on day of week. Saturday is blocked.	P0
D-02	The schedule view shows all period slots for the selected date as a grid or list	Each period slot shows the time, age groups active in that slot, and any existing assignments	P0
D-03	For each period slot, Daniella can add one or more Sport Sessions	Each session requires: Staff Member (dropdown), Sport (dropdown), Location (dropdown), Age Group (dropdown). All four fields are required to save.	P0
D-04	Staff dropdown filters out restricted or unavailable staff for that slot	If a staff member has an age group restriction, sport restriction, or is blocked for that period/day, they appear grayed out or are removed from the list	P0
D-05	Daniella can edit or delete any existing Sport Session for the selected date	Editing re-opens the session form pre-populated. Deletion prompts confirmation.	P0
D-06	The schedule auto-saves as Daniella works	No explicit ‘Save’ button required. Changes persist immediately.	P1
D-07	A staff workload summary is visible while scheduling	Shows each staff member’s assigned period count for the selected day. Updates in real time as sessions are added/removed.	P0
D-08	Daniella can copy a previous day’s schedule as a starting point	Select a past date; its assignments populate the current day’s form for editing. Does not overwrite if sessions already exist without confirmation.	P2
5.4 Validations & Warnings
All validations are non-blocking (soft warnings) unless noted. Daniella can always override. Warnings should be visually prominent but not modal-blocking.

ID	Requirement	Notes / Acceptance Criteria	Priority
V-01	Location conflict: same location assigned twice in the same period slot	Hard block — system prevents saving the second session if location capacity would be exceeded	P0
V-02	Staff double-booking: same staff member assigned to two sessions in the same period slot	Hard block — system prevents saving and surfaces the conflict clearly	P0
V-03	Staff restriction violation: assigning a restricted staff member to a blocked age group or sport	Soft warning with override. The restriction flag should be visible before Daniella even opens the dropdown (see D-04).	P0
V-04	Workload imbalance: a staff member has significantly more periods than others on the same day	Soft indicator on the workload summary (e.g. highlight if someone is 2+ periods above average). Not a block.	P1
V-05	Incomplete period: a period slot has no sessions assigned	Visual indicator on the period slot (e.g. empty/unfilled state). Not a block.	P1
V-06	Staff unavailability: Daniella attempts to assign a staff member on their marked day off or blocked period	Hard block with clear explanation of why the staff member is unavailable	P0
5.5 Schedule Views & History
Beyond daily assignment, Daniella needs to look back at past days and look ahead to future ones.

ID	Requirement	Notes / Acceptance Criteria	Priority
HV-01	Daniella can view any past or future day’s schedule in read-only mode	Selecting a date with existing assignments shows them in the same grid layout. Past dates are not editable.	P0
HV-02	Weekly view: Daniella can see the full week at a glance	A 7-day (Sun–Fri) grid showing all sessions per day. Each cell shows staff + sport. Clicking a cell navigates to that day’s detail view.	P1
HV-03	Staff fairness summary: weekly view showing each staff member’s total periods for the week	Table or chart view. Useful to detect chronic imbalances over the week, not just one day.	P1
HV-04	Location usage summary: per-location session count per week	Helps identify overused or underused venues. Useful for planning variety.	P2
5.6 Export & Share
The primary distribution channel remains WhatsApp. The tool should produce a clean visual output that screenshots well on mobile.

ID	Requirement	Notes / Acceptance Criteria	Priority
E-01	Daniella can view a clean, print-optimized daily schedule view	A dedicated ‘share view’ that hides all UI chrome and shows only the schedule in a clean, readable layout. Optimized for screenshot on mobile.	P0
E-02	Daniella can export the daily schedule as a PDF	One-tap PDF export of the daily schedule. PDF should be formatted for portrait mobile/print viewing.	P1
E-03	The share view is accessible from any device without login	Via a shareable link or QR code, if technically feasible at low cost. Otherwise screenshot is sufficient for v1.	P2

6. Platform & UX Requirements
•	The tool must be fully responsive and usable on mobile (phone), tablet, and desktop.
•	Daniella’s primary use case is nightly on her phone. The daily assignment workflow must be optimized for a small screen — large tap targets, minimal typing, dropdowns over free-text wherever possible.
•	No app store installation. The tool should be a web app accessible via URL.
•	No authentication required for v1. Role (Admin vs Scheduler) can be determined via a simple PIN or URL parameter.
•	Performance: the scheduling form should load in under 2 seconds on a standard mobile connection.
•	Offline mode is not required for v1, but the app should degrade gracefully if connectivity is lost mid-session (e.g. warn before data loss).

7. Out of Scope for v1 / Future Considerations
•	Staff-facing accounts with individual schedule views
•	Push notifications or SMS/WhatsApp API integration
•	Auto-suggest or AI-assisted assignment
•	Multi-department support (arts, drama, etc.)
•	Multi-camp support or SaaS multi-tenancy
•	Camper-level scheduling or attendance tracking
•	Integration with external camp management platforms
•	Recurring / template-based weekly schedules

8. Open Questions & Assumptions
8.1 Open Questions for Daniella / Admin
•	Exact period counts for Sun–Thu and Friday to be confirmed before setup screen is built (assumed ~9 and ~6 respectively).
•	Does location capacity vary by location, or is every location limited to 1 concurrent session? (Assumed 1 by default; should be configurable.)
•	Are there sports that can only be played at specific locations? If so, should the system enforce this as a validation?
•	Should the system support multiple concurrent age groups in one Sport Session, or is it always exactly one age group per session?
•	What are the exact age group names used at this camp?
•	What is the full list of sports played? What is the full list of locations?
8.2 Assumptions Made in This PRD
•	Assumed: no authentication layer needed for v1 beyond simple role differentiation.
•	Assumed: staff restrictions are soft-warn only (except hard blocks for double-booking and unavailability).
•	Assumed: the season runs Sun–Fri with Saturday fully off. No exceptions.
•	Assumed: one staff member per sport session (no co-staffing a single session).
•	Assumed: the PDF/screenshot export is sufficient for staff distribution in v1; no native share integration required.
•	Assumed: age group is informational metadata on a session, not a scheduling constraint in itself (Daniella assigns by sport + location + staff, not by camper group).

9. Priority Legend
P0	Must-have for launch. The product does not ship without this.
P1	High value. Should be included in v1 if time allows; clear regression if missing.
P2	Nice-to-have. Defer to v1.1 or beyond without significant user impact.

END OF DOCUMENT
