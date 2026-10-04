/**
 * Supabase repository for public.members (Plan 2 write API).
 * All functions throw real Error objects with status 500; 404 is decided by the service.
 */
const { supabase } = require("../client");
const { MEMBERS_TABLE } = require("../../config/env");

function dbError(error) {
  const err = new Error(error && error.message ? error.message : "members db error");
  err.status = 500;
  return err;
}

function requireDb() {
  if (!supabase) {
    const err = new Error("Database not configured");
    err.status = 500;
    throw err;
  }
}

/** @returns {Promise<object|null>} row or null */
async function getById(id) {
  requireDb();
  const { data, error } = await supabase.from(MEMBERS_TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw dbError(error);
  return data;
}

/** @returns {Promise<object>} inserted row */
async function insert(row) {
  requireDb();
  const { data, error } = await supabase.from(MEMBERS_TABLE).insert(row).select("*").single();
  if (error) throw dbError(error);
  return data;
}

/** @returns {Promise<object|null>} updated row or null when id does not exist */
async function update(id, patch) {
  requireDb();
  const { data, error } = await supabase.from(MEMBERS_TABLE).update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw dbError(error);
  return data;
}

/** @returns {Promise<Array<object>>} list of members */
async function list({ panel, year, limit } = {}) {
  requireDb();
  let query = supabase.from(MEMBERS_TABLE).select("*");
  if (panel) query = query.eq("panel", panel);
  if (year) query = query.eq("year", parseInt(year, 10));

  if (panel === "alumni") {
    query = query.order("year", { ascending: false }).order("sort_order", { ascending: true });
  } else {
    query = query.order("sort_order", { ascending: true });
  }

  if (limit && Number.isInteger(Number(limit)) && Number(limit) > 0) {
    query = query.limit(Number(limit));
  }

  const { data, error } = await query;
  if (error) throw dbError(error);
  return data || [];
}

/** Deletes row; existence must be checked by the caller first. */
async function remove(id) {
  requireDb();
  const { error } = await supabase.from(MEMBERS_TABLE).delete().eq("id", id);
  if (error) throw dbError(error);
  return true;
}

module.exports = { getById, list, insert, update, remove };
