import { requireAdminSession } from "@app/actions/auth";
import { listCredentials } from "@/repositories/credential_repository";
import { CredentialsView } from "@/features/admin/CredentialsView";

export default async function AdminCredentialsPage() {
  const session = await requireAdminSession();
  const credentials = await listCredentials();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Admin users
        </h1>
        <p className="text-stone-400 text-sm">
          Usernames and roles. Add or remove admins, change passwords.
        </p>
      </section>

      <CredentialsView
        credentials={credentials}
        currentUsername={session.username}
      />
    </div>
  );
}
