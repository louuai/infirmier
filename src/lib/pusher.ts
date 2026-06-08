import Pusher from "pusher";

const hasConfig =
  !!process.env.PUSHER_APP_ID &&
  !!process.env.PUSHER_KEY &&
  !!process.env.PUSHER_SECRET &&
  !!process.env.PUSHER_CLUSTER;

export const pusherServer = hasConfig
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

/** Déclenche un événement temps réel (silencieux si Pusher non configuré). */
export async function trigger(channel: string, event: string, data: unknown) {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(channel, event, data);
  } catch {
    // ne bloque jamais le flux métier
  }
}

export const bookingChannel = (bookingId: string) => `booking-${bookingId}`;
