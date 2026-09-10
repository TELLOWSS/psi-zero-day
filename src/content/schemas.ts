import { z } from 'zod';
import { TIME_SLOTS, CORE_STAGES, CONSTRUCTION_STAGES } from '../domain';
import type {
  AssetManifest, CharacterDefinition, Condition, ContentBundle, Effect, EffectBundle,
  EndingRule, EventDefinition, FollowUpDefinition, GameTime, LocalizationCatalog, RelationState,
} from '../domain';

export const idSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
export const textIdSchema = idSchema;
const finite = z.number().finite();
const nonnegativeInteger = z.number().int().min(0);
const flagValue = z.union([z.boolean(), finite, z.string()]);
const flags = z.record(idSchema, flagValue);
const stats = z.record(idSchema, finite);
const locale = z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/);
const operator = z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte']);
const stage = z.enum([...CORE_STAGES, ...CONSTRUCTION_STAGES]);
export const gameTimeSchema: z.ZodType<GameTime> = z.strictObject({
  day: z.number().int().min(1), slot: z.enum(TIME_SLOTS),
  display_time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
});

export const conditionSchema: z.ZodType<Condition> = z.lazy(() => z.union([
  z.strictObject({ kind: z.enum(['all', 'any']), conditions: z.array(conditionSchema) }),
  z.strictObject({ kind: z.literal('not'), condition: conditionSchema }),
  z.strictObject({ kind: z.literal('flag'), flag_id: idSchema, equals: flagValue }),
  z.strictObject({ kind: z.literal('stat'), character_id: idSchema, stat_id: idSchema,
    operator, value: finite }),
  z.strictObject({ kind: z.literal('event_completed'), event_id: idSchema,
    minimum_count: z.number().int().min(1) }),
  z.strictObject({ kind: z.literal('player_stat'), stat_id: idSchema, operator, value: finite }),
  z.strictObject({ kind: z.literal('relation'), from_id: idSchema, to_id: idSchema,
    field: z.enum(['trust', 'respect', 'reporting']), operator, value: finite }),
  z.strictObject({ kind: z.literal('construction_stage'), stage_id: stage, operator: z.enum(['eq', 'ne']) }),
  z.strictObject({ kind: z.literal('construction_progress'), stage_id: stage, operator, value: finite }),
  z.strictObject({ kind: z.literal('choice_selected'), event_id: idSchema, choice_id: idSchema,
    minimum_count: z.number().int().min(1) }),
  z.strictObject({ kind: z.literal('compare'), left: flagValue, operator, right: flagValue }),
  z.strictObject({ kind: z.literal('flag_compare'), flag_id: idSchema, operator, value: flagValue }),
]));
const conditions = z.array(conditionSchema);
const statEffect = z.strictObject({ effect_id: idSchema, kind: z.literal('stat'),
  character_id: idSchema, stat_id: idSchema, delta: finite });
const relationEffect = z.strictObject({ effect_id: idSchema, kind: z.literal('relation'),
  from_id: idSchema, to_id: idSchema, field: z.enum(['trust', 'respect', 'reporting']), delta: finite });
