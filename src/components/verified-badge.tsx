import { BadgeCheck } from "lucide-react";

/** Badge "vérifié" style réseaux sociaux. */
export function VerifiedBadge({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span title="Profil vérifié" className={`inline-flex ${className}`}>
      <BadgeCheck className="text-sky-400" style={{ width: size, height: size }} fill="rgba(56,189,248,0.18)" />
    </span>
  );
}
