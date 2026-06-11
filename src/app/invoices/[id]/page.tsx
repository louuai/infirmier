import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatTND, formatDate } from "@/lib/utils";
import { PrintButton } from "./print-button";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // id = bookingId
  const session = await getSession();
  if (!session) redirect(`/login?redirect=/invoices/${id}`);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: true,
      invoice: true,
      payment: true,
      nurse: { include: { user: { select: { firstName: true, lastName: true } } } },
      patient: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  if (!booking) notFound();

  const allowed =
    session!.role === "ADMIN" || booking.patientId === session!.sub || booking.nurse?.userId === session!.sub;
  if (!allowed) redirect("/");

  const isInvoice = !!booking.invoice;
  const number = booking.invoice?.number ?? `DEVIS-${booking.id.slice(-6).toUpperCase()}`;
  const clientName = booking.patient ? `${booking.patient.firstName} ${booking.patient.lastName}` : booking.guestName ?? "Client";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] py-10 text-slate-100 print:bg-white print:py-0 print:text-black">
      <div className="container max-w-3xl">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <a href="javascript:history.back()" className="text-sm text-slate-400 hover:text-white">← Retour</a>
          <PrintButton />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-10 text-slate-800 shadow-2xl print:rounded-none print:border-0 print:shadow-none">
          <div className="flex items-start justify-between border-b pb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Infirmier<span className="text-sky-600">Tunis</span></h1>
              <p className="text-sm text-slate-500">Soins infirmiers à domicile — Tunisie</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold uppercase text-slate-900">{isInvoice ? "Facture" : "Devis"}</p>
              <p className="text-sm text-slate-500">{number}</p>
              <p className="text-sm text-slate-500">{formatDate(booking.invoice?.issuedAt ?? booking.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 py-6 text-sm">
            <div>
              <p className="mb-1 font-semibold text-slate-900">Client</p>
              <p className="text-slate-600">{clientName}</p>
              <p className="text-slate-600">{booking.address}{booking.city ? `, ${booking.city}` : ""}</p>
            </div>
            <div className="text-right">
              <p className="mb-1 font-semibold text-slate-900">Infirmier</p>
              <p className="text-slate-600">{booking.nurse ? `${booking.nurse.user.firstName} ${booking.nurse.user.lastName}` : "—"}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead><tr className="border-y bg-slate-50 text-left text-slate-600"><th className="p-3">Prestation</th><th className="p-3 text-right">Montant</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="p-3 text-slate-800">{booking.service.name}</td><td className="p-3 text-right text-slate-800">{formatTND(booking.price)}</td></tr>
            </tbody>
          </table>

          <div className="ml-auto mt-6 w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-slate-600"><span>Total à payer</span><span className="font-bold text-slate-900">{formatTND(booking.price)}</span></div>
            <div className="flex justify-between text-xs text-slate-400"><span>Commission plateforme (20%)</span><span>{formatTND(booking.commissionAmount)}</span></div>
            <div className="flex justify-between text-xs text-slate-400"><span>Net infirmier (80%)</span><span>{formatTND(booking.nurseAmount)}</span></div>
          </div>

          <div className="mt-8 border-t pt-4 text-center text-xs text-slate-400">
            {isInvoice && booking.payment?.status === "PAID" ? "Payé — merci de votre confiance." : "Document non contractuel tant que la mission n'est pas acceptée et payée."}
          </div>
        </div>
      </div>
    </div>
  );
}
