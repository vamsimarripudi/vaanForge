Design VaanForge as a product app, not a landing page.

Important:
Do not design a marketing landing page.
The first screen should be the actual VaanForge workspace.
Users should enter directly into the product interface.

Product Name:
VaanForge

Product Type:
Enterprise AI Software Factory workspace.

Design Goal:
Create a simple, powerful, premium enterprise product UI where users can start a project, chat with the agent, view project history, track builds, approve outputs, manage pricing, and monitor validation from one clean workspace.

The design must feel original, fresh, and purpose-built for VaanForge. Do not copy another company’s visual identity. It can be inspired by high-quality enterprise SaaS patterns, but the final system must feel like its own product.

Overall UX:
- No landing page.
- No hero marketing section.
- No decorative clutter.
- Open directly into the main app.
- Simple first impression.
- Strong information architecture.
- Mobile-first responsive layout.
- Desktop optimized for serious work.
- Clean typography.
- Calm spacing.
- Clear actions.
- No fake charts.
- No fake metrics.
- No random gradients.
- No childish illustrations.

Primary App Layout:
1. Top navigation bar
2. Toggleable sidebar
3. Main workspace
4. Right-side context/details panel where useful
5. Command/input area for agent interaction
6. Status and approval surfaces

Top Navbar Requirements:
- Left: VaanForge product logo + product name
- Center: important product sections
- Right: theme toggle, notifications, account/profile
- Top nav should show important sections:
  - Workspace
  - Projects
  - Factory
  - Builds
  - Validations
  - Deployments
  - Pricing
  - Settings
- Use clean icon + label on desktop
- Use icons only or compact menu on mobile
- Active section must be clear
- Navbar height should feel compact and professional

Theme Toggle Requirement:
Create an elegant icon-only theme selector.

States:
- Default: show only the currently selected theme icon
- On hover or focus: expand to show three icons
  - System
  - Light
  - Dark
- After user selects an icon or cursor leaves: collapse back to one icon
- No text labels visible by default
- Use tooltips on hover/focus
- Smooth but subtle animation
- Accessible keyboard focus state

Sidebar Requirements:
Sidebar is toggleable/collapsible.

Sidebar purpose:
Only show chat list and history, not main navigation.

Sidebar content:
- New chat / new agent session button
- Search history
- Recent project conversations
- Recent blueprint sessions
- Recent build sessions
- Archived conversations
- Date grouping:
  - Today
  - Yesterday
  - Last 7 days
  - Older
- Each item shows:
  - Short title
  - Project name
  - Status badge
  - Last updated time
- Collapsed state shows icons only
- Mobile sidebar becomes drawer
- Sidebar must not feel cluttered

Main Workspace Sections:
The first screen should show a command-center workspace.

Required sections:
1. Current project / session header
2. Agent command input
3. Requirement status
4. Blueprint status
5. Build status
6. Validation status
7. Deployment readiness
8. Next action
9. Approvals waiting
10. Recent activity
11. Output preview
12. Usage / plan limit summary

Main Workspace UX:
- The user should immediately understand what to do next
- Primary action should be obvious:
  “Describe your software idea”
  or
  “Create new project”
- If no project exists, show a polished empty state
- If loading, show skeleton loading
- If error, show reason and recovery action
- If approval needed, show exact item being approved
- If blocked, show why and what unlocks it

Core Product Flow:
1. User starts a project
2. User chats with the AI agent
3. Agent detects missing requirements
4. Agent asks smart follow-up questions
5. User answers
6. Agent generates blueprint
7. User approves or requests changes
8. Agent creates task graph
9. Agent builds modules
10. QA/security/deployment validation runs
11. User reviews outputs
12. User receives docs and release package

Main App Screens to Design:
- Workspace dashboard
- New project flow
- Agent chat/session view
- Requirement intake view
- Follow-up questions view
- Blueprint review view
- Design system review view
- Task graph view
- Build progress view
- Validation results view
- Deployment readiness view
- Output preview view
- Change request view
- Pricing and usage view
- Settings view

Pricing UX Inside Product:
This should be a product pricing/settings screen, not a public pricing landing page.

Plans:
- Free: ₹0, 1 Project Free Forever
- Creator: ₹999/month
- Professional: ₹2,999/month, Most Popular
- Studio: ₹7,999/month
- Business: ₹19,999/month
- Enterprise: Custom

Pricing screen should include:
- Current plan
- Usage meters
- AI credits
- Storage
- Deployment usage
- Project usage
- Upgrade CTA
- Plan comparison
- Billing cycle toggle
- Invoice history
- Credit wallet
- Payment status
- Plan limit warnings

Design System:
Create a fresh VaanForge design system.

Style:
- Enterprise-grade
- Calm
- Simple
- Sharp
- Modern
- Utility-first
- No unnecessary decoration
- No oversized marketing hero
- No childish cards
- No fake glassmorphism
- No heavy shadows
- No random gradients

