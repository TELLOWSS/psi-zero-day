/* Generated from src/domain/psi-operator-profile.ts; run node scripts/build-signal-breaker-operator-profile.mjs --write */
var PSIOperatorProfile = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/domain/psi-operator-profile.ts
	/** PSI operator growth contract. Pure domain: no browser, UI, clock or storage dependencies. */
	var OPERATOR_PROFILE_VERSION = 1;
	var OPERATOR_MAX_LEVEL = 20;
	var isCount = (v) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
	var isId = (v) => typeof v === "string" && v.length > 0 && v.length <= 256 && !/[\u0000-\u001f]/.test(v);
	var isIds = (v) => Array.isArray(v) && v.every(isId) && new Set(v).size === v.length;
	function createOperatorProfile() {
		return {
			version: 1,
			revision: 0,
			xp: 0,
			settledRuns: [],
			clearedStages: [],
			confirmedEvidence: [],
			completedResearch: []
		};
	}
	function validOperatorProfile(v) {
		if (!v || typeof v !== "object") return false;
		const p = v;
		return p.version === 1 && isCount(p.revision) && p.revision < Number.MAX_SAFE_INTEGER && isCount(p.xp) && isIds(p.settledRuns) && isIds(p.clearedStages) && isIds(p.confirmedEvidence) && isIds(p.completedResearch);
	}
	function operatorProgress(xp) {
		let remaining = isCount(xp) ? xp : 0;
		let level = 1;
		while (level < 20) {
			const cost = 120 + 20 * (level - 1);
			if (remaining < cost) break;
			remaining -= cost;
			level++;
		}
		return {
			level,
			earnedAbilityPoints: Math.floor(level / 2),
			currentXp: level === 20 ? 0 : remaining,
			nextLevelXp: level === 20 ? null : 120 + 20 * (level - 1)
		};
	}
	/** Migrate only the new profile. Preserve legacy and future save fields verbatim. Never infer historical XP/evidence. */
	function migrateOperatorSave(saved) {
		if (saved.operatorProfile !== void 0 && !validOperatorProfile(saved.operatorProfile)) return {
			ok: false,
			error: "invalid-profile"
		};
		const migrated = saved.operatorProfile === void 0;
		const profile = migrated ? createOperatorProfile() : snapshotOperatorProfile(saved.operatorProfile);
		return {
			ok: true,
			save: {
				...saved,
				operatorProfile: profile
			},
			migrated
		};
	}
	/** Freeze growth for the running operation by copying the entry profile. */
	function snapshotOperatorProfile(p) {
		return {
			...p,
			settledRuns: [...p.settledRuns],
			clearedStages: [...p.clearedStages],
			confirmedEvidence: [...p.confirmedEvidence],
			completedResearch: [...p.completedResearch]
		};
	}
	/** Receipts must be supplied by a verified engine adapter, never inferred from shots or arbitrary UI selection. */
	function settleOperatorRun(p, r, expectedRevision) {
		if (!validOperatorProfile(p)) return {
			ok: false,
			error: "invalid-profile"
		};
		if (!r || !isId(r.runId) || !/^CH-0[1-5]$/.test(r.stageId) || ![1, 2].includes(r.episode) || !["won", "lost"].includes(r.outcome) || !isIds(r.completedFieldIds) || r.completedFieldIds.length > 5 || !isIds(r.verifiedEvidenceIds) || !isIds(r.newResearchObjectiveIds)) return {
			ok: false,
			error: "invalid-receipt"
		};
		if (expectedRevision !== p.revision) return {
			ok: false,
			error: "revision-conflict"
		};
		if (p.settledRuns.includes(r.runId)) return {
			ok: true,
			profile: p,
			awardedXp: 0,
			duplicate: true
		};
		const stage = "EP0" + r.episode + ":" + r.stageId;
		const firstWin = r.outcome === "won" && !p.clearedStages.includes(stage);
		const fieldXp = Math.min(r.completedFieldIds.length * 10, r.episode === 1 && p.clearedStages.includes(stage) ? 30 : 50);
		const evidence = r.verifiedEvidenceIds.filter((id) => !p.confirmedEvidence.includes(id)).slice(0, 3);
		const research = r.newResearchObjectiveIds.filter((id) => !p.completedResearch.includes(id));
		const awardedXp = fieldXp + evidence.length * 20 + (firstWin ? 60 : 0) + research.length * 20;
		if (!Number.isSafeInteger(p.xp + awardedXp)) return {
			ok: false,
			error: "invalid-profile"
		};
		return {
			ok: true,
			profile: {
				...p,
				revision: p.revision + 1,
				xp: p.xp + awardedXp,
				settledRuns: [...p.settledRuns, r.runId],
				clearedStages: firstWin ? [...p.clearedStages, stage] : [...p.clearedStages],
				confirmedEvidence: [...p.confirmedEvidence, ...evidence],
				completedResearch: [...p.completedResearch, ...research]
			},
			awardedXp,
			duplicate: false
		};
	}
	//#endregion
	exports.OPERATOR_MAX_LEVEL = OPERATOR_MAX_LEVEL;
	exports.OPERATOR_PROFILE_VERSION = OPERATOR_PROFILE_VERSION;
	exports.createOperatorProfile = createOperatorProfile;
	exports.migrateOperatorSave = migrateOperatorSave;
	exports.operatorProgress = operatorProgress;
	exports.settleOperatorRun = settleOperatorRun;
	exports.snapshotOperatorProfile = snapshotOperatorProfile;
	exports.validOperatorProfile = validOperatorProfile;
	return exports;
})({});

(function(root){root.PSIOperatorProfile=PSIOperatorProfile;if(typeof module==="object"&&module.exports)module.exports=PSIOperatorProfile;})(typeof window!=="undefined"?window:globalThis);
