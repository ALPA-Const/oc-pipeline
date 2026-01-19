#!/usr/bin/env node

/**
 * KPI Audit Script
 * Runs nightly to capture KPI snapshots for historical tracking
 * 
 * Schedule: 2 AM UTC daily (cron: 0 2 * * *)
 * Duration: ~5 minutes
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const METRICS = [
  'awarded_ytd',
  'pipeline_value',
  'monthly_award_pace',
  'projected_fy_end',
  'projects_needed',
  'win_rate',
  'avg_pipeline_velocity',
  'capacity_if_all_bids_win',
];

async function auditKPIs() {
  console.log('📊 Starting KPI audit...');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const metric of METRICS) {
    try {
      console.log(`\n🔍 Auditing: ${metric}`);

      // Call metrics API endpoint
      const response = await fetch(`${supabaseUrl}/functions/v1/metrics/${metric}`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Log to audit table
      const { error } = await supabase.rpc('log_kpi_calculation', {
        p_metric_name: data.metric,
        p_metric_value: data.value,
        p_window_type: data.window,
        p_params: data.params,
        p_filters: data.params.filters || null,
        p_source: data.source,
        p_samples: data.samples || null,
        p_reason: data.reason || null,
      });

      if (error) throw error;

      console.log(`✅ ${metric}: ${data.value} (${data.samples || 0} samples)`);
      results.success++;

    } catch (error) {
      console.error(`❌ ${metric}: ${error.message}`);
      results.failed++;
      results.errors.push({ metric, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Audit Summary');
  console.log('='.repeat(50));
  console.log(`✅ Success: ${results.success}/${METRICS.length}`);
  console.log(`❌ Failed: ${results.failed}/${METRICS.length}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(({ metric, error }) => {
      console.log(`  - ${metric}: ${error}`);
    });
  }

  // Send alert if critical failures
  if (results.failed > METRICS.length / 2) {
    console.error('\n🚨 CRITICAL: More than 50% of metrics failed!');
    // TODO: Send email/Slack alert
  }

  console.log('\n✅ Audit complete');
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run audit
auditKPIs().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});