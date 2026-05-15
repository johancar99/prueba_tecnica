export type PrescriptionStatus = 'pending' | 'consumed' | 'completed' | 'cancelled';

export interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
}

export interface PrescriptionAuthor {
  id: string;
  licenseNumber: string;
  specialty: string | null;
  user: { id: string; name: string; email: string };
}

export interface PrescriptionPatient {
  id: string;
  birthDate: string | null;
  phone: string | null;
  user: { id: string; name: string; email: string };
}

export interface Prescription {
  id: string;
  code: string;
  status: PrescriptionStatus;
  notes?: string | null;
  consumedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: PrescriptionAuthor;
  patient: PrescriptionPatient;
  items: PrescriptionItem[];
}

export interface PrescriptionsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
}

export interface CreatePrescriptionItemPayload {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface CreatePrescriptionPayload {
  patientId: string;
  notes?: string;
  items: CreatePrescriptionItemPayload[];
}

export interface PatientRecord {
  id: string;
  birthDate: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  };
}
