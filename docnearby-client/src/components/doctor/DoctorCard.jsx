import { Link } from "react-router-dom";

export default function DoctorCard({ doctor }) {
  const name = doctor?.userId?.name || "Doctor";
  const specialty = doctor?.specialty || "";
  const fee = doctor?.consultationFee ?? null;
  const clinicName = doctor?.clinicId?.name || "";
  const city = doctor?.clinicId?.city || "";

  return (
    <div className="group rounded-2xl border border-grey-blue-leaf/20 bg-white p-5 md:p-6 shadow-sm hover:shadow-2xl hover:shadow-blue-popsicle/10 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-blue-popsicle text-xl truncate">
            {name}
          </h3>
          <p className="text-sm font-semibold text-grey-blue-leaf truncate">{specialty}</p>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {clinicName}
            {clinicName && city ? " • " : ""}
            {city}
          </p>
        </div>
        {fee !== null ? (
          <span className="rounded-xl bg-redline/10 px-3 py-1.5 text-xs font-bold text-redline shrink-0 border border-redline/10">
            ₹{fee}
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-400">
          Rating: <span className="text-redline">{doctor?.rating?.toFixed?.(1) ?? doctor?.rating ?? "—"}</span> (
          {doctor?.reviewCount ?? 0})
        </p>
        <Link
          to={`/doctors/${doctor?._id}`}
          className="rounded-xl bg-redline text-white px-5 py-2 text-sm font-bold hover:bg-redline/90 shadow-lg shadow-redline/20 transition-all active:scale-95"
        >
          Book
        </Link>
      </div>
    </div>
  );
}
