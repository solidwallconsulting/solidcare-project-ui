import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "@/features/patients/api";
import { doctorsApi } from "@/features/doctors/api";
import { departmentsApi } from "@/features/departments/api";
import { fullName } from "@/shared/utils/format";
import type { Patient } from "@/features/patients/types";
import type { Doctor } from "@/features/doctors/types";
import type { Department } from "@/features/departments/types";

export interface LookupOption {
  id: string;
  label: string;
}

/** Patients, doctors and departments are referenced across features — cached once. */
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
  const departments = useQuery({
    queryKey: ["departments", "lookup"],
    queryFn: () => departmentsApi.peekAll(),
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
  const departmentName = (id: string) => {
    const department = departments.data?.find((item: Department) => item.id === id);
    return department?.name ?? "—";
  };

  const patientOptions: LookupOption[] = (patients.data ?? []).map((patient) => ({
    id: patient.id,
    label: `${fullName(patient.firstName, patient.lastName)} · ${patient.reference}`,
  }));
  const doctorOptions: LookupOption[] = (doctors.data ?? []).map((doctor) => ({
    id: doctor.id,
    label: `Dr. ${fullName(doctor.firstName, doctor.lastName)} · ${doctor.specialty}`,
  }));
  const departmentOptions: LookupOption[] = (departments.data ?? []).map((department) => ({
    id: department.id,
    label: `${department.name} · ${department.code}`,
  }));

  return {
    patients: patients.data ?? [],
    doctors: doctors.data ?? [],
    departments: departments.data ?? [],
    patientOptions,
    doctorOptions,
    departmentOptions,
    patientName,
    doctorName,
    departmentName,
    isLoading: patients.isLoading || doctors.isLoading || departments.isLoading,
  };
}
