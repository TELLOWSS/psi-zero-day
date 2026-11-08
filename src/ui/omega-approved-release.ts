import type {OmegaApprovedManifest} from './omega-combat-art-contract';

/**
 * Fail-closed production authority.
 * Never fill this from localStorage, query params, user-provided JSON or a
 * browser settings toggle. Only a reviewed build artifact and validated binary
 * manifest may replace these defaults in a later explicit release.
 *
 * Art candidate ZIP v3 is NOT the required release asset.
 */
export const OMEGA_APPROVED_RELEASE:OmegaApprovedManifest|null=null;
export const OMEGA_RELEASE_BINARY_AUDIT_PASSED=false;
