import { env } from "../../config/env";
import { ExternalRtcAdapter } from "./external-rtc.adapter";
import type { CreateRoomInput, RealtimeAdapter } from "./realtime.interface";
import { SfuAdapter } from "./sfu.adapter";
import { VaanRtcAdapter } from "./vaanrtc.adapter";

const adapterMap: Record<string, RealtimeAdapter> = {
  external: new ExternalRtcAdapter(),
  vaanrtc: new VaanRtcAdapter(),
  sfu: new SfuAdapter()
};

const adapter = adapterMap[env.realtimeAdapter] || adapterMap.external;

export class RealtimeService implements RealtimeAdapter {
  createRoom(input: CreateRoomInput) {
    return adapter.createRoom(input);
  }

  notifyParticipants(roomId: string, participantIds: string[]) {
    return adapter.notifyParticipants(roomId, participantIds);
  }

  publishUpdate(channel: string, payload: unknown) {
    return adapter.publishUpdate(channel, payload);
  }
}

export const realtimeService = new RealtimeService();