export const effectSchema: z.ZodType<Effect> = z.union([
  statEffect, relationEffect,
  z.strictObject({ effect_id: idSchema, kind: z.literal('flag'), flag_id: idSchema, value: flagValue }),
  z.strictObject({ effect_id: idSchema, kind: z.literal('reveal'), character_id: idSchema, field_id: idSchema }),
  z.strictObject({ effect_id: idSchema, kind: z.literal('player_stat'), stat_id: idSchema, delta: finite }),
  z.strictObject({ effect_id: idSchema, kind: z.literal('flag_change'), flag_id: idSchema, delta: finite }),
  z.strictObject({ effect_id: idSchema, kind: z.literal('construction_progress'), stage_id: stage, delta: finite }),
]);
export const followUpDefinitionSchema: z.ZodType<FollowUpDefinition> = z.strictObject({
  followup_id: idSchema, event_id: idSchema,
  delay: z.strictObject({ days: nonnegativeInteger, slot: z.enum(TIME_SLOTS).optional() }),
  conditions, unmet_policy: z.enum(['defer', 'cancel', 'fail']),
});
export const effectBundleSchema: z.ZodType<EffectBundle> = z.strictObject({
  immediate_effects: z.array(effectSchema), hidden_effects: z.array(effectSchema),
  relationship_effects: z.array(relationEffect), stat_effects: z.array(statEffect),
  flags, ending_flags: flags, followup_events: z.array(followUpDefinitionSchema),
});
export const characterDefinitionSchema: z.ZodType<CharacterDefinition> = z.strictObject({
  schema_version: z.literal(1), id: idSchema, name_text_id: textIdSchema,
  role_text_id: textIdSchema, trade_text_id: textIdSchema, age_group_text_id: textIdSchema,
  nationality_text_id: textIdSchema, experience: finite.min(0), stats,
  traits: z.array(textIdSchema), weaknesses: z.array(textIdSchema),
  appearance_conditions: conditions, exit_conditions: conditions,
  asset_bindings: z.record(idSchema, idSchema),
});
export const relationStateSchema: z.ZodType<RelationState> = z.strictObject({
  from_id: idSchema, to_id: idSchema, relationship_values: stats,
  trust: finite, respect: finite, reporting: finite, flags, history: z.array(idSchema),
});
export const eventDefinitionSchema: z.ZodType<EventDefinition> = z.strictObject({
  schema_version: z.literal(1), event_id: idSchema,
  title_text_id: textIdSchema, category_text_id: textIdSchema, chapter_text_id: textIdSchema,
  conditions,
  participants: z.array(z.strictObject({ role_id: idSchema, character_id: idSchema })),
  scene: z.strictObject({ background_asset_id: idSchema.optional(), character_asset_ids: z.array(idSchema) }),
  entry_node_id: idSchema,
  dialogue: z.array(z.strictObject({ node_id: idSchema, text_id: textIdSchema,
    speaker_role_id: idSchema.optional(), next_node_id: idSchema.optional(), choice_ids: z.array(idSchema) })).min(1),
  choices: z.array(z.strictObject({ choice_id: idSchema, text_id: textIdSchema,
    requirements: conditions, next_node_id: idSchema.optional(), effects: effectBundleSchema })),
  failure_conditions: conditions, failure_effects: effectBundleSchema.optional(),
});
export const endingRuleSchema: z.ZodType<EndingRule> = z.strictObject({
  schema_version: z.literal(1), ending_id: idSchema, title_text_id: textIdSchema,
  eligibility: conditions, accumulated_requirements: conditions, exclusions: conditions,
  result_asset_ids: z.array(idSchema), archive_text_id: textIdSchema,
});

// Packaged local paths only: no network, absolute paths or traversal.
const assetUri = z.string().regex(/^assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.[A-Za-z0-9]+$/);
export const assetManifestSchema: z.ZodType<AssetManifest> = z.strictObject({
  schema_version: z.literal(1),
  assets: z.array(z.strictObject({
    asset_id: idSchema, type: z.enum(['image', 'audio']), group_id: idSchema,
    variants: z.array(z.strictObject({ uri: assetUri, format: z.string().min(1),
      bytes: nonnegativeInteger, hash: z.string().regex(/^[a-f0-9]{64}$/),
      width: z.number().int().positive().optional(), height: z.number().int().positive().optional(),
      locale: locale.optional() })).min(1),
    dependencies: z.array(idSchema), fallback_id: idSchema.optional(),
    preload_policy: z.enum(['required', 'next_scene', 'on_demand']), version: z.string().min(1),
  })),
});
export const localizationCatalogSchema: z.ZodType<LocalizationCatalog> = z.strictObject({
  locale, messages: z.record(textIdSchema, z.string().min(1)),
});
export const contentBundleSchema: z.ZodType<ContentBundle> = z.strictObject({
  schema_version: z.literal(1), content_version: z.string().min(1), default_locale: locale,
  localizations: z.array(localizationCatalogSchema).min(1),
  characters: z.array(characterDefinitionSchema), relations: z.array(relationStateSchema),
  events: z.array(eventDefinitionSchema), endings: z.array(endingRuleSchema),
  asset_manifest: assetManifestSchema,
});
