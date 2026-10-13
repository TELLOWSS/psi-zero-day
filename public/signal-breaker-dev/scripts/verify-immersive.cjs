/* Backward-compatible entry point for the current manual mastery verification. */
process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT ||= '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
process.env.SIGNAL_BREAKER_QA_OUTPUT ||= require('node:path').resolve(__dirname,'../../../docs/qa/signal-breaker-immersive-20261010');
require('./verify-benchmark.cjs');
