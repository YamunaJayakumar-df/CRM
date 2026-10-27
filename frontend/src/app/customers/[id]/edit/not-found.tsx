// Shown when someone opens /customers/<id>/edit for a customer that does not
// exist (wrong link, or the customer was removed). Next.js uses this file
// whenever the edit page calls notFound().
import CustomerNotFoundCard from "@/components/customers/CustomerNotFoundCard";

export default function EditCustomerNotFound() {
  return <CustomerNotFoundCard />;
}
