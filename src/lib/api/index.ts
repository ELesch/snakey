// API Client exports
export {
  fetchReptiles,
  fetchReptile,
  createReptile,
  updateReptile,
  deleteReptile,
  ReptileApiError,
  type ApiError,
  type PaginatedResponse,
  type SingleResponse,
  type ErrorResponse,
} from './reptile.api'

export {
  fetchFeedings,
  fetchFeeding,
  createFeeding,
  updateFeeding,
  deleteFeeding,
  FeedingApiError,
} from './feeding.api'

export {
  fetchWeights,
  fetchWeight,
  createWeight,
  updateWeight,
  deleteWeight,
  WeightApiError,
} from './weight.api'

export {
  fetchSheds,
  fetchShed,
  createShed,
  updateShed,
  deleteShed,
  ShedApiError,
} from './shed.api'

export {
  fetchEnvironmentLogs,
  fetchEnvironmentLog,
  createEnvironmentLog,
  updateEnvironmentLog,
  deleteEnvironmentLog,
  EnvironmentApiError,
} from './environment.api'

export {
  fetchPhotos,
  fetchPhoto,
  createPhoto,
  updatePhoto,
  deletePhoto,
  getUploadUrl,
  uploadToStorage,
  PhotoApiError,
  type UploadUrlResponse,
} from './photo.api'

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
  BreedingApiError,
} from './breeding.api'
