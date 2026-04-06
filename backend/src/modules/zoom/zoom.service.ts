import { env } from '../../config/env';

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ZoomMeetingResult {
  meetingId: bigint;
  joinUrl: string;
  password: string;
}

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export class ZoomService {
  private isConfigured(): boolean {
    return !!(env.ZOOM_ACCOUNT_ID && env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET);
  }

  // ==========================================
  // OAuth: Server-to-Server token
  // ==========================================

  private async getAccessToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Zoom credentials not configured');
    }

    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
      return cachedToken;
    }

    const credentials = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: env.ZOOM_ACCOUNT_ID!,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Zoom OAuth failed (${response.status}): ${text}`);
    }

    const data: ZoomTokenResponse = await response.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;

    return cachedToken;
  }

  // ==========================================
  // Create a recurring meeting (for enrollments)
  // ==========================================

  async createRecurringMeeting(
    topic: string,
    durationMinutes: number,
    timezone: string
  ): Promise<ZoomMeetingResult> {
    const token = await this.getAccessToken();

    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        type: 3, // Recurring meeting with no fixed time
        duration: durationMinutes,
        timezone,
        settings: {
          join_before_host: true,
          waiting_room: false,
          auto_recording: 'cloud',
          mute_upon_entry: true,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Zoom create meeting failed (${response.status}): ${text}`);
    }

    const data = await response.json();

    return {
      meetingId: BigInt(data.id),
      joinUrl: data.join_url,
      password: data.password || '',
    };
  }

  // ==========================================
  // Create a single scheduled meeting (for demo bookings)
  // ==========================================

  async createSingleMeeting(
    topic: string,
    startTime: string, // ISO 8601 format
    durationMinutes: number,
    timezone: string
  ): Promise<ZoomMeetingResult> {
    const token = await this.getAccessToken();

    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime,
        duration: durationMinutes,
        timezone,
        settings: {
          join_before_host: true,
          waiting_room: false,
          auto_recording: 'cloud',
          mute_upon_entry: true,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Zoom create meeting failed (${response.status}): ${text}`);
    }

    const data = await response.json();

    return {
      meetingId: BigInt(data.id),
      joinUrl: data.join_url,
      password: data.password || '',
    };
  }

  // ==========================================
  // Delete a meeting (cleanup on cancellation)
  // ==========================================

  // ==========================================
  // Delete recording from Zoom cloud (free storage)
  // ==========================================

  async deleteRecording(meetingUuid: string): Promise<void> {
    if (!this.isConfigured()) return;

    try {
      const token = await this.getAccessToken();
      // Double-encode UUID per Zoom API docs (UUIDs starting with / or containing //)
      const encodedUuid = encodeURIComponent(encodeURIComponent(meetingUuid));

      const response = await fetch(`https://api.zoom.us/v2/meetings/${encodedUuid}/recordings`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok && response.status !== 404) {
        const text = await response.text();
        console.error(`Zoom delete recording failed (${response.status}): ${text}`);
      }
    } catch (err) {
      console.error('Zoom delete recording error (non-blocking):', err);
    }
  }

  // ==========================================
  // Delete a meeting (cleanup on cancellation)
  // ==========================================

  async deleteMeeting(meetingId: bigint): Promise<void> {
    if (!this.isConfigured()) return;

    try {
      const token = await this.getAccessToken();

      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId.toString()}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // 204 = success, 404 = already deleted — both are fine
      if (!response.ok && response.status !== 404) {
        const text = await response.text();
        console.error(`Zoom delete meeting failed (${response.status}): ${text}`);
      }
    } catch (err) {
      console.error('Zoom delete meeting error (non-blocking):', err);
    }
  }
}
