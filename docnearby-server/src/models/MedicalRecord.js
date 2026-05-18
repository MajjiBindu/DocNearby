import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, default: "" },
  frequency: { type: String, default: "" },
  duration: { type: String, default: "" }
}, { _id: false });

const pdfAttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    diagnosis: { type: String, required: true },
    medicines: { type: [medicineSchema], default: [] },
    advice: { type: String, default: "" },
    notes: { type: String, default: "" },
    
    // Extensible fields
    pdfs: { type: [pdfAttachmentSchema], default: [] },
    labReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabReport', index: true },
    
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
