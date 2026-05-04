export interface SampleRequirement {
  title: string;
  description: string;
  owner: string;
  completeness: number;
  clarity: 'High' | 'Medium' | 'Low';
  risk: 'Low' | 'Medium' | 'High';
}

export const SAMPLE_REQUIREMENTS: SampleRequirement[] = [
  { title: 'GitHub Login with Repo Access', description: 'Allow users to authenticate via GitHub OAuth and grant read access to selected repositories for codebase analysis...', owner: 'Sarah', completeness: 72, clarity: 'Medium', risk: 'High' },
  { title: 'Real-time Notification System', description: 'Push notifications to connected clients when requirements change status or new questions are posted by team members...', owner: 'Marcus', completeness: 15, clarity: 'Low', risk: 'High' },
  { title: 'User Role Permissions', description: 'Define admin, editor, and viewer roles with granular access control per project and requirement category...', owner: 'Anika', completeness: 91, clarity: 'High', risk: 'Low' },
  { title: 'API Rate Limiting', description: 'Implement token bucket rate limiting on all public endpoints to prevent abuse and ensure fair usage across tenants...', owner: 'James', completeness: 45, clarity: 'Medium', risk: 'Medium' },
  { title: 'SSO Integration for Enterprise', description: 'Support SAML 2.0 and OIDC flows for enterprise customers who require single sign-on with their identity provider...', owner: 'Priya', completeness: 8, clarity: 'Low', risk: 'High' },
  { title: 'File Upload & Attachment Support', description: 'Enable users to attach files and screenshots to requirements and answers with drag-and-drop support...', owner: 'Leo', completeness: 63, clarity: 'Medium', risk: 'Medium' },
  { title: 'Audit Log for Compliance', description: 'Record all create, update, and delete actions with timestamps and actor identity for regulatory compliance...', owner: 'Fatima', completeness: 87, clarity: 'High', risk: 'Low' },
  { title: 'Webhook Event Delivery', description: 'Deliver configurable webhook payloads to external endpoints when key events occur in the requirement lifecycle...', owner: 'Carlos', completeness: 34, clarity: 'Low', risk: 'Medium' },
  { title: 'Multi-tenant Data Isolation', description: 'Enforce strict row-level security so each organization can only access their own projects and requirement data...', owner: 'Yuki', completeness: 55, clarity: 'Medium', risk: 'High' },
  { title: 'Search & Filtering Engine', description: 'Full-text search across requirements, questions, and answers with filters for status, owner, and risk level...', owner: 'David', completeness: 78, clarity: 'High', risk: 'Low' },
  { title: 'Mobile Responsive Dashboard', description: 'Adapt the three-column layout to stack vertically on mobile devices with swipe navigation between panels...', owner: 'Elena', completeness: 22, clarity: 'Low', risk: 'Medium' },
  { title: 'Export to PDF & CSV', description: 'Generate downloadable reports of requirements with their questions, answers, and completeness metrics...', owner: 'Omar', completeness: 95, clarity: 'High', risk: 'Low' },
  { title: 'Two-Factor Authentication', description: 'Add TOTP-based second factor for users who want additional account security beyond password login...', owner: 'Nina', completeness: 41, clarity: 'Medium', risk: 'High' },
  { title: 'Dark Mode Theme Support', description: 'Provide a system-aware dark theme using CSS custom properties with smooth transitions between modes...', owner: 'Alex', completeness: 88, clarity: 'High', risk: 'Low' },
  { title: 'Bulk Import from Jira', description: 'Parse Jira exports and map issue fields to Arvid requirement schema including status and priority mapping...', owner: 'Tomás', completeness: 12, clarity: 'Low', risk: 'High' },
  { title: 'Custom Field Definitions', description: 'Allow project admins to define custom metadata fields on requirements beyond the default schema...', owner: 'Ling', completeness: 67, clarity: 'Medium', risk: 'Medium' },
  { title: 'Slack Integration for Alerts', description: 'Send formatted Slack messages to configured channels when requirements reach key milestones or need attention...', owner: 'Rachel', completeness: 53, clarity: 'Medium', risk: 'Low' },
  { title: 'Version History & Rollback', description: 'Track all edits to requirements with diffs and allow reverting to any previous version with one click...', owner: 'Kai', completeness: 29, clarity: 'Low', risk: 'High' },
  { title: 'Automated Test Coverage Report', description: 'Map requirements to test suites and display coverage percentages to identify untested acceptance criteria...', owner: 'Sofia', completeness: 81, clarity: 'High', risk: 'Low' },
  { title: 'GraphQL API Gateway', description: 'Expose a GraphQL endpoint alongside REST for clients that need flexible query patterns and field selection...', owner: 'Ravi', completeness: 38, clarity: 'Low', risk: 'Medium' },
  { title: 'Email Digest Scheduling', description: 'Send periodic email summaries of requirement changes and open questions to subscribed stakeholders...', owner: 'Maya', completeness: 74, clarity: 'Medium', risk: 'Low' },
  { title: 'Data Encryption at Rest', description: 'Encrypt all stored requirement data and attachments using AES-256 with key rotation managed by the platform...', owner: 'Henrik', completeness: 60, clarity: 'Medium', risk: 'High' },
  { title: 'CI/CD Pipeline Integration', description: 'Trigger requirement status updates from CI pipelines and block deployments when linked requirements are incomplete...', owner: 'Zara', completeness: 85, clarity: 'High', risk: 'Low' },
  { title: 'Drag & Drop Board View', description: 'Kanban-style board where requirements can be dragged between status columns with automatic state transitions...', owner: 'Lucas', completeness: 19, clarity: 'Low', risk: 'Medium' },
  { title: 'Comment Threading & Mentions', description: 'Threaded discussions on requirements with @mention support that notifies referenced team members instantly...', owner: 'Amara', completeness: 47, clarity: 'Medium', risk: 'Low' },
  { title: 'Analytics Dashboard Widgets', description: 'Configurable dashboard with charts showing completeness trends, risk distribution, and team velocity over time...', owner: 'Felix', completeness: 93, clarity: 'High', risk: 'Low' },
  { title: 'RBAC Policy Engine', description: 'Centralized policy engine that evaluates access rules at the API layer before any database queries execute...', owner: 'Dina', completeness: 31, clarity: 'Low', risk: 'High' },
  { title: 'Internationalization Support', description: 'Extract all UI strings into locale files and support right-to-left layouts for Arabic and Hebrew users...', owner: 'Noah', completeness: 56, clarity: 'Medium', risk: 'Medium' },
];
