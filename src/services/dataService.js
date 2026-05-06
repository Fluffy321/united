import { base44 } from '@/api/base44Client';

// Thin compatibility layer.
// UI code should import this service instead of importing the backend bridge directly.
export const dataService = {
  auth: base44.auth,
  entities: base44.entities,
  functions: base44.functions,
  integrations: base44.integrations,
  appLogs: base44.appLogs,
};

export default dataService;
