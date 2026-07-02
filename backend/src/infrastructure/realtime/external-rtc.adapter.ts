import type { CreateRoomInput, RealtimeAdapter } from "./realtime.interface";
import { logger } from "../logger";

export class ExternalRtcAdapter implements RealtimeAdapter {
  async createRoom(input: CreateRoomInput) {
    const roomId = `external-${input.organizationId}-${Date.now()}`;
    return { roomId, joinUrl: `https://meet.example.com/${roomId}` };
  }

  async notifyParticipants(roomId: string, participantIds: string[]) {
    if (process.env.NODE_ENV === "development") {
      logger.debug("External RTC participant notification queued by development adapter.", { roomId, participantCount: participantIds.length });
    }
  }

  async publishUpdate(channel: string, payload: unknown) {
    if (process.env.NODE_ENV === "development") {
      logger.debug("External RTC update queued by development adapter.", { channel, payload });
    }
  }
}
