/* employee-module.js
 - dependencies: js/utils.js from earlier
 - stores used:
    menus -> { 'YYYY-MM-DD': [ { id, name, price, mealType } ] }
    bookings -> { 'YYYY-MM-DD': [ { email, itemId } ] }   // existing
    confirmations -> { 'YYYY-MM-DD': { [email]: { selections: [itemId], optedOut: bool, updatedAt } } }
*/

(function(){
  // DOM refs
  const targetDateLabel = document.getElementById('targetDateLabel');
  const menuSections = document.getElementById('menuSections');
  const saveBtn = document.getElementById('saveSelection');
  const optOutBtn = document.getElementById('optOutBtn');
  const cancelBtn = document.getElementById('cancelSelection');
  const currentChoice = document.getElementById('currentChoice');
  const historyList = document.getElementById('historyList');
  const deadlineMsg = document.getElementById('deadlineMsg');
  const notifyReqBtn = document.getElementById('notifyReqBtn');

  // target = TOMORROW (employees confirm for next day)
  function getTargetDateKey(){
    const d = new Date();
    d.setDate(d.getDate() + 1); // next day
    return formatDateKey(d);
  }

  // deadline: 21:00 of TODAY (i.e., cutoff for confirming next day's meals)
  function getDeadlineForTarget(){
    // deadline is 21:00 local today (effectively lock for tomorrow's meals)
    const deadline = new Date();
    deadline.setHours(21,0,0,0);
    return deadline;
  }

  function isLocked(){
    const now = new Date();
    return now >= getDeadlineForTarget();
  }

  // Get logged in user (uses your existing loggedIn localStorage)
  function getLoggedInUser(){
    try {
      return JSON.parse(localStorage.getItem('loggedIn') || 'null');
    } catch (e) { return null; }
  }

  // storage helpers for confirmations
  function getConfirmations(){
    return getStore('confirmations'); // returns object or {}
  }
  function saveConfirmations(c){ saveStore('confirmations', c); }

  // UI initialization
  document.addEventListener('DOMContentLoaded', init);
  notifyReqBtn && notifyReqBtn.addEventListener('click', requestNotificationPermission);
  saveBtn && saveBtn.addEventListener('click', onSaveSelection);
  optOutBtn && optOutBtn.addEventListener('click', onOptOut);
  cancelBtn && cancelBtn.addEventListener('click', onCancelSelection);

  function init(){
    // ensure stores exist
    ensureMenus(); ensureBookings();
    ensureReports(); // not strictly needed, safe
    // render
    renderPage();
    scheduleRemindersIfNeeded();
    // register service worker for nicer notifications (optional)
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js').catch(()=>{/* ignore for dev */});
    }
  }

  function renderPage(){
    const key = getTargetDateKey();
    targetDateLabel.textContent = key;
    deadlineMsg.textContent = isLocked()
      ? '⚠️ Confirmations are locked (after 9:00 PM). You cannot change selections.'
      : 'Deadline to confirm or modify: Today at 9:00 PM. You can modify until then.';

    renderMenuForTarget();
    renderMyConfirmation();
    renderHistory();
  }

  function renderMenuForTarget(){
    const key = getTargetDateKey();
    const menus = getStore('menus');
    const list = (menus[key] || []).slice(); // array of items
    // allow legacy items w/out mealType; default to 'Lunch'
    list.forEach(i => { if(!i.mealType) i.mealType = 'Lunch'; });

    // group by mealType
    const groups = {};
    ['Breakfast','Lunch','Snacks'].forEach(m => groups[m] = []);
    list.forEach(it => {
      const type = it.mealType || 'Lunch';
      if(!groups[type]) groups[type] = [];
      groups[type].push(it);
    });

    menuSections.innerHTML = '';
    Object.keys(groups).forEach(mealType => {
      const items = groups[mealType];
      const section = document.createElement('section');
      section.innerHTML = `<h4>${mealType}</h4>`;
      const div = document.createElement('div');
      div.style.marginBottom = '8px';
      if(items.length === 0){
        div.innerHTML = `<div class="small-text">No items for ${mealType}</div>`;
      } else {
        items.forEach(it => {
          const id = `chk-${mealType}-${it.id}`;
          const wrapper = document.createElement('div');
          wrapper.innerHTML = `
            <label style="display:flex;align-items:center;gap:10px;margin:6px 0">
              <input type="checkbox" data-itemid="${it.id}" data-mealtype="${mealType}" id="${id}">
              <span>${it.name} — ₹${it.price}</span>
            </label>
          `;
          div.appendChild(wrapper);
        });
      }
      section.appendChild(div);
      menuSections.appendChild(section);
    });

    // if user already has selections, mark checkboxes
    markSelectionsOnUI();
  }

  function getMyConfirmationForKey(key, email){
    const c = getConfirmations();
    return (c[key] && c[key][email]) || null;
  }

  function markSelectionsOnUI(){
    const logged = getLoggedInUser();
    if(!logged) return;
    const key = getTargetDateKey();
    const my = getMyConfirmationForKey(key, logged.email);
    // first clear all
    menuSections.querySelectorAll('input[type="checkbox"]').forEach(ch => ch.checked = false);
    if(my){
      if(my.optedOut){
        // nothing to mark
      } else if(Array.isArray(my.selections)){
        my.selections.forEach(id => {
          const cb = menuSections.querySelector(`input[data-itemid="${id}"]`);
          if(cb) cb.checked = true;
        });
      }
    }
  }

  function collectSelectedItemIds(){
    const arr = [];
    menuSections.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if(cb.checked) arr.push(Number(cb.dataset.itemid));
    });
    return arr;
  }

  function onSaveSelection(){
    if(isLocked()){
      alert('⚠️ Confirmations are locked (after 9 PM). You cannot change selections.');
      return;
    }
    const logged = getLoggedInUser();
    if(!logged){
      alert('Please login first.');
      return;
    }
    const key = getTargetDateKey();
    const selections = collectSelectedItemIds();
    if(selections.length === 0){
      if(!confirm('You selected no items. Do you want to opt out instead?')) return;
    }

    // save
    const c = getConfirmations();
    c[key] = c[key] || {};
    c[key][logged.email] = { selections, optedOut: false, updatedAt: new Date().toISOString() };
    saveConfirmations(c);

    // optionally add to bookings (bookings used by admin reports)
    addBookingsForSelections(key, logged.email, selections);

    alert('✅ Your selection has been saved.');
    renderMyConfirmation();
  }

  function onOptOut(){
    if(isLocked()){
      alert('⚠️ Lock reached — cannot opt out now.');
      return;
    }
    const logged = getLoggedInUser();
    if(!logged) { alert('Please login.'); return; }
    const key = getTargetDateKey();
    const c = getConfirmations();
    c[key] = c[key] || {};
    c[key][logged.email] = { selections: [], optedOut: true, updatedAt: new Date().toISOString() };
    saveConfirmations(c);
    // also remove any bookings for this user for the date
    removeBookingsForUser(key, logged.email);

    alert('You have opted out for next day.');
    renderMyConfirmation();
  }

  function onCancelSelection(){
    if(isLocked()){
      alert('Cannot cancel after 9 PM.');
      return;
    }
    const logged = getLoggedInUser();
    if(!logged){ alert('Please login.'); return; }
    const key = getTargetDateKey();
    const c = getConfirmations();
    if(c[key] && c[key][logged.email]) delete c[key][logged.email];
    saveConfirmations(c);
    // remove bookings for this user as well
    removeBookingsForUser(key, logged.email);

    alert('Your selection has been cleared.');
    renderMyConfirmation();
  }

  // bookings helpers — we keep bookings store in sync for admin reports
  function addBookingsForSelections(key, email, selections){
    // bookings store layout: { 'YYYY-MM-DD': [ { email, itemId } ] }
    const all = getStore('bookings');
    all[key] = all[key] || [];
    // remove any existing bookings from this email first
    all[key] = all[key].filter(b => b.email !== email);
    // add new bookings
    selections.forEach(itemId => all[key].push({ email, itemId }));
    saveStore('bookings', all);
  }

  function removeBookingsForUser(key, email){
    const all = getStore('bookings');
    all[key] = (all[key] || []).filter(b => b.email !== email);
    saveStore('bookings', all);
  }

  function renderMyConfirmation(){
    const logged = getLoggedInUser();
    if(!logged){
      currentChoice.innerHTML = '<div class="small-text">You are not logged in.</div>';
      return;
    }
    const key = getTargetDateKey();
    const my = getMyConfirmationForKey(key, logged.email);
    if(!my){
      currentChoice.innerHTML = '<div class="small-text">No selection yet. Please confirm before 9:00 PM today.</div>';
      return;
    }
    if(my.optedOut){
      currentChoice.innerHTML = `<div>Opted out — updated at ${new Date(my.updatedAt).toLocaleString()}</div>`;
      return;
    }
    if((my.selections || []).length === 0){
      currentChoice.innerHTML = `<div class="small-text">No items selected.</div>`;
      return;
    }
    // show names
    const menus = getStore('menus');
    const menuList = menus[key] || [];
    const names = my.selections.map(id => {
      const it = menuList.find(m => m.id === id);
      return it ? `${it.name} (₹${it.price})` : `Unknown(${id})`;
    });
    currentChoice.innerHTML = `<ul>${names.map(n => `<li>${n}</li>`).join('')}</ul><div class="small-text">Updated: ${new Date(my.updatedAt).toLocaleString()}</div>`;
    // ensure UI checkboxes reflect selection
    markSelectionsOnUI();
  }

  // small history view (shows if user confirmed previously for past days)
  function renderHistory(){
    const logged = getLoggedInUser();
    if(!logged){ historyList.innerHTML = ''; return; }
    const conf = getConfirmations();
    // show last 7 days of records (including target)
    const dates = [];
    const base = new Date();
    for(let i=0;i<7;i++){
      const d = new Date();
      d.setDate(base.getDate() - i);
      dates.push(formatDateKey(d));
    }
    historyList.innerHTML = '';
    dates.forEach(k => {
      const rec = conf[k] && conf[k][logged.email];
      if(rec){
        const el = document.createElement('div');
        if(rec.optedOut) el.innerHTML = `<strong>${k}</strong>: Opted out (updated ${new Date(rec.updatedAt).toLocaleString()})`;
        else el.innerHTML = `<strong>${k}</strong>: ${rec.selections.length} item(s) — updated ${new Date(rec.updatedAt).toLocaleString()}`;
        historyList.appendChild(el);
      }
    });
  }

  // Reminders (in-page + Notifications API)
  function scheduleRemindersIfNeeded(){
    // schedule two reminders (e.g., 20:00 and 20:50 of TODAY)
    const now = new Date();
    const remTimes = [20, 20.8333]; // 20:00 and 20:50 (20.8333 hr)
    remTimes.forEach(hourFloat => {
      const hr = Math.floor(hourFloat);
      const min = Math.round((hourFloat - hr) * 60);
      const reminder = new Date();
      reminder.setHours(hr, min, 0, 0);
      // if reminder in past, skip
      if(reminder <= now) return;
      const timeout = reminder.getTime() - now.getTime();
      setTimeout(() => {
        showReminderNotification();
      }, timeout);
    });
  }

  function showReminderNotification(){
    // in-page toast
    alert('Reminder: Please confirm your meals for tomorrow before 9:00 PM.');

    // notifications API
    if('Notification' in window && Notification.permission === 'granted'){
      if(navigator.serviceWorker && navigator.serviceWorker.controller){
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification('Canteen Reminder', {
            body: 'Please confirm your meals for tomorrow before 9:00 PM.',
            icon: '/icons/meal.png',
            tag: 'canteen-deadline'
          });
        });
      } else {
        // fallback without worker
        new Notification('Canteen Reminder', { body: 'Please confirm your meals for tomorrow before 9:00 PM.' });
      }
    } else {
      // optionally prompt
      // nothing
    }
  }

  function requestNotificationPermission(){
    if(!('Notification' in window)){
      alert('This browser does not support notifications.');
      return;
    }
    Notification.requestPermission().then(perm => {
      if(perm === 'granted') alert('Notifications enabled. You will get reminders while this site is open.');
      else alert('Notifications denied. You can still confirm in the UI.');
    });
  }

  // Logout function used in other files
  window.logout = function(){
    localStorage.removeItem('loggedIn');
    window.location.href = '/index.html';
  };

})();
