import Button from "../common/Button.jsx";

export default function DoctorProfileView({ doctor, onBook }) {
  if (!doctor) return null;
  const name = doctor?.userId?.name || "Doctor";
  return (
    <div className="rounded-xl border bg-white p-4 md:p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            {name}
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            {doctor.specialty}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {doctor.qualifications?.length
              ? doctor.qualifications.join(", ")
              : null}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Languages:{" "}
            {doctor.languages?.length ? doctor.languages.join(", ") : "—"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <span className="rounded-full bg-slate-100 px-3 md:px-4 py-2 text-sm font-medium text-slate-700 text-center">
            ₹{doctor.consultationFee ?? "—"}
          </span>
          <Button type="button" onClick={onBook} className="w-full sm:w-auto">
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
