export type {
  Hospitalization,
  HospitalizationFormValues,
  HospitalizationListQuery,
  HospitalizationStatus,
  TransferFormValues,
} from "./types";
export {
  hospitalizationSchema,
  transferSchema,
  hospitalizationStatuses,
  hospitalizationStatusLabels,
} from "./types";
export {
  hospitalizationsApi,
  hospitalizationKeys,
  hospitalizationsRepository,
} from "./api";
export { hospitalizationSeed } from "./mock-data";
export { HospitalizationFormDialog } from "./components/hospitalization-form-dialog";
export { TransferDialog } from "./components/transfer-dialog";
export { HospitalizationsPage } from "./pages/hospitalizations-page";
