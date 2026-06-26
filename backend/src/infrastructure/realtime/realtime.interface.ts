export interface CreateRoomInput {
  organizationId: string;
  suiteType: "EDUCATION_SUITE" | "VMETRON_SUITE";
  title: string;
  startsAt?: string;
}

export interface RealtimeAdapter {
  createRoom(input: CreateRoomInput): Promise<{ roomId: string; joinUrl: string }>;
  notifyParticipants(roomId: string, participantIds: string[]): Promise<void>;
  publishUpdate(channel: string, payload: unknown): Promise<void>;
}
