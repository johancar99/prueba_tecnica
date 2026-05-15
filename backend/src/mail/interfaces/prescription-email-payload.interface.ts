export interface PrescriptionEmailItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
}

export interface PrescriptionEmailPayload {
  to: string;
  patientName: string;
  doctorName: string;
  prescriptionCode: string;
  prescriptionId: string;
  items: PrescriptionEmailItem[];
}
