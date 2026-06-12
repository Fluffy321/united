#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const REQUIRED_ENV = [
  'TEST_A_EMAIL',
  'TEST_A_PASSWORD',
  'TEST_B_EMAIL',
  'TEST_B_PASSWORD',
];

function loadDotEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  const contents = readFileSync(envPath, 'utf8');

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

function assertEnv() {
  const missing = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    ...REQUIRED_ENV,
  ].filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
}

function createAnonClient(label) {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-junited-rls-check': label,
      },
    },
  });
}

async function signIn(client, label, email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${label} sign-in failed: ${error.message}`);
  if (!data.user?.id) throw new Error(`${label} sign-in did not return a user id`);
  return data.user;
}

function zeroRows(result, label) {
  if (result.error) {
    return {
      ok: false,
      count: null,
      detail: `${label} query errored: ${result.error.message}`,
    };
  }
  const count = result.data?.length || 0;
  return {
    ok: count === 0,
    count,
    detail: `${label}: ${count} row(s) visible`,
  };
}

function printCheck(ok, label, detail = '') {
  const prefix = ok ? 'PASS' : 'FAIL';
  console.log(`${prefix}: ${label}${detail ? ` - ${detail}` : ''}`);
}

loadDotEnvLocal();
assertEnv();

const marker = `rls-client-check-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const clientA = createAnonClient('client-a');
const clientB = createAnonClient('client-b');

let userA;
let userB;
let conversationId;
let messageId;
let failed = false;

try {
  console.log('JUnited client-side RLS security check');
  console.log(`Project: ${process.env.VITE_SUPABASE_URL}`);
  console.log(`Marker: ${marker}`);
  console.log('');

  userA = await signIn(clientA, 'A', process.env.TEST_A_EMAIL, process.env.TEST_A_PASSWORD);
  userB = await signIn(clientB, 'B', process.env.TEST_B_EMAIL, process.env.TEST_B_PASSWORD);

  console.log(`Signed in A: ${userA.id}`);
  console.log(`Signed in B: ${userB.id}`);
  console.log('');

  const { data: conversation, error: conversationError } = await clientA
    .from('conversations')
    .insert({
      participant_ids: [userA.id],
      participant_names: ['RLS Test A'],
      last_message: marker,
      request_type: 'rls_security_check',
    })
    .select('id, participant_ids')
    .single();

  if (conversationError) throw new Error(`A could not create test conversation: ${conversationError.message}`);
  conversationId = conversation.id;
  printCheck(true, 'A created private conversation', conversationId);

  const { data: message, error: messageError } = await clientA
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userA.id,
      sender_name: 'RLS Test A',
      recipient_id: userA.id,
      content: `Private RLS marker ${marker}`,
    })
    .select('id, conversation_id, content')
    .single();

  if (messageError) throw new Error(`A could not create test message: ${messageError.message}`);
  messageId = message.id;
  printCheck(true, 'A created private message', messageId);
  console.log('');

  const bConversationList = await clientB
    .from('conversations')
    .select('id, last_message, participant_ids')
    .eq('last_message', marker);
  const bConversationById = await clientB
    .from('conversations')
    .select('id, last_message, participant_ids')
    .eq('id', conversationId);
  const bMessageList = await clientB
    .from('messages')
    .select('id, conversation_id, content')
    .eq('content', `Private RLS marker ${marker}`);
  const bMessageById = await clientB
    .from('messages')
    .select('id, conversation_id, content')
    .eq('id', messageId);

  const leakChecks = [
    zeroRows(bConversationList, 'B list query for A conversation marker'),
    zeroRows(bConversationById, 'B direct query for A conversation id'),
    zeroRows(bMessageList, 'B list query for A message marker'),
    zeroRows(bMessageById, 'B direct query for A message id'),
  ];

  const dmLeak = leakChecks.some((check) => !check.ok);
  for (const check of leakChecks) printCheck(check.ok, check.detail);
  if (dmLeak) {
    failed = true;
    console.log('FAIL: DM leak');
  } else {
    printCheck(true, 'No DM leak detected');
  }
  console.log('');

  const { data: profiles, error: profilesError } = await clientB
    .from('profiles')
    .select('*')
    .neq('id', userB.id)
    .limit(25);

  if (profilesError) {
    failed = true;
    printCheck(false, 'Profile sensitive-column check', profilesError.message);
  } else {
    const exposed = (profiles || []).filter((profile) =>
      Boolean(profile.email || profile.phone)
    );
    if (exposed.length > 0) {
      failed = true;
      printCheck(
        false,
        'Profile sensitive-column check',
        `${exposed.length} other profile row(s) expose email/phone`
      );
    } else {
      printCheck(
        true,
        'Profile sensitive-column check',
        `${profiles?.length || 0} other profile row(s) checked; no email/phone values exposed`
      );
    }
  }
  console.log('');

  const { data: beforeProfile, error: beforeProfileError } = await clientB
    .from('profiles')
    .select('id, role')
    .eq('id', userB.id)
    .single();
  if (beforeProfileError) throw new Error(`Could not read B profile before role test: ${beforeProfileError.message}`);

  const beforeRole = beforeProfile.role;
  const { error: roleUpdateError } = await clientB
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userB.id);

  const { data: afterProfile, error: afterProfileError } = await clientB
    .from('profiles')
    .select('id, role')
    .eq('id', userB.id)
    .single();
  if (afterProfileError) throw new Error(`Could not read B profile after role test: ${afterProfileError.message}`);

  const roleEscalated = beforeRole !== 'admin' && afterProfile.role === 'admin';
  if (roleEscalated) {
    failed = true;
    console.log('FAIL: role escalation');
  } else {
    printCheck(
      true,
      'Role escalation blocked',
      roleUpdateError
        ? `update rejected: ${roleUpdateError.message}; role stayed "${afterProfile.role}"`
        : `update returned without error; role is "${afterProfile.role}" (before "${beforeRole}")`
    );
  }
  console.log('');

  const { data: aMessageControl, error: aMessageControlError } = await clientA
    .from('messages')
    .select('id, content')
    .eq('id', messageId)
    .single();

  if (aMessageControlError || !aMessageControl) {
    failed = true;
    printCheck(false, 'A can read own private message', aMessageControlError?.message || 'no row returned');
  } else {
    printCheck(true, 'A can read own private message', aMessageControl.id);
  }
} catch (error) {
  failed = true;
  console.error(`FAIL: ${error.message}`);
} finally {
  console.log('');
  console.log('Cleanup');
  if (messageId) {
    const { error } = await clientA.from('messages').delete().eq('id', messageId);
    printCheck(!error, 'Deleted test message', error?.message || messageId);
    if (error) failed = true;
  }
  if (conversationId) {
    const { error } = await clientA.from('conversations').delete().eq('id', conversationId);
    printCheck(!error, 'Deleted test conversation', error?.message || conversationId);
    if (error) failed = true;
  }
  await Promise.allSettled([clientA.auth.signOut(), clientB.auth.signOut()]);

  console.log('');
  console.log(`SUMMARY: ${failed ? 'FAIL' : 'PASS'}`);
  process.exitCode = failed ? 1 : 0;
}
