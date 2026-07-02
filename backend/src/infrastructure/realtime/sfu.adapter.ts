import type { CreateRoomInput, RealtimeAdapter } from "./realtime.interface";

export class SfuAdapter implements RealtimeAdapter {
  async createRoom(_input: CreateRoomInput): Promise<{ roomId: string; joinUrl: string }> {
    throw new Error("SFU adapter is reserved for the KRAVIA-owned media engine.");
  }

  async notifyParticipants(_roomId: string, _participantIds: string[]) {
    throw new Error("SFU adapter is reserved for the KRAVIA-owned media engine.");
  }

  async publishUpdate(_channel: string, _payload: unknown) {
    throw new Error("SFU adapter is reserved for the KRAVIA-owned media engine.");
  }
}
