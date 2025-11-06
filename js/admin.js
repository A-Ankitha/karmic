(function(){
  ensureMenus();
  ensureBookings();
  ensureReports();

  const dateInput = document.getElementById('menuDate');
  const menuDateLabel = document.getElementById('menuDateLabel');
  const menuDateLabel2 = document.getElementById('menuDateLabel2');
  const addItemBtn = document.getElementById('addItemBtn');
  const itemName = document.getElementById('itemName');
  const itemPrice = document.getElementById('itemPrice');
  const menuTableBody = document.querySelector('#menuTable tbody');
  const bookingTableBody = document.querySelector('#bookingTable tbody');
  const reportsList = document.getElementById('reportsList');
  const refreshBookings = document.getElementById('refreshBookings');
  const downloadCsv = document.getElementById('downloadCsv');
  const generateReportBtn = document.getElementById('generateReportBtn');

  const todayKey = formatDateKey();
  dateInput.value = todayKey;
  updateLabels();

  dateInput.addEventListener('change', () => {
    updateLabels();
    renderMenu();
    renderBookingSummary();
  });

  addItemBtn.addEventListener('click', addItem);
  refreshBookings.addEventListener('click', renderBookingSummary);
  downloadCsv.addEventListener('click', downloadBookingsCSV);
  generateReportBtn.addEventListener('click', () => generateConsolidatedReport(true));

  renderMenu();
  renderBookingSummary();
  renderReportsList();

  autoGenerateIfAfterDeadline();

  function getSelectedDateKey(){
    return dateInput.value || formatDateKey();
  }

  function updateLabels(){
    const key = getSelectedDateKey();
    menuDateLabel.textContent = key;
    menuDateLabel2.textContent = key;
  }

  function addItem(){
    const name = itemName.value.trim();
    const price = parseFloat(itemPrice.value);
    if(!name || Number.isNaN(price)) return alert('Enter item name & price');

    const menus = getStore('menus');
    const key = getSelectedDateKey();
    menus[key] = menus[key] || [];
    const id = nextIdForDate(menus[key]);

    menus[key].push({ id, name, price });
    saveStore('menus', menus);

    itemName.value = '';
    itemPrice.value = '';
    renderMenu();
  }

  function renderMenu(){
    const menus = getStore('menus');
    const key = getSelectedDateKey();
    const list = menus[key] || [];

    menuTableBody.innerHTML = '';
    list.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input data-id="${item.id}" class="edit-name" value="${item.name}"></td>
        <td><input data-id="${item.id}" class="edit-price" type="number" value="${item.price}"></td>
        <td>
          <button class="nav-btn" data-action="save" data-id="${item.id}">Save</button>
          <button class="nav-btn" data-action="delete" data-id="${item.id}">Delete</button>
        </td>
      `;
      menuTableBody.appendChild(row);
    });

    menuTableBody.querySelectorAll('button').forEach(btn =>
      btn.addEventListener('click', menuAction)
    );
  }

  function menuAction(e){
    const action = e.currentTarget.dataset.action;
    const id = Number(e.currentTarget.dataset.id);
    const key = getSelectedDateKey();
    const menus = getStore('menus');
    const list = menus[key] || [];

    if(action === 'delete'){
      const idx = list.findIndex(x => x.id === id);
      if(idx >= 0){
        list.splice(idx, 1);
        saveStore('menus', menus);
        renderMenu();
      }
      return;
    }

    if(action === 'save'){
      const nameInput = menuTableBody.querySelector(`.edit-name[data-id='${id}']`);
      const priceInput = menuTableBody.querySelector(`.edit-price[data-id='${id}']`);
      const name = nameInput.value.trim();
      const price = parseFloat(priceInput.value);

      if(!name || Number.isNaN(price)){
        alert('Enter valid name & price');
        return;
      }

      const item = list.find(x => x.id === id);
      if(item){
        item.name = name;
        item.price = price;
        saveStore('menus', menus);
        renderMenu();
      }
    }
  }

  function renderBookingSummary(){
    const b = getStore('bookings');
    const menus = getStore('menus');
    const key = getSelectedDateKey();
    const bookings = b[key] || [];
    const menuList = menus[key] || [];

    const counts = {};
    bookings.forEach(bk => {
      counts[bk.itemId] = (counts[bk.itemId] || 0) + 1;
    });

    bookingTableBody.innerHTML = '';
    menuList.forEach(item => {
      const qty = counts[item.id] || 0;
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.name}</td><td>${qty}</td>`;
      bookingTableBody.appendChild(row);
    });
  }

  function consolidateForDate(key){
    const b = getStore('bookings');
    const menus = getStore('menus');
    const bookings = b[key] || [];
    const menuList = menus[key] || [];

    const summary = menuList.map(it => ({
      id: it.id,
      name: it.name,
      price: it.price,
      qty: 0
    }));

    const map = Object.fromEntries(summary.map(s => [s.id, s]));
    bookings.forEach(bk => {
      if(map[bk.itemId]) map[bk.itemId].qty++;
    });

    return summary;
  }

  function generateConsolidatedReport(force){
    const now = new Date();
    const hour = now.getHours();
    const key = getSelectedDateKey();
    const reports = getStore('reports');

    if(reports[key] && !force){
      alert('Report already generated');
      return;
    }

    if(hour < 21 && !force){
      if(!confirm('It is before 9 PM. Generate now?')) return;
    }

    const summary = consolidateForDate(key);
    reports[key] = {
      generatedAt: now.toISOString(),
      summary
    };

    saveStore('reports', reports);
    renderReportsList();
    alert('Report generated for: ' + key);
  }

  function renderReportsList(){
    const reports = getStore('reports');
    reportsList.innerHTML = '';

    Object.keys(reports)
      .sort((a, b) => b.localeCompare(a))
      .forEach(key => {
        const li = document.createElement('li');
        const r = reports[key];
        li.innerHTML = `
          <strong>${key}</strong>
          (generated: ${new Date(r.generatedAt).toLocaleString()})
          - <button data-key="${key}" class="btn-outline">View CSV</button>
        `;
        reportsList.appendChild(li);
      });

    reportsList.querySelectorAll('button')
      .forEach(btn => btn.addEventListener('click', e =>
        downloadReportCSV(e.currentTarget.dataset.key)
      ));
  }

  function downloadBookingsCSV(){
    const key = getSelectedDateKey();
    const summary = consolidateForDate(key);
    const rows = ['Item,Price,Qty', ...summary.map(s => `"${s.name}",${s.price},${s.qty}`)];

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadReportCSV(key){
    const reports = getStore('reports');
    const r = reports[key];
    if(!r) return alert('No report');

    const rows = ['Item,Price,Qty', ...r.summary.map(s => `"${s.name}",${s.price},${s.qty}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function autoGenerateIfAfterDeadline(){
    const now = new Date();
    const hour = now.getHours();
    const key = formatDateKey();
    const reports = getStore('reports');

    if(hour >= 21 && !reports[key]){
      generateConsolidatedReport(true);
    }
  }
})();

function logout(){
  localStorage.removeItem('loggedIn');
  window.location.href = '../index.html';
}
