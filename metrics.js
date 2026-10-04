"use strict";

const PlayMetrics = (() => {
  const STORAGE_KEY = "fd_play_history_v1";
  const LIMIT = 10;

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { no: [], normal: [], overboard: [] };
    } catch {
      return { no: [], normal: [], overboard: [] };
    }
  }

  function saveAll(history) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {}
  }

  function begin(condition) {
    return {
      condition,
      deaths: 0,
      levelReached: 1,
      time: 0,
      completed: false,
      saved: false,
      startedAt: performance.now(),
    };
  }

  function record(run) {
    if (!run || run.saved) return;
    const history = readAll();
    const records = history[run.condition] || [];
    records.unshift({
      deaths: run.deaths,
      levelReached: run.levelReached,
      time: run.time,
      completed: run.completed,
      at: Date.now(),
    });
    history[run.condition] = records.slice(0, LIMIT);
    saveAll(history);
    run.saved = true;
  }

  function list(condition) {
    return readAll()[condition] || [];
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  return { begin, record, list, formatTime, LIMIT };
})();
