import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const catalogPath = path.join(root, 'content/episode01/scene-element-catalog.json');
const productionCheck = process.argv.includes('--production-check');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const definitions = Object.entries(catalog.elements ?? {});
const placedElementKeys = new Set(
  Object.values(catalog.event_elements ?? {}).flat().map(item => item.element_key),
);
const minimumReusableCount = 10;
const errors = [];
const assetIds = new Set();
const paths = new Set();

async function tryRead(uri) {
  try {
    return await readFile(path.join(root, 'public', uri));
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

function validNormalized(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function validateLiftingProfile(key, definition) {
  const profile = definition.lifting_profile;
  if (!profile) return;
  if (!['general_material', 'gangform'].includes(profile.load_family)) {
    errors.push(`${key}: lifting_profile.load_family must be general_material or gangform`);
  }
  if (!['round_sling', 'wire_rope'].includes(profile.rigging_method)) {
    errors.push(`${key}: lifting_profile.rigging_method must be round_sling or wire_rope`);
  }
  if (!['choker', 'site_defined'].includes(profile.hitch_method)) {
    errors.push(`${key}: lifting_profile.hitch_method must be choker or site_defined`);
  }
  if (!['manufacturer_choker_wll', 'work_plan_and_rated_capacity'].includes(profile.capacity_basis)) {
    errors.push(`${key}: lifting_profile.capacity_basis is invalid`);
  }
  if (profile.rigging_method === 'round_sling' && profile.wire_rope_diameter_mm !== null) {
    errors.push(`${key}: round_sling profile must not define wire_rope_diameter_mm`);
  }
  if (profile.rigging_method === 'wire_rope'
    && (!Number.isFinite(profile.wire_rope_diameter_mm) || profile.wire_rope_diameter_mm <= 0)) {
    errors.push(`${key}: wire_rope profile requires a positive wire_rope_diameter_mm`);
  }
  if (typeof profile.site_practice_note !== 'string' || !profile.site_practice_note.trim()) {
    errors.push(`${key}: lifting_profile.site_practice_note is required`);
  }
  if (typeof profile.safety_evaluation_note !== 'string' || !profile.safety_evaluation_note.trim()) {
    errors.push(`${key}: lifting_profile.safety_evaluation_note is required`);
  }
}

function validateFallProtectionProfile(key, definition) {
  const profile = definition.fall_protection_profile;
  if (!profile) return;
  if (profile.harness_type !== 'full_body') errors.push(`${key}: fall_protection_profile.harness_type must be full_body`);
  if (profile.certification_context !== 'KCs safety-certified product family') errors.push(`${key}: fall protection must use a Korean KCs-certified product family as the reference context`);
  if (profile.scenario_configuration === 'twin_y_double_lanyard' && (profile.lanyard_count !== 2 || profile.hook_count !== 2)) errors.push(`${key}: the authored twin-Y scenario requires two lanyards and two hooks`);
  if (profile.scenario_configuration_is_universal_requirement !== false) errors.push(`${key}: site/scenario harness configuration must not be asserted as a universal Korean legal requirement`);
  if (profile.branding_policy !== 'no_logo_no_trademark') errors.push(`${key}: final harness art must remain brand-neutral`);
  if (typeof profile.design_reference !== 'string' || !profile.design_reference.trim()) errors.push(`${key}: fall_protection_profile.design_reference is required`);
  if (typeof profile.site_practice_note !== 'string' || !profile.site_practice_note.trim()) errors.push(`${key}: fall_protection_profile.site_practice_note is required`);
  if (typeof profile.safety_evaluation_note !== 'string' || !profile.safety_evaluation_note.trim()) errors.push(`${key}: fall_protection_profile.safety_evaluation_note is required`);
}

function validateStorageProfile(key, definition) {
  const profile = definition.storage_profile;
  if (!profile) return;
  if (profile.dimension_grouping !== 'same_spec_only') errors.push(`${key}: storage_profile.dimension_grouping must be same_spec_only`);
  if (profile.mixed_dimensions_allowed !== false) errors.push(`${key}: mixed-dimension materials must be separated into different bundles`);
  if (profile.binding_method !== 'center_ratchet_or_equivalent') errors.push(`${key}: storage_profile.binding_method must be center_ratchet_or_equivalent`);
  if (profile.binding_position !== 'center') errors.push(`${key}: storage_profile.binding_position must be center`);
  if (typeof profile.site_practice_note !== 'string' || !profile.site_practice_note.trim()) errors.push(`${key}: storage_profile.site_practice_note is required`);
  if (typeof profile.safety_evaluation_note !== 'string' || !profile.safety_evaluation_note.trim()) errors.push(`${key}: storage_profile.safety_evaluation_note is required`);
}

function validateAccessControlProfile(key, definition) {
  const profile = definition.access_control_profile;
  if (!profile) return;
  if (profile.barrier_form !== 'korean_banding_movable_screen_fence') errors.push(`${key}: access_control_profile.barrier_form must use the locked Korean banding movable screen fence family`);
  if (profile.body_material !== 'galvanized_round_tube_with_blue_mesh') errors.push(`${key}: access_control_profile.body_material must be galvanized round tube with blue mesh`);
  if (profile.stabilization !== 'two_black_weighted_bases') errors.push(`${key}: access_control_profile.stabilization must use two black weighted bases`);
  if (profile.rounded_top_corners !== true) errors.push(`${key}: Korean banding fence must keep rounded top corners`);
  if (!Array.isArray(profile.tube_diameter_mm_options) || !profile.tube_diameter_mm_options.includes(25.4) || !profile.tube_diameter_mm_options.includes(31.8)) errors.push(`${key}: Korean banding fence must preserve the verified 25.4/31.8 mm product-family tube options`);
  if (profile.integrated_text_allowed !== false || profile.integrated_sign_allowed !== false) errors.push(`${key}: reusable access barrier art must not bake text or a situation-specific sign into the cutout`);
  if (profile.warning_lamps_allowed !== false) errors.push(`${key}: reusable access barrier art must not bake warning lamps into the generic cutout`);
  if (typeof profile.site_practice_note !== 'string' || !profile.site_practice_note.trim()) errors.push(`${key}: access_control_profile.site_practice_note is required`);
  if (typeof profile.control_evaluation_note !== 'string' || !profile.control_evaluation_note.trim()) errors.push(`${key}: access_control_profile.control_evaluation_note is required`);
}

function validateTrafficConflictProfile(key, definition) {
  const profile = definition.traffic_conflict_profile;
  if (!profile) return;
  if (profile.render_mode !== 'route_overlay') errors.push(`${key}: traffic_conflict_profile.render_mode must be route_overlay`);
  if (profile.vehicle_path_style !== 'wide_drive_path') errors.push(`${key}: vehicle path must use wide_drive_path`);
  if (profile.pedestrian_path_style !== 'narrow_walk_path') errors.push(`${key}: pedestrian path must use narrow_walk_path`);
  if (profile.conflict_marker !== 'highlighted_overlap') errors.push(`${key}: traffic conflict must use highlighted_overlap`);
  if (profile.directional_markings !== 'chevrons_and_lane_edges') errors.push(`${key}: directional markings must use chevrons_and_lane_edges`);
  if (profile.vehicle_object_allowed !== false || profile.pedestrian_object_allowed !== false) {
    errors.push(`${key}: reusable vehicle-overlap art must not bake a specific vehicle or person into the overlay`);
  }
  if (profile.integrated_text_allowed !== false || profile.branding_allowed !== false) {
    errors.push(`${key}: reusable vehicle-overlap art must not bake text or branding into the overlay`);
  }
  if (typeof profile.site_practice_note !== 'string' || !profile.site_practice_note.trim()) errors.push(`${key}: traffic_conflict_profile.site_practice_note is required`);
  if (typeof profile.safety_evaluation_note !== 'string' || !profile.safety_evaluation_note.trim()) errors.push(`${key}: traffic_conflict_profile.safety_evaluation_note is required`);
}

for (const [key, definition] of definitions) {
  const art = definition.art;
  const assetId = definition.planned_asset_id;

  if (!assetId || typeof assetId !== 'string') errors.push(`${key}: planned_asset_id is required`);
  else if (assetIds.has(assetId)) errors.push(`${key}: duplicate planned_asset_id ${assetId}`);
  else assetIds.add(assetId);

  validateLiftingProfile(key, definition);
  validateFallProtectionProfile(key, definition);
  validateStorageProfile(key, definition);
  validateAccessControlProfile(key, definition);
  validateTrafficConflictProfile(key, definition);

  if (!art || typeof art !== 'object') {
    errors.push(`${key}: art production spec is required`);
    continue;
  }

  if (!art.path || typeof art.path !== 'string') errors.push(`${key}: art.path is required`);
  else {
    if (paths.has(art.path)) errors.push(`${key}: duplicate art.path ${art.path}`);
    paths.add(art.path);
    if (!art.path.startsWith('assets/episode01/scene-elements/')) errors.push(`${key}: art.path must live under assets/episode01/scene-elements/`);
    if (path.extname(art.path).toLowerCase() !== '.webp') errors.push(`${key}: production art path must end in .webp (${art.path})`);
  }

  if (!Number.isInteger(art.minimum_width) || art.minimum_width < 256) errors.push(`${key}: minimum_width must be an integer >= 256`);
  if (!Number.isInteger(art.minimum_height) || art.minimum_height < 256) errors.push(`${key}: minimum_height must be an integer >= 256`);
  if (!validNormalized(art.pivot?.x) || !validNormalized(art.pivot?.y)) errors.push(`${key}: pivot.x and pivot.y must be normalized numbers from 0 to 1`);
  if (!Number.isInteger(art.map_max_px) || art.map_max_px < 72 || art.map_max_px > 220) errors.push(`${key}: map_max_px must be an integer from 72 to 220`);
  if (art.requires_alpha !== true) errors.push(`${key}: requires_alpha must be true for transparent scene cutouts`);

  const requireBinary = productionCheck
    || definition.production_status === 'final'
    || (definition.production_status === 'replacement_required' && placedElementKeys.has(key));
  if (!requireBinary || !art.path) continue;
  const bytes = await tryRead(art.path);
  if (!bytes) {
    errors.push(`${key}: missing final WebP public/${art.path}`);
    continue;
  }
  if (!isWebP(bytes)) {
    errors.push(`${key}: invalid WebP header (${art.path})`);
    continue;
  }
  const dimensions = webPDimensions(bytes);
  if (!dimensions) {
    errors.push(`${key}: unreadable WebP dimensions (${art.path})`);
    continue;
  }
  if (dimensions.width < art.minimum_width || dimensions.height < art.minimum_height) {
    errors.push(`${key}: ${dimensions.width}x${dimensions.height} is below minimum ${art.minimum_width}x${art.minimum_height} (${art.path})`);
  }
  if (art.requires_alpha && webPHasAlpha(bytes) !== true) errors.push(`${key}: production scene element must include WebP alpha transparency (${art.path})`);
}

const materialProfile = catalog.elements?.material_stack?.storage_profile;
const materialStatus = catalog.elements?.material_stack?.production_status;
if (!['final', 'replacement_required'].includes(materialStatus)) errors.push('material_stack: approved runtime asset must remain final or have a tracked replacement');
if (materialStatus === 'replacement_required' && !catalog.elements?.material_stack?.production_note?.trim()) errors.push('material_stack: replacement_required status must include a production_note');
if (materialProfile?.dimension_grouping !== 'same_spec_only' || materialProfile?.mixed_dimensions_allowed !== false) errors.push('material_stack: different material dimensions/specifications must be separated');
if (materialProfile?.binding_method !== 'center_ratchet_or_equivalent' || materialProfile?.binding_position !== 'center') errors.push('material_stack: a central ratchet buckle or equivalent separate binding must be visible');

const accessProfile = catalog.elements?.access_barrier?.access_control_profile;
if (!accessProfile) errors.push('access_barrier: reusable access-control profile is required before final art production');
else {
  if (accessProfile.barrier_form !== 'korean_banding_movable_screen_fence'
    || accessProfile.body_material !== 'galvanized_round_tube_with_blue_mesh'
    || accessProfile.stabilization !== 'two_black_weighted_bases'
    || accessProfile.rounded_top_corners !== true) {
    errors.push('access_barrier: final visual must use the locked Korean blue-mesh banding fence family with rounded galvanized frame and two black weighted bases');
  }
  if (accessProfile.integrated_text_allowed !== false || accessProfile.integrated_sign_allowed !== false || accessProfile.warning_lamps_allowed !== false) errors.push('access_barrier: generic production cutout must exclude baked text, signs, and warning lamps');
}

const trafficProfile = catalog.elements?.vehicle_overlap_zone?.traffic_conflict_profile;
if (!trafficProfile) errors.push('vehicle_overlap_zone: reusable traffic-conflict profile is required before final art production');
else {
  if (trafficProfile.render_mode !== 'route_overlay'
    || trafficProfile.vehicle_path_style !== 'wide_drive_path'
    || trafficProfile.pedestrian_path_style !== 'narrow_walk_path'
    || trafficProfile.conflict_marker !== 'highlighted_overlap') {
    errors.push('vehicle_overlap_zone: final visual must show a wide vehicle route and narrow pedestrian route with a highlighted overlap');
  }
  if (trafficProfile.vehicle_object_allowed !== false
    || trafficProfile.pedestrian_object_allowed !== false
    || trafficProfile.integrated_text_allowed !== false
    || trafficProfile.branding_allowed !== false) {
    errors.push('vehicle_overlap_zone: reusable overlay must exclude baked vehicles, people, text, and branding');
  }
}

const harnessProfile = catalog.elements?.harness_unclipped?.fall_protection_profile;
if (harnessProfile?.scenario_configuration !== 'twin_y_double_lanyard' || harnessProfile?.lanyard_count !== 2 || harnessProfile?.hook_count !== 2) errors.push('harness_unclipped: this authored Episode 01 scenario uses a twin-Y two-lanyard/two-hook configuration');
if (harnessProfile?.scenario_configuration_is_universal_requirement !== false) errors.push('harness_unclipped: the twin-Y configuration must remain scenario-specific, not a universal Korean legal claim');
if (catalog.elements?.harness_unclipped?.art?.path !== 'assets/episode01/scene-elements/harness-twin-lanyard-unclipped.webp') errors.push('harness_unclipped: production art path must identify the authored twin-lanyard profile');
if (harnessProfile?.branding_policy !== 'no_logo_no_trademark') errors.push('harness_unclipped: final game art must not embed SWELOCK or other manufacturer branding');

const generalLift = catalog.elements?.suspended_load?.lifting_profile;
if (generalLift?.rigging_method !== 'round_sling') errors.push('suspended_load: general lifting must use round_sling visual profile');
if (generalLift?.hitch_method !== 'choker') errors.push('suspended_load: general lifting must use choker hitch as the site default profile');
if (generalLift?.capacity_basis !== 'manufacturer_choker_wll') errors.push('suspended_load: general lifting capacity must reference manufacturer choker WLL');
const gangformLift = catalog.elements?.gangform_lift_wire22?.lifting_profile;
if (gangformLift?.rigging_method !== 'wire_rope' || gangformLift?.wire_rope_diameter_mm !== 22) errors.push('gangform_lift_wire22: gangform lifting must use 22 mm wire_rope visual profile');
if (gangformLift?.hitch_method !== 'site_defined') errors.push('gangform_lift_wire22: gangform hitch method must remain site_defined until an authored work plan specifies it');

if (definitions.length < minimumReusableCount) errors.push(`expected at least ${minimumReusableCount} reusable scene element slots, found ${definitions.length}`);

if (errors.length) {
  console.error(`Scene element ${productionCheck ? 'production art' : 'art contract'} is NOT ready.`);
  console.error(`- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else if (productionCheck) {
  console.log(`Scene element production art is ready (${definitions.length} transparent WebP assets).`);
} else {
  const finalCount = definitions.filter(([, definition]) => definition.production_status === 'final').length;
  console.log(`Scene element art contract is valid (${definitions.length} reusable slots, ${finalCount} final).`);
}
