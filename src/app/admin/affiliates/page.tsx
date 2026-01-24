import { requireSectionAccess } from '@/lib/auth';
import AffiliatesClient from './AffiliatesClient';

export default async function AdminAffiliatesPage() {
  await requireSectionAccess('affiliates');

  return <AffiliatesClient />;
}
