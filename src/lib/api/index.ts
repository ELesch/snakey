// API Client exports

// Shared types and utilities
export {
  type ApiError,
  type ErrorResponse,
  type SingleResponse,
  type PaginatedResponse,
  type PaginationMeta,
  type DeleteResponse,
  type BaseQueryParams,
} from './types'

export {
  ApiClientError,
  isErrorResponse,
  handleResponse,
  buildQueryString,
  createJsonHeaders,
  createJsonRequestOptions,
} from './utils'

// Reptile API
export {
  fetchReptiles,
  fetchReptile,
  createReptile,
  updateReptile,
  deleteReptile,
} from './reptile.api'

// Feeding API
export {
  fetchFeedings,
  fetchFeeding,
  createFeeding,
  updateFeeding,
  deleteFeeding,
} from './feeding.api'

// Shed API
export {
  fetchSheds,
  fetchShed,
  createShed,
  updateShed,
  deleteShed,
} from './shed.api'

// Environment API
export {
  fetchEnvironmentLogs,
  fetchEnvironmentLog,
  createEnvironmentLog,
  updateEnvironmentLog,
  deleteEnvironmentLog,
} from './environment.api'

// Photo API
export {
  fetchPhotos,
  fetchPhoto,
  createPhoto,
  updatePhoto,
  deletePhoto,
  getUploadUrl,
  uploadToStorage,
  type UploadUrlResponse,
} from './photo.api'

// Vet API
export {
  fetchVetVisits,
  fetchVetVisit,
  createVetVisit,
  updateVetVisit,
  deleteVetVisit,
  fetchMedications,
  fetchMedication,
  createMedication,
  updateMedication,
  deleteMedication,
} from './vet.api'

// Breeding API
export {
  fetchPairings,
  fetchPairing,
  createPairing,
  updatePairing,
  deletePairing,
  fetchClutches,
  fetchClutch,
  createClutch,
  updateClutch,
  deleteClutch,
  fetchHatchlings,
  fetchHatchling,
  createHatchling,
  updateHatchling,
  deleteHatchling,
} from './breeding.api'

// Dashboard API
export {
  fetchDashboardStats,
  fetchRecentActivity,
  fetchUpcomingFeedings,
  fetchEnvironmentAlerts,
} from './dashboard.api'

// Reports API
export {
  fetchGrowthData,
  fetchFeedingStats,
  fetchShedStats,
  fetchEnvironmentStats,
  fetchReportsSummary,
} from './reports.api'
