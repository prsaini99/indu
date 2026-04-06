// Zoom webhook payload types

export interface ZoomRecordingFile {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;       // "MP4", "M4A", "CHAT", "TRANSCRIPT", "CC"
  file_extension: string;  // "MP4", "M4A", "TXT", "VTT"
  file_size: number;       // bytes
  download_url: string;
  recording_type: string;  // "shared_screen_with_speaker_view", "audio_only", etc.
  status: string;
}

export interface ZoomRecordingPayload {
  id: string;              // meeting instance UUID
  uuid: string;
  host_id: string;
  topic: string;
  start_time: string;
  duration: number;        // minutes
  recording_files: ZoomRecordingFile[];
}

export interface ZoomWebhookEvent {
  event: string;           // "recording.completed", "endpoint.url_validation"
  event_ts: number;
  payload: {
    account_id: string;
    object: ZoomRecordingPayload;
  };
  // For URL validation
  plainToken?: string;
}

export interface RecordingQueryDTO {
  page?: string;
  limit?: string;
  status?: string;
}
