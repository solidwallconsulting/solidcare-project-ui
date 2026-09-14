import { createResourceApi } from "@/shared/api/resource-api";
import { MockRepository } from "@/shared/api/mock-repository";
import { examSeed } from "./mock-data";
import type { ExamListQuery, ExamRequest } from "./types";

export const examinationsRepository = new MockRepository<ExamRequest>(examSeed, "exam", [
  "reference",
  "title",
  "reason",
  "resultNotes",
]);

export const examinationsApi = createResourceApi<ExamRequest, ExamListQuery>(
  "/examinations",
  examinationsRepository,
  {
    filter: (item, query) => {
      const statusOk = !query.status || query.status === "all" || item.status === query.status;
      const typeOk =
        !query.examType || query.examType === "all" || item.examType === query.examType;
      const priorityOk =
        !query.priority || query.priority === "all" || item.priority === query.priority;
      const patientOk =
        !query.patientId || query.patientId === "all" || item.patientId === query.patientId;
      return statusOk && typeOk && priorityOk && patientOk;
    },
  },
);

export const examinationKeys = {
  all: ["examinations"] as const,
  list: (query: ExamListQuery) => ["examinations", "list", query] as const,
  detail: (id: string) => ["examinations", "detail", id] as const,
  options: ["examinations", "options"] as const,
};
