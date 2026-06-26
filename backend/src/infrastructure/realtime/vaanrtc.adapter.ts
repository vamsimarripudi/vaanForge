import type { CreateRoomInput, RealtimeAdapter } from "./realtime.interface";

export class VaanRtcAdapter implements RealtimeAdapter {
  async createRoom(_input: CreateRoomInput): Promise<{ roomId: string; joinUrl: string }> {
    throw new Error("VaanRTC adapter is a placeholder until the VM nexus-owned RTC engine is ready.");
  }

  async notifyParticipants(_roomId: string, _participantIds: string[]) {
    throw new Error("VaanRTC adapter is a placeholder until the VM nexus-owned RTC engine is ready.");
  }

  async publishUpdate(_channel: string, _payload: unknown) {
    throw new Error("VaanRTC adapter is a placeholder until the VM nexus-owned RTC engine is ready.");
  }
}
