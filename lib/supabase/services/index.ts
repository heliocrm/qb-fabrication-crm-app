export { listAccounts } from "./accounts"
export { globalSearch } from "./search"

export {
  listOpportunities,
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
  listTravelerGenerationsByJobId,
  insertTravelerGeneration,
} from "./travelers"

export {
  getCurrentOrganizationId,
  requireOrganizationId,
  SupabaseServiceError,
} from "../schema"
