import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "@/features/patients/api";
import { doctorsApi } from "@/features/doctors/api";
import { fullName } from "@/shared/utils/format";
import type { Patient } from "@/features/patients/types";
import type { Doctor } from "@/features/doctors/types";

export interface LookupOption {
  id: string;
  label: string;
}

/** Patients and doctors are referenced across most features, so both lists are cached once. */
export function useLookups() {
  const patients = useQuery({
    queryKey: ["patients", "lookup"],
    queryFn: () => patientsApi.peekAll(),
    staleTime: 30_000,
  });
  const doctors = useQuery({
    queryKey: ["doctors", "lookup"],
    queryFn: () => doctorsApi.peekAll(),
    staleTime: 30_000,
  });

  const patientName = (id: string) => {
    const patient = patients.data?.find((item: Patient) => item.id === id);
    return patient ? fullName(patient.firstName, patient.lastName) : "—";
  };
  const doctorName = (id: string) => {
    const doctor = doctors.data?.find((item: Doctor) => item.id === id);
    return doctor ? `Dr. ${fullName(doctor.firstName, doctor.lastName)}` : "—";
  };

  const patientOptions: LookupOption[] = (patients.data ?? []).map((patient) => ({
    id: patient.id,
    label: `${fullName(patient.firstName, patient.lastName)} · ${patient.reference}`,
  }));
  const doctorOptions: LookupOption[] = (doctors.data ?? []).map((doctor) => ({
    id: doctor.id,
    label: `Dr. ${fullName(doctor.firstName, doctor.lastName)} · ${doctor.specialty}`,
  }));

  return {
    patients: patients.data ?? [],
    doctors: doctors.data ?? [],
    patientOptions,
    doctorOptions,
    patientName,
    doctorName,
    isLoading: patients.isLoading || doctors.isLoading,
  };
}
