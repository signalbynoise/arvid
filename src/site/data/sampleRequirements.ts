export interface SampleRequirement {
  title: string;
  owner: string;
  completeness: number;
  clarity: 'High' | 'Medium' | 'Low';
  risk: 'Low' | 'Medium' | 'High';
}

export const SAMPLE_REQUIREMENTS: SampleRequirement[] = [
  { title: 'GitHub Login with Repo Access', owner: 'Sarah', completeness: 72, clarity: 'Medium', risk: 'High' },
  { title: 'Real-time Notification System', owner: 'Marcus', completeness: 15, clarity: 'Low', risk: 'High' },
  { title: 'User Role Permissions', owner: 'Anika', completeness: 91, clarity: 'High', risk: 'Low' },
  { title: 'API Rate Limiting', owner: 'James', completeness: 45, clarity: 'Medium', risk: 'Medium' },
  { title: 'SSO Integration for Enterprise', owner: 'Priya', completeness: 8, clarity: 'Low', risk: 'High' },
  { title: 'File Upload & Attachment Support', owner: 'Leo', completeness: 63, clarity: 'Medium', risk: 'Medium' },
  { title: 'Audit Log for Compliance', owner: 'Fatima', completeness: 87, clarity: 'High', risk: 'Low' },
  { title: 'Webhook Event Delivery', owner: 'Carlos', completeness: 34, clarity: 'Low', risk: 'Medium' },
  { title: 'Multi-tenant Data Isolation', owner: 'Yuki', completeness: 55, clarity: 'Medium', risk: 'High' },
  { title: 'Search & Filtering Engine', owner: 'David', completeness: 78, clarity: 'High', risk: 'Low' },
  { title: 'Mobile Responsive Dashboard', owner: 'Elena', completeness: 22, clarity: 'Low', risk: 'Medium' },
  { title: 'Export to PDF & CSV', owner: 'Omar', completeness: 95, clarity: 'High', risk: 'Low' },
  { title: 'Two-Factor Authentication', owner: 'Nina', completeness: 41, clarity: 'Medium', risk: 'High' },
  { title: 'Dark Mode Theme Support', owner: 'Alex', completeness: 88, clarity: 'High', risk: 'Low' },
  { title: 'Bulk Import from Jira', owner: 'Tomás', completeness: 12, clarity: 'Low', risk: 'High' },
  { title: 'Custom Field Definitions', owner: 'Ling', completeness: 67, clarity: 'Medium', risk: 'Medium' },
  { title: 'Slack Integration for Alerts', owner: 'Rachel', completeness: 53, clarity: 'Medium', risk: 'Low' },
  { title: 'Version History & Rollback', owner: 'Kai', completeness: 29, clarity: 'Low', risk: 'High' },
  { title: 'Automated Test Coverage Report', owner: 'Sofia', completeness: 81, clarity: 'High', risk: 'Low' },
  { title: 'GraphQL API Gateway', owner: 'Ravi', completeness: 38, clarity: 'Low', risk: 'Medium' },
  { title: 'Email Digest Scheduling', owner: 'Maya', completeness: 74, clarity: 'Medium', risk: 'Low' },
  { title: 'Data Encryption at Rest', owner: 'Henrik', completeness: 60, clarity: 'Medium', risk: 'High' },
  { title: 'CI/CD Pipeline Integration', owner: 'Zara', completeness: 85, clarity: 'High', risk: 'Low' },
  { title: 'Drag & Drop Board View', owner: 'Lucas', completeness: 19, clarity: 'Low', risk: 'Medium' },
  { title: 'Comment Threading & Mentions', owner: 'Amara', completeness: 47, clarity: 'Medium', risk: 'Low' },
  { title: 'Analytics Dashboard Widgets', owner: 'Felix', completeness: 93, clarity: 'High', risk: 'Low' },
  { title: 'RBAC Policy Engine', owner: 'Dina', completeness: 31, clarity: 'Low', risk: 'High' },
  { title: 'Internationalization Support', owner: 'Noah', completeness: 56, clarity: 'Medium', risk: 'Medium' },
];