Colors:
- Light theme foundation:
  - Background: off-white / soft gray
  - Surface: white
  - Text: near black
  - Muted text: gray
  - Border: soft gray
  - Primary: deep green or refined teal
  - Info: blue
  - Warning: amber
  - Danger: red
- Dark theme foundation:
  - Background: near black
  - Surface: dark slate
  - Text: near white
  - Muted text: gray
  - Border: dark gray
  - Primary: bright but controlled green/teal

Typography:
- Strong product typography
- Clear hierarchy
- No viewport-scaled text
- Tight but readable spacing
- App headings should be smaller than landing-page headings
- Table text must be readable
- Buttons must not overflow
- Long words must wrap safely

Layout:
- Mobile first
- Use CSS grid and flexbox
- Desktop:
  - Top nav
  - Sidebar left
  - Main content center
  - Optional context panel right
- Tablet:
  - Sidebar collapses
  - Context panel stacks below
- Mobile:
  - Top nav compact
  - Sidebar drawer
  - Main content single column
  - Sticky bottom command input if needed

Components Required:
- Product logo mark
- Top navbar
- Theme icon selector
- Sidebar toggle
- Chat history sidebar
- Agent message composer
- Command input
- Project status header
- Status timeline
- Stepper
- Approval card
- Empty state
- Error state
- Loading state
- Skeleton state
- Success state
- Blocked state
- Toast notification
- Modal confirmation
- Drawer
- Tabs
- Segmented control
- Search input
- Select
- Textarea
- Button variants
- Icon buttons
- Tooltip
- Badge
- Usage meter
- Progress bar
- Task graph list
- Diff preview
- Validation result row
- Activity timeline
- File/output preview card
- Pricing card
- Invoice table
- Settings form

Icons:
Use clean line icons.
Suggested icon concepts:
- VaanForge logo: abstract forge mark, V + spark, or modular node mark
- Workspace
- Project
- Chat
- Blueprint
- Code
- Validation
- Security
- Deployment
- Billing
- Settings
- Notification
- Search
- Collapse sidebar
- Expand sidebar
- System theme
- Light theme
- Dark theme
- Success
- Warning
- Error
- Pending
- Approval

Animation:
Use subtle product animations only:
- Sidebar collapse/expand
- Theme selector expand/collapse
- Loading skeleton shimmer
- Agent typing indicator
- Step progress transitions
- Toast enter/exit
- Modal fade/scale
- No flashy motion
- Respect reduced motion preference

Loading States:
Design:
- Full workspace skeleton
- Sidebar chat history skeleton
- Project header skeleton
- Validation row skeleton
- Pricing card skeleton
- Table row skeleton
- Agent response streaming state
- Build progress loading state

Empty States:
Design high-quality empty states for:
- No projects
- No chat history
- No blueprints
- No builds
- No validation runs
- No deployments
- No invoices
- No usage events
- No search results

Each empty state must include:
- Clear title
- Short useful explanation
- Primary action
- Optional secondary action
- Relevant icon
- No fake data

Error States:
Design:
- API unavailable
- Permission denied
- Plan limit reached
- Payment failed
- Validation failed
- Build blocked
- Deployment blocked
- Session expired

Each error must show:
- Reason
- Recovery action
- Next step
- Support option if needed

Wireframe First:
Create low-fidelity wireframes before visual design.

Wireframes required:
1. Desktop workspace layout
2. Mobile workspace layout
3. Sidebar expanded
4. Sidebar collapsed
5. Theme toggle collapsed
6. Theme toggle expanded
7. Empty project state
8. Active agent session
9. Blueprint approval
10. Build progress
11. Pricing and usage screen
12. Settings screen

Prototype:
Create an interactive prototype showing:
- Sidebar toggle
- Mobile sidebar drawer
- Theme toggle expand/collapse
- Start new project
- Submit software idea
- Show follow-up questions
- Generate blueprint
- Approve blueprint
- Start build
- View validation results
- Open pricing
- Open settings

Main Visual Design:
After wireframes, create high-fidelity screens.

High-fidelity screens:
1. Main workspace empty state
2. Main workspace with active project
3. Agent chat with requirement questions
4. Blueprint review
5. Build progress
6. Validation results
7. Output preview
8. Pricing and usage
9. Settings
10. Mobile workspace
11. Mobile chat drawer
12. Dark theme workspace

Accessibility:
- Keyboard navigable
- Visible focus states
- ARIA-friendly controls
- Color contrast AA minimum
- Buttons have accessible labels
- Icon-only buttons need tooltips
- Theme selector usable with keyboard
- Sidebar toggle accessible
- Modals trap focus

Do Not:
- Do not create a marketing landing page
- Do not use parent company name
- Do not use old suite/product names
- Do not show fake metrics
- Do not use placeholder-looking dashboards
- Do not create cluttered cards everywhere
- Do not use random gradients
- Do not use excessive shadows
- Do not copy an existing company’s UI exactly
- Do not make it look like a generic chatbot
- Do not hide important next actions

Final Feeling:
The product should feel like a serious enterprise AI workspace:
simple,
fast,
focused,
clear,
premium,
responsive,
and powerful.