// Utilities for date keys + storage helpers
function formatDateKey(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD
}

function getStore(key){
  return JSON.parse(localStorage.getItem(key) || 'null') || {};
}

function saveStore(key, data){
  localStorage.setItem(key, JSON.stringify(data));
}

// Data stores in localStorage:
// menus -> { 'YYYY-MM-DD': [ { id, name, price } ] }
// bookings -> { 'YYYY-MM-DD': [ { email, itemId } ] }
// reports -> { 'YYYY-MM-DD': { generatedAt, summary: [...] } }

function ensureMenus() {
  const m = getStore('menus');
  if(!m) saveStore('menus', {});
}

function ensureBookings(){
  const b = getStore('bookings');
  if(!b) saveStore('bookings', {});
}

function ensureReports(){
  const r = getStore('reports');
  if(!r) saveStore('reports', {});
}

function nextIdForDate(list){
  return list.length ? (Math.max(...list.map(i => i.id)) + 1) : 1;
}
