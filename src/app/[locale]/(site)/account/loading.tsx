import { PageSkeleton } from "@/components/PageSkeleton";

// Scheletro mentre /account (e le sue sottopagine, tutte renderizzate sul server) legge sessione e database (17/10/2026)
export default function AccountLoading() {
  return <PageSkeleton />;
}
