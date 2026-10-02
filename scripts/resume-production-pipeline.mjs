#!/usr/bin/env node
/**
 * resume-production-pipeline.mjs
 * 
 * 비정상 종료 또는 세션 재시작 시 파이프라인 진행 상태를 복구하고
 * 미완료된 단계부터 자동으로 이어서 실행하는 복구 장치.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CHECKPOINT_PATH = path.resolve(__dirname, 'pipeline-checkpoint.json');
const TARGET_DIR = path.resolve(ROOT_DIR, 'public', 'assets', 'episode01', 'scene-elements');

function readCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_PATH)) {
    console.error('❌ 체크포인트 파일이 없습니다:', CHECKPOINT_PATH);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf-8'));
}

function writeCheckpoint(checkpoint) {
  checkpoint.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2), 'utf-8');
}

export function runPipelineAudit() {
  console.log('======================================================');
  console.log('🔄 PSI-ZERO-DAY 생산 파이프라인 상태 복구 및 검증');
  console.log('======================================================\n');

  const cp = readCheckpoint();
  console.log(`📌 현재 진행 단계: ${cp.currentStep}`);
  console.log(`⏱️ 마지막 갱신 일시: ${cp.lastUpdated}\n`);

  // 1. Step 1 (배치 3 에셋 상태 검증)
  const step1 = cp.steps.step1_scene_elements_batch3;
  console.log(`[Step 1] ${step1.description}`);
  let pendingCount = 0;
  let readyCount = 0;

  for (const [id, info] of Object.entries(step1.items)) {
    const targetWebp = path.join(TARGET_DIR, `${id.replace(/_/g, '-')}.webp`);
    if (fs.existsSync(targetWebp)) {
      const stat = fs.statSync(targetWebp);
      if (stat.size > 1000) {
        info.status = 'ready';
        readyCount += 1;
        console.log(`  ✅ ${id} (${info.name}): WebP 준비 완료 (${stat.size.toLocaleString()} bytes)`);
        continue;
      }
    }
    info.status = 'pending';
    pendingCount += 1;
    console.log(`  ⏳ ${id} (${info.name}): 대기 중`);
  }

  if (readyCount === Object.keys(step1.items).length) {
    step1.status = 'completed';
    console.log('\n✨ Step 1 모든 에셋 완료!\n');
    if (cp.currentStep === 'step1_scene_elements_batch3') {
      cp.currentStep = 'step2_board_environmental_interaction';
    }
  } else {
    step1.status = 'in_progress';
    console.log(`\n진행률: ${readyCount} / ${Object.keys(step1.items).length} 완료 (${pendingCount}개 대기)\n`);
  }

  // 2. Step 2 (환경 상호작용 검증)
  const step2 = cp.steps.step2_board_environmental_interaction;
  console.log(`[Step 2] ${step2.description}`);
  console.log(`  상태: ${step2.status}`);

  // 3. Step 3 (아차사고 연출 검증)
  const step3 = cp.steps.step3_near_miss_feedback_and_audio;
  console.log(`[Step 3] ${step3.description}`);
  console.log(`  상태: ${step3.status}`);

  writeCheckpoint(cp);
  console.log('\n💾 체크포인트가 최신 상태로 저장되었습니다.');
  return cp;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPipelineAudit();
}
