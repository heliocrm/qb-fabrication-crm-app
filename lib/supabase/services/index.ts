export { listAccounts, createAccount, updateAccount } from "./accounts"
export { globalSearch } from "./search"

export {
  listOpportunities,
  createOpportunity,
  updateOpportunityStage,
} from "./opportunities"

export {
  getJobById,
  listJobs,
  createJob,
  createJobFromDomain,
  createJobFromTemplate,
  updateJob,
  deleteJob,
  syncJobProgress,
  type CreateJobFromTemplateInput,
} from "./jobs"

export {
  listLineItemsByJobId,
  createLineItem,
  createLineItemFromDomain,
  createLineItemWithTemplateTasks,
  updateLineItem,
  deleteLineItem,
  seedTasksForLineItem,
} from "./line-items"

export {
  listTasksByJobId,
  createTask,
  createTaskFromDomain,
  updateTask,
  toggleTaskCompleted,
  deleteTask,
  reorderTasks,
} from "./tasks"

export {
  listMaterialPullRequests,
  getMaterialPullRequestById,
  createMaterialPullRequest,
  updatePendingMaterialPullRequest,
  updateMaterialPullStatus,
  cancelMaterialPullRequest,
  assignMaterialPullBatch,
  markBatchPulled,
  getMaterialPullSummary,
} from "./material-pull-requests"

export {
  savePushSubscription,
  deletePushSubscription,
  listPushSubscriptionsForProfiles,
} from "./push-subscriptions"

export {
  getNextTravelerVersion,
  getNextDigitalTravelerVersion,
  listTravelerGenerationsByJobId,
  insertTravelerGeneration,
  getActiveTravelerByJobId,
  listTravelersByJobId,
  getTravelerById,
  importDigitalTraveler,
  updateTravelerLine,
} from "./travelers"

export { insertActivityLog } from "./activity"

export { createChangeOrder } from "./change-orders"

export {
  listContactsByAccountId,
  createContact,
  updateContact,
} from "./contacts"

export {
  listCrmActivitiesForAccount,
  listCrmActivitiesForJob,
  createCrmActivity,
  upsertExternalCrmActivity,
} from "./crm-activities"

export {
  getGoogleOAuthConnection,
  upsertGoogleOAuthToken,
  deleteGoogleOAuthToken,
} from "./google-oauth-tokens"

export { listNeedsTouchContacts } from "./needs-touch"

export {
  listLatestSignoffsForJob,
  listLatestSignoffsForLineItem,
  signOffFloorTask,
} from "./task-signoffs"

export {
  getCurrentOrganizationId,
  requireOrganizationId,
  SupabaseServiceError,
} from "../schema"
