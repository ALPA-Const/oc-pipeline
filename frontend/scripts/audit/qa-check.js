#!/usr/bin/env node

/**
 * Data Quality Check Script
 * Runs nightly to detect anomalies and data quality issues
 * 
 * Schedule: 2 AM UTC daily (cron: 0 2 * * *)
 * Duration: ~3 minutes
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function logQACheck(checkName, checkType, severity, status, details, affectedRecords = 0) {
  const { error } = await supabase.rpc('log_qa_check', {
    p_check_name: checkName,
    p_check_type: checkType,
    p_severity: severity,
    p_status: status,
    p_details: details,
    p_affected_records: affectedRecords,
  });

  if (error) {
    console.error(`Failed to log QA check: ${error.message}`);
  }
}

async function checkVelocityNullWithSubmitted() {
  console.log('\n🔍 Check: Velocity NULL with Submitted > 0');

  const { data: submitted, error: submittedError } = await supabase
    .from('pipeline_projects')
    .select('id')
    .eq('pipeline_type', 'opportunity')
    .eq('stage_id', 'opp_negotiation')
    .not('submission_date', 'is', null);

  if (submittedError) throw submittedError;

  const { data: awarded, error: awardedError } = await supabase
    .from('pipeline_projects')
    .select('id')
    .eq('pipeline_type', 'opportunity')
    .eq('stage_id', 'opp_award')
    .not('submission_date', 'is', null)
    .not('award_date', 'is', null);

  if (awardedError) throw awardedError;

  const submittedCount = submitted.length;
  const velocitySamples = awarded.length;

  const status = velocitySamples >= 5 ? 'pass' : 'fail';
  const severity = velocitySamples === 0 && submittedCount > 0 ? 'critical' : 'warning';

  await logQACheck(
    'velocity_null_check',
    'anomaly',
    severity,
    status,
    { submitted_count: submittedCount, velocity_samples: velocitySamples },
    submittedCount
  );

  console.log(`${status === 'pass' ? '✅' : '❌'} Submitted: ${submittedCount}, Velocity samples: ${velocitySamples}`);
  return status === 'pass';
}

async function checkNegativeProjections() {
  console.log('\n🔍 Check: Negative Projections');

  // Fetch awarded YTD
  const { data: awarded, error: awardedError } = await supabase
    .from('pipeline_projects')
    .select('awarded_amount, value')
    .eq('pipeline_type', 'opportunity')
    .eq('stage_id', 'opp_award');

  if (awardedError) throw awardedError;

  const awardedYTD = awarded.reduce((sum, p) => sum + (p.awarded_amount || p.value || 0), 0);

  // Fetch monthly pace
  const last90Days = new Date();
  last90Days.setDate(last90Days.getDate() - 90);

  const { data: recent, error: recentError } = await supabase
    .from('pipeline_projects')
    .select('awarded_amount, value')
    .eq('pipeline_type', 'opportunity')
    .eq('stage_id', 'opp_award')
    .gte('award_date', last90Days.toISOString());

  if (recentError) throw recentError;

  const total90d = recent.reduce((sum, p) => sum + (p.awarded_amount || p.value || 0), 0);
  const monthlyPace = total90d / 3;

  const currentMonth = new Date().getMonth() + 1;
  const monthsRemaining = 12 - currentMonth;
  const projectedFYEnd = awardedYTD + (monthlyPace * monthsRemaining);

  const status = projectedFYEnd >= awardedYTD ? 'pass' : 'fail';
  const severity = projectedFYEnd < 0 ? 'critical' : 'warning';

  await logQACheck(
    'negative_projection_check',
    'anomaly',
    severity,
    status,
    { awarded_ytd: awardedYTD, monthly_pace: monthlyPace, projected_fy_end: projectedFYEnd }
  );

  console.log(`${status === 'pass' ? '✅' : '❌'} Projected FY End: $${(projectedFYEnd / 1000000).toFixed(1)}M`);
  return status === 'pass';
}

async function checkMapCountMismatch() {
  console.log('\n🔍 Check: Map Count Mismatch');

  // Total projects
  const { count: totalCount, error: totalError } = await supabase
    .from('pipeline_projects')
    .select('*', { count: 'exact', head: true })
    .eq('pipeline_type', 'opportunity');

  if (totalError) throw totalError;

  // Projects with coordinates
  const { count: mapCount, error: mapError } = await supabase
    .from('pipeline_projects')
    .select('*', { count: 'exact', head: true })
    .eq('pipeline_type', 'opportunity')
    .not('project_latitude', 'is', null)
    .not('project_longitude', 'is', null);

  if (mapError) throw mapError;

  const missingCoords = totalCount - mapCount;
  const status = missingCoords === 0 ? 'pass' : 'fail';
  const severity = missingCoords > totalCount * 0.2 ? 'critical' : 'warning';

  await logQACheck(
    'map_count_mismatch_check',
    'consistency',
    severity,
    status,
    { total_projects: totalCount, map_projects: mapCount, missing_coords: missingCoords },
    missingCoords
  );

  console.log(`${status === 'pass' ? '✅' : '❌'} Total: ${totalCount}, Map: ${mapCount}, Missing: ${missingCoords}`);
  return status === 'pass';
}

async function checkStaleData() {
  console.log('\n🔍 Check: Stale Data');

  const { data: lastUpdate, error } = await supabase
    .from('pipeline_projects')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;

  const lastUpdateTime = new Date(lastUpdate.updated_at);
  const now = new Date();
  const hoursSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);

  const status = hoursSinceUpdate < 24 ? 'pass' : 'fail';
  const severity = hoursSinceUpdate > 48 ? 'critical' : 'warning';

  await logQACheck(
    'stale_data_check',
    'validation',
    severity,
    status,
    { last_update: lastUpdate.updated_at, hours_since_update: hoursSinceUpdate }
  );

  console.log(`${status === 'pass' ? '✅' : '❌'} Last update: ${hoursSinceUpdate.toFixed(1)} hours ago`);
  return status === 'pass';
}

async function runQAChecks() {
  console.log('🔍 Starting Data Quality Checks...');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    critical: 0,
  };

  try {
    results.total++;
    if (await checkVelocityNullWithSubmitted()) results.passed++;
    else results.failed++;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    results.failed++;
    results.critical++;
  }

  try {
    results.total++;
    if (await checkNegativeProjections()) results.passed++;
    else results.failed++;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    results.failed++;
    results.critical++;
  }

  try {
    results.total++;
    if (await checkMapCountMismatch()) results.passed++;
    else results.failed++;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    results.failed++;
    results.critical++;
  }

  try {
    results.total++;
    if (await checkStaleData()) results.passed++;
    else results.failed++;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    results.failed++;
    results.critical++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🔍 QA Check Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`🚨 Critical: ${results.critical}`);

  // Send alert if critical issues
  if (results.critical > 0) {
    console.error('\n🚨 CRITICAL: Data quality issues detected!');
    // TODO: Send email/Slack alert
  }

  console.log('\n✅ QA checks complete');
  process.exit(results.critical > 0 ? 1 : 0);
}

// Run QA checks
runQAChecks().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});