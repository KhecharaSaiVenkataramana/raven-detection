export type DetectionMode = "standard" | "dota" | "hrsc" | "dota_fg";

export interface DetectionOut {
  id: number;
  class_name: string;
  confidence: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  angle_deg: number;
  dataset_source: string;
}

export interface PredictItemResult {
  image_id: number;
  filename: string;
  model_used: string;
  objects_found: number;
  inference_ms: number;
  fps: number;
  width: number;
  height: number;
  density: number;
  input_image_url: string;
  annotated_image_url: string;
  detections: DetectionOut[];
}

export interface PredictBatchResponse {
  total_images: number;
  avg_time_ms: number;
  avg_objects: number;
  avg_fps: number;
  results: PredictItemResult[];
}

export interface ImageOut {
  id: number;
  filename: string;
  source_type: string;
  width: number | null;
  height: number | null;
  uploaded_at: string;
  status: string;
  model_used: string | null;
  inference_ms: number | null;
  fps: number | null;
  density: number | null;
  annotated_image_url: string | null;
  detections: DetectionOut[];
}

export interface HistoryResponse {
  total: number;
  images: ImageOut[];
}

export interface StatsResponse {
  total: number;
  total_objects: number;
  avg_ms: number;
}

export interface UserOut {
  id: number;
  email: string;
  full_name: string | null;
  created_at: string;
}

// ── Accident Scene Analysis (Incidents) ──────────────────────────────────────
// Phase 1 is documentation only — positions + headings detected in a single
// photo. No speed, trajectory, or fault claims. See IncidentDisclaimerBanner
// and the `disclaimer` field below, which mirrors schemas.INCIDENT_DISCLAIMER
// on the backend (oaod_backend/schemas.py).

export type IncidentStatus = "open" | "documented" | "analyzed" | "closed";
export type EvidenceType = "scene_photo" | "damage_photo" | "video_clip";

export interface Evidence {
  id: number;
  incident_id: number;
  evidence_type: EvidenceType;
  image_id: number | null;
  video_id: number | null;
  label: string | null;
  uploaded_at: string;
  annotated_image_url: string | null;
}

export interface Incident {
  id: number;
  title: string;
  reference_code: string | null;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
  notes: string | null;
  evidence: Evidence[];
  disclaimer: string;
}

export interface IncidentListResponse {
  total: number;
  incidents: Incident[];
}
