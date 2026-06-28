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
  updateJob,
  deleteJob,
  syncJobProgress,
} from "./jobs"

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
  getCurrentOrganizationId,
  requireOrganizationId,
  SupabaseServiceError,
} from "../schema"
