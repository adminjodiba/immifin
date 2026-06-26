import { getSupabaseAdminClient } from "@/lib/supabase/server";

type AdminAuditLogInput = {
  actorProfileId: string | null;
  actorClerkUserId: string;
  actorEmail: string;
  action: string;
  resource?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAdminAuditLog(input: AdminAuditLogInput): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("admin_audit_log").insert({
    actor_profile_id: input.actorProfileId,
    actor_clerk_user_id: input.actorClerkUserId,
    actor_email: input.actorEmail,
    action: input.action,
    resource: input.resource ?? null,
    metadata: input.metadata ?? {},
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
  });

  if (error) {
    throw new Error(`Failed to write admin audit log: ${error.message}`);
  }
}

export function getRequestAuditMetadata(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  return {
    ipAddress,
    userAgent,
  };
}
