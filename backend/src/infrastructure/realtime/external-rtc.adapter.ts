import type { CreateRoomInput, RealtimeAdapter } from "./realtime.interface";

export class ExternalRtcAdapter implements RealtimeAdapter {
  async createRoom(input: CreateRoomInput) {
    const roomId = `external-${input.organizationId}-${Date.now()}`;
    return { roomId, joinUrl: `https://meet.example.com/${roomId}` };
  }

  async notifyParticipants(roomId: string, participantIds: string[]) {
    console.log("External RTC notify placeholder", { roomId, participantIds });
  }

  async publishUpdate(channel: string, payload: unknown) {
    console.log("External RTC update placeholder", { channel, payload });
  }
}
