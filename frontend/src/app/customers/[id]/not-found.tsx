// Shown when someone opens /customers/<id> for a customer that does not
// exist (wrong link, or the customer was removed). Next.js uses this file
// whenever the customer page calls notFound().
import CustomerNotFoundCard from "@/components/customers/CustomerNotFoundCard";

export default function CustomerPageNotFound() {
  return <CustomerNotFoundCard />;
}
