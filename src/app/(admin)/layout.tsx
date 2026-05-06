import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/dashboard/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let adminUser = null;
  if (user) {
    const { data } = await supabase
      .from("admin_users")
      .select("id, email, full_name, role, created_at")
      .eq("id", user.id)
      .single();
    adminUser = data;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <AdminNav userEmail={user.email} adminUser={adminUser} />}
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
