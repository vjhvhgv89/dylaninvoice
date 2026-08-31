const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format YYYY-MM-DD to "September 1, 2026"
 */
function formatDateReadable(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 0 || month > 11) return dateStr;
  return `${MONTH_NAMES[month]} ${day}, ${year}`;
}

/**
 * Format from & to dates to "August 17 - August 30, 2026"
 */
function formatWorkPeriod(fromStr, toStr) {
  if (!fromStr && !toStr) return '';
  if (fromStr && !toStr) return formatDateReadable(fromStr);
  if (!fromStr && toStr) return formatDateReadable(toStr);

  const pFrom = fromStr.split('-');
  const pTo = toStr.split('-');
  if (pFrom.length === 3 && pTo.length === 3) {
    const y1 = parseInt(pFrom[0], 10), m1 = parseInt(pFrom[1], 10) - 1, d1 = parseInt(pFrom[2], 10);
    const y2 = parseInt(pTo[0], 10), m2 = parseInt(pTo[1], 10) - 1, d2 = parseInt(pTo[2], 10);
    
    if (!isNaN(y1) && !isNaN(m1) && !isNaN(d1) && !isNaN(y2) && !isNaN(m2) && !isNaN(d2)) {
      if (y1 === y2) {
        if (m1 === m2) {
          return `${MONTH_NAMES[m1]} ${d1} - ${MONTH_NAMES[m2]} ${d2}, ${y1}`;
        } else {
          return `${MONTH_NAMES[m1]} ${d1} - ${MONTH_NAMES[m2]} ${d2}, ${y1}`;
        }
      } else {
        return `${MONTH_NAMES[m1]} ${d1}, ${y1} - ${MONTH_NAMES[m2]} ${d2}, ${y2}`;
      }
    }
  }
  return `${fromStr} - ${toStr}`;
}

// Default state keeping only client name and phone number as specified
const defaultInvoiceData = {
  invoiceNum: '',
  submittedOnDate: '',
  submittedOn: '',
  workFromDate: '',
  workToDate: '',
  workPerformed: '',
  invoiceFor: 'DJSW Enterprises LLC',
  phoneOrId: '5616089563',
  payableTo: '',
  paymentMethod: '',
  role: '',
  items: [
    {
      id: 1,
      task: '',
      hours: 0,
      rate: 0
    }
  ]
};

// Application State
let invoiceData = loadInitialData();
let zoomLevel = 100;
let selectedCellInfo = { address: 'B9', value: 'DJSW Enterprises LLC' };
let autoSaveTimeout = null;

/**
 * Initialize Data from LocalStorage or Defaults
 */
function loadInitialData() {
  const saved = localStorage.getItem('dylan_invoice_data_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          ...defaultInvoiceData,
          ...parsed,
          items: Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : defaultInvoiceData.items
        };
      }
    } catch (e) {
      console.error('Failed to parse saved invoice data', e);
    }
  }
  return JSON.parse(JSON.stringify(defaultInvoiceData));
}

/**
 * Auto-Save State to Browser LocalStorage
 */
function saveToLocalStorage(immediate = false) {
  const statusBadge = document.getElementById('autosave-status');
  const statusText = document.getElementById('autosave-text');

  if (statusBadge && statusText) {
    statusBadge.className = 'autosave-indicator saving';
    statusBadge.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> <span>Saving...</span>';
  }

  const performSave = () => {
    try {
      localStorage.setItem('dylan_invoice_data_v2', JSON.stringify(invoiceData));
      if (statusBadge && statusText) {
        statusBadge.className = 'autosave-indicator';
        statusBadge.innerHTML = '<i class="fa-solid fa-cloud-check"></i> <span>Auto-saved</span>';
      }
    } catch (e) {
      console.error('Failed to auto-save to localStorage', e);
    }
  };

  if (immediate) {
    performSave();
  } else {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(performSave, 300);
  }
}

/**
 * Populate Form Fields from invoiceData
 */
function populateForm() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('input-invoice-num', invoiceData.invoiceNum);
  setVal('input-submitted-on-date', invoiceData.submittedOnDate);
  setVal('input-work-from', invoiceData.workFromDate);
  setVal('input-work-to', invoiceData.workToDate);
  setVal('input-invoice-for', invoiceData.invoiceFor);
  setVal('input-phone-id', invoiceData.phoneOrId);
  setVal('input-payable-to', invoiceData.payableTo);
  setVal('input-payment-method', invoiceData.paymentMethod);
  setVal('input-role', invoiceData.role);

  renderItemRows();
  updateSummary();
}

/**
 * Format Currency Helper
 */
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format Number Helper
 */
function formatNumber(num) {
  const val = parseFloat(num) || 0;
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Calculate Invoice Totals
 */
function calculateTotals() {
  let totalHours = 0;
  let subtotal = 0;

  invoiceData.items.forEach(item => {
    const hours = parseFloat(item.hours) || 0;
    const rate = parseFloat(item.rate) || 0;
    const total = hours * rate;
    totalHours += hours;
    subtotal += total;
  });

  return {
    totalHours,
    subtotal,
    grandTotal: subtotal
  };
}

/**
 * Populate Form Controls from State
 */
function populateForm() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('input-invoice-num', invoiceData.invoiceNum);
  setVal('input-submitted-on-date', invoiceData.submittedOnDate);
  setVal('input-work-from', invoiceData.workFromDate);
  setVal('input-work-to', invoiceData.workToDate);
  setVal('input-invoice-for', invoiceData.invoiceFor);
  setVal('input-phone-id', invoiceData.phoneOrId);
  setVal('input-payable-to', invoiceData.payableTo);
  setVal('input-payment-method', invoiceData.paymentMethod);
  setVal('input-role', invoiceData.role);

  renderItemRows();
  updateSummary();
}

/**
 * Parse a user input string into decimal hours
 * Supports:
 * - "20.1" / "20.10" -> 20 hrs 10 mins = 20.17 hrs (or 20.16667)
 * - "20.51" -> 20 hrs 51 mins = 20.85 hrs
 * - "25.36" -> 25 hrs 36 mins = 25.60 hrs
 * - "20.57" -> 20 hrs 57 mins = 20.95 hrs
 * - "20:10" / "20:51" / "25:36" (HH:MM format)
 * - "20h 10m" / "20h 51m" (letter format)
 * - "29.75" -> 29.75 hrs (already decimal format when minutes >= 60)
 */
function parseTimeStringToDecimal(str) {
  if (str === '' || str === undefined || str === null) return 0;
  if (typeof str === 'number') return str;

  const trimmed = str.toString().trim();
  if (!trimmed) return 0;

  // Format: "HH:MM" or "HH:MM:SS"
  if (/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.test(trimmed)) {
    const match = trimmed.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
    const h = parseInt(match[1], 10) || 0;
    const m = parseInt(match[2], 10) || 0;
    const s = match[3] ? parseInt(match[3], 10) : 0;
    const totalHours = h + (m / 60) + (s / 3600);
    return +(totalHours.toFixed(2));
  }

  // Format with letters: e.g. "20h 10m", "20h 51m", "25h 36m", "10m", "1d 2h 30m"
  let totalHours = 0;
  let hasMatch = false;

  const dayMatch = trimmed.match(/(\d+)\s*d(?:ays?)?/i);
  if (dayMatch) {
    totalHours += parseInt(dayMatch[1], 10) * 24;
    hasMatch = true;
  }

  const hourMatch = trimmed.match(/(\d+)\s*h(?:ours?|rs?)?/i);
  if (hourMatch) {
    totalHours += parseInt(hourMatch[1], 10);
    hasMatch = true;
  }

  const minMatch = trimmed.match(/(\d+)\s*m(?:in(?:ute)?s?)?/i);
  if (minMatch) {
    totalHours += parseInt(minMatch[1], 10) / 60;
    hasMatch = true;
  }

  const secMatch = trimmed.match(/(\d+)\s*s(?:ec(?:ond)?s?)?/i);
  if (secMatch) {
    totalHours += parseInt(secMatch[1], 10) / 3600;
    hasMatch = true;
  }

  if (hasMatch) {
    return +(totalHours.toFixed(2));
  }

  // Format: "HH.MM" or "HH.M" (e.g. 20.1 / 20.10 -> 20h 10m = 20.17 | 20.51 -> 20h 51m = 20.85)
  if (/^(\d+)\.(\d{1,2})$/.test(trimmed)) {
    const match = trimmed.match(/^(\d+)\.(\d{1,2})$/);
    const h = parseInt(match[1], 10);
    let mStr = match[2];
    if (mStr.length === 1) mStr = mStr + '0';
    const m = parseInt(mStr, 10);
    if (m >= 0 && m < 60) {
      return +((h + (m / 60)).toFixed(2));
    }
  }

  return parseFloat(trimmed) || 0;
}

/**
 * Render Dynamic Line Items in Editor Panel
 */
function renderItemRows() {
  const container = document.getElementById('items-container');
  container.innerHTML = '';

  invoiceData.items.forEach((item, index) => {
    const hours = parseFloat(item.hours) || 0;
    const rate = parseFloat(item.rate) || 0;
    const rowTotal = hours * rate;

    const rowEl = document.createElement('div');
    rowEl.className = 'item-row';
    rowEl.innerHTML = `
      <div class="form-group">
        <input type="text" class="item-task-input" data-index="${index}" value="${escapeHtml(item.task)}" placeholder="Task / Area description">
      </div>
      <div class="form-group" style="position: relative;">
        <input type="text" class="item-hours-input" data-index="${index}" value="${item.hours || ''}" placeholder="0.00 or 20h 51m" title="Enter decimal hours (e.g. 20.85) or duration (e.g. 20h 51m, 20:51)">
      </div>
      <div class="form-group">
        <input type="number" step="0.01" class="item-rate-input" data-index="${index}" value="${item.rate || ''}" placeholder="0.00">
      </div>
      <div class="item-row-total">${formatCurrency(rowTotal)}</div>
      <div style="display: flex; align-items: center; gap: 0.35rem;">
        <button type="button" class="btn-icon-calc btn-row-calc" data-index="${index}" title="Direct Calculate Time to Decimal Hours">
          <i class="fa-solid fa-calculator"></i>
        </button>
        ${invoiceData.items.length > 1 ? `
          <button class="btn-icon-danger btn-remove-item" data-index="${index}" title="Remove Item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        ` : `
          <button class="btn-icon-danger" disabled style="opacity: 0.2; cursor: not-allowed;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `}
      </div>
    `;
    container.appendChild(rowEl);
  });

  // Attach input listeners
  container.querySelectorAll('.item-task-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index);
      invoiceData.items[idx].task = e.target.value;
      renderSheetPreview();
    });
  });

  // Hours input listener with instant live auto-calculation (Zero double-conversion loop)
  container.querySelectorAll('.item-hours-input').forEach(input => {
    const syncRowCalculations = (val) => {
      const idx = parseInt(input.dataset.index);
      const parsedHours = parseTimeStringToDecimal(val);
      invoiceData.items[idx].hours = val === '' ? '' : parsedHours;

      const hours = parseFloat(invoiceData.items[idx].hours) || 0;
      const rate = parseFloat(invoiceData.items[idx].rate) || 0;

      const row = input.closest('.item-row');
      if (row) {
        row.querySelector('.item-row-total').textContent = formatCurrency(hours * rate);
        
        let hintEl = row.querySelector('.live-hours-hint');
        if (val && (val.includes(':') || /[hmsd]/i.test(val) || /^(\d+)\.(\d{1,2})$/.test(val))) {
          if (!hintEl) {
            hintEl = document.createElement('span');
            hintEl.className = 'live-hours-hint';
            row.querySelector('.form-group:nth-child(2)').appendChild(hintEl);
          }
          hintEl.textContent = `= ${hours.toFixed(2)} hrs`;
          hintEl.style.display = 'inline-block';
        } else if (hintEl) {
          hintEl.style.display = 'none';
        }
      }
      updateSummary();
      renderSheetPreview();
    };

    input.addEventListener('input', (e) => syncRowCalculations(e.target.value));
  });

  // Rate input listener
  container.querySelectorAll('.item-rate-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index);
      invoiceData.items[idx].rate = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
      const hours = parseFloat(invoiceData.items[idx].hours) || 0;
      const rate = parseFloat(invoiceData.items[idx].rate) || 0;

      const row = e.target.closest('.item-row');
      if (row) {
        row.querySelector('.item-row-total').textContent = formatCurrency(hours * rate);
      }
      updateSummary();
      renderSheetPreview();
    });
  });

  // Direct Calculate Button per row (replaces input with final decimal hours cleanly)
  container.querySelectorAll('.btn-row-calc').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      const row = btn.closest('.item-row');
      const hoursInput = row ? row.querySelector('.item-hours-input') : null;
      const rawVal = hoursInput ? hoursInput.value : invoiceData.items[idx].hours;

      const calculatedHours = parseTimeStringToDecimal(rawVal);
      invoiceData.items[idx].hours = calculatedHours;

      if (hoursInput) {
        hoursInput.value = calculatedHours > 0 ? calculatedHours.toFixed(2) : '';
      }

      const hours = parseFloat(invoiceData.items[idx].hours) || 0;
      const rate = parseFloat(invoiceData.items[idx].rate) || 0;
      if (row) {
        row.querySelector('.item-row-total').textContent = formatCurrency(hours * rate);
        const hintEl = row.querySelector('.live-hours-hint');
        if (hintEl) {
          hintEl.textContent = `✓ ${hours.toFixed(2)} hrs`;
          hintEl.style.display = 'inline-block';
        }
      }

      updateSummary();
      renderSheetPreview();
      showToast(`Calculated: ${calculatedHours.toFixed(2)} hours`);
    });
  });

  // Remove item buttons
  container.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      invoiceData.items.splice(idx, 1);
      renderItemRows();
      updateSummary();
      renderSheetPreview();
    });
  });
}

/**
 * Update Editor & Quick Summary
 */
function updateSummary() {
  const totals = calculateTotals();
  const hoursFormatted = formatNumber(totals.totalHours);
  const subtotalFormatted = formatCurrency(totals.subtotal);
  const totalFormatted = formatCurrency(totals.grandTotal);
  const firstRate = invoiceData.items.length > 0 ? formatCurrency(invoiceData.items[0].rate) : '$0.00';

  // Stats Card
  const statHours = document.getElementById('stat-hours');
  const statRate = document.getElementById('stat-rate');
  const statTotal = document.getElementById('stat-total');
  if (statHours) statHours.textContent = hoursFormatted;
  if (statRate) statRate.textContent = firstRate;
  if (statTotal) statTotal.textContent = totalFormatted;

  // Editor Summary Box
  const sumHours = document.getElementById('summary-hours');
  const sumSub = document.getElementById('summary-subtotal');
  const sumTot = document.getElementById('summary-total');
  if (sumHours) sumHours.textContent = hoursFormatted;
  if (sumSub) sumSub.textContent = subtotalFormatted;
  if (sumTot) sumTot.textContent = totalFormatted;

  // Real-time time breakdown display in Section 4
  const totalSec = Math.round(totals.totalHours * 3600);
  const days = Math.floor(totalSec / 86400);
  const rem1 = totalSec % 86400;
  const hours = Math.floor(rem1 / 3600);
  const rem2 = rem1 % 3600;
  const mins = Math.floor(rem2 / 60);
  const secs = rem2 % 60;

  const decimalDays = (totalSec / 86400).toLocaleString('en-US', { maximumFractionDigits: 5 });
  const totalMins = Math.round(totalSec / 60).toLocaleString('en-US');
  const formattedSecs = totalSec.toLocaleString('en-US');

  const elTbBadge = document.getElementById('tb-badge-hours');
  const elMathText = document.getElementById('task-time-math-text');
  const elEqDays = document.getElementById('eq-days');
  const elEqHours = document.getElementById('eq-hours');
  const elEqMins = document.getElementById('eq-mins');
  const elEqSecs = document.getElementById('eq-secs');

  if (elTbBadge) elTbBadge.textContent = `${hoursFormatted} hrs`;
  if (elMathText) elMathText.textContent = `${days} days ${hours} hours ${mins} minutes ${secs} seconds = ${hoursFormatted} hours`;
  if (elEqDays) elEqDays.textContent = decimalDays;
  if (elEqHours) elEqHours.textContent = `${hoursFormatted} hrs`;
  if (elEqMins) elEqMins.textContent = `${totalMins} min`;
  if (elEqSecs) elEqSecs.textContent = `${formattedSecs} s`;
}

/**
 * Render the Pixel-Accurate Spreadsheet Canvas
 */
function renderSheetPreview() {
  const tbody = document.getElementById('excel-grid-body');
  tbody.innerHTML = '';

  const totals = calculateTotals();
  const totalRows = Math.max(25, 20 + invoiceData.items.length);

  // Build rows 1..totalRows with cols A..G
  for (let r = 1; r <= totalRows; r++) {
    const tr = document.createElement('tr');

    // Row Header (1, 2, 3...)
    const rowHeader = document.createElement('td');
    rowHeader.className = 'row-head';
    rowHeader.textContent = r;
    tr.appendChild(rowHeader);

    // Cells A, B, C, D, E, F, G
    const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    cols.forEach(col => {
      const td = document.createElement('td');
      td.id = `cell-${col}${r}`;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }

  // Helper to safely set cell content and class
  const setCell = (col, row, content, className = '', colSpan = 1) => {
    const cell = document.getElementById(`cell-${col}${row}`);
    if (!cell) return;
    if (content !== undefined && content !== null) {
      cell.innerHTML = content;
    }
    if (className) {
      className.split(' ').forEach(cls => cell.classList.add(cls));
    }
    if (colSpan > 1) {
      cell.setAttribute('colspan', colSpan);
      const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      const startIdx = cols.indexOf(col.toLowerCase());
      for (let i = 1; i < colSpan; i++) {
        const nextCol = cols[startIdx + i];
        const nextCell = document.getElementById(`cell-${nextCol}${row}`);
        if (nextCell) {
          nextCell.remove();
        }
      }
    }
  };

  // Row 1: Solid Top Blue Accent Banner (A1:G1)
  setCell('a', 1, '', 'sheet-accent-banner', 7);

  // Row 5: "Invoice" Title
  setCell('b', 5, 'Invoice', 'cell-invoice-title', 2);

  // Row 6: "Submitted on" in B6 & Date in C6
  setCell('b', 6, 'Submitted on', 'cell-bold-label');
  setCell('c', 6, escapeHtml(invoiceData.submittedOn), 'text-left', 2);

  // Row 7: "Work preformed" in B7 & Period in C7
  setCell('b', 7, 'Work preformed', 'cell-bold-label');
  setCell('c', 7, escapeHtml(invoiceData.workPerformed), 'text-left', 2);

  // Row 8: "Invoice for" | "Payable to" | "Invoice #:"
  setCell('b', 8, 'Invoice for', 'cell-bold-label');
  setCell('c', 8, 'Payable to', 'cell-bold-label', 2);
  setCell('f', 8, 'Invoice #:', 'cell-bold-label', 2);

  // Row 9: Client Box (Cream Highlight) in B9 | Payee in C9 | Invoice # in F9
  setCell('b', 9, escapeHtml(invoiceData.invoiceFor), 'cell-highlight-client');
  setCell('c', 9, escapeHtml(invoiceData.payableTo), 'text-left', 2);
  setCell('f', 9, escapeHtml(invoiceData.invoiceNum), 'text-left', 2);

  // Row 10: Phone/ID in B10 (below Client) | Payment Method in C10
  setCell('b', 10, escapeHtml(invoiceData.phoneOrId), 'text-right');
  setCell('c', 10, escapeHtml(invoiceData.paymentMethod), 'text-left', 2);

  // Row 12: Column Headers (Description | Hours | Hourly Rate | Total price)
  setCell('b', 12, 'Description', 'cell-header-desc', 3);
  setCell('e', 12, 'Hours', 'cell-header-hours');
  setCell('f', 12, 'Hourly Rate', 'cell-header-rate');
  setCell('g', 12, 'Total price', 'cell-header-price');

  // Row 14: Role (IT Specialist Virtual Assistant)
  setCell('b', 14, escapeHtml(invoiceData.role), '', 3);

  // Task Items starting from Row 15
  let currentRow = 15;
  invoiceData.items.forEach((item) => {
    const itemTotal = (parseFloat(item.hours) || 0) * (parseFloat(item.rate) || 0);
    setCell('b', currentRow, escapeHtml(item.task), '', 3);
    setCell('e', currentRow, formatNumber(item.hours), 'text-right');
    setCell('f', currentRow, formatCurrency(item.rate), 'text-right');
    setCell('g', currentRow, formatCurrency(itemTotal), 'text-right');
    currentRow++;
  });

  // Summary Row (Total Hours summary)
  setCell('e', currentRow, formatNumber(totals.totalHours), 'text-right');
  const firstRate = invoiceData.items.length > 0 ? invoiceData.items[0].rate : 0;
  setCell('f', currentRow, formatCurrency(firstRate), 'text-right');
  setCell('g', currentRow, formatCurrency(totals.subtotal), 'text-right');
  currentRow++;

  // Subtotal Row
  setCell('f', currentRow, 'Subtotal', 'cell-subtotal-label');
  setCell('g', currentRow, formatCurrency(totals.subtotal), 'text-right');
  currentRow += 2;

  // Grand Total Big Green Amount (Row ~19)
  setCell('f', currentRow, formatCurrency(totals.grandTotal), 'cell-grand-total', 2);
  currentRow += 2;

  // Bottom Solid Blue Accent Banner (Row ~21)
  setCell('a', currentRow, '', 'sheet-accent-banner', 7);

  // Auto-save changes immediately to localStorage
  saveToLocalStorage();
}

/**
 * Escape HTML to prevent injection
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Show Toast Notification
 */
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const msgEl = toast.querySelector('.toast-message');
  const iconEl = toast.querySelector('.toast-icon');

  msgEl.textContent = message;
  if (isError) {
    iconEl.className = 'toast-icon fa-solid fa-triangle-exclamation';
    iconEl.style.color = '#f87171';
  } else {
    iconEl.className = 'toast-icon fa-solid fa-check';
    iconEl.style.color = '#4ade80';
  }

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/**
 * Generate Pristine, High-Contrast Invoice HTML for PDF & Preview (Exact Spreadsheet Grid)
 */
function generateInvoicePrintHTML(orientation = 'portrait') {
  const totals = calculateTotals();
  const firstRate = invoiceData.items.length > 0 ? (parseFloat(invoiceData.items[0].rate) || 0) : 0;

  return `
    <div class="pdf-invoice-root ${orientation}" id="pdf-printable-invoice">
      <table class="pdf-table-grid">
        <colgroup>
          <col style="width: 3%;">  <!-- Col A (gutter) -->
          <col style="width: 29%;"> <!-- Col B (Invoice for / Description) -->
          <col style="width: 25%;"> <!-- Col C (Payable to / Dates) -->
          <col style="width: 13%;"> <!-- Col D (Payment method) -->
          <col style="width: 10%;"> <!-- Col E (Hours) -->
          <col style="width: 10%;"> <!-- Col F (Hourly Rate) -->
          <col style="width: 10%;"> <!-- Col G (Total price) -->
        </colgroup>
        <tbody>
          <!-- Row 1: Top Blue Accent Banner (A1:G1) -->
          <tr>
            <td colspan="7" class="pdf-cell-banner top"></td>
          </tr>

          <!-- Row 2, 3, 4: Spacing -->
          <tr style="height: 8px;"><td colspan="7"></td></tr>

          <!-- Row 5: Invoice Title -->
          <tr>
            <td></td>
            <td colspan="2" class="pdf-cell-title">Invoice</td>
            <td colspan="4"></td>
          </tr>

          <!-- Row 6: "Submitted on" & Date -->
          <tr>
            <td></td>
            <td class="pdf-cell-bold">Submitted on</td>
            <td colspan="2" class="pdf-cell-text">${escapeHtml(invoiceData.submittedOn || '')}</td>
            <td colspan="3"></td>
          </tr>

          <!-- Row 7: "Work preformed" & Period -->
          <tr>
            <td></td>
            <td class="pdf-cell-bold">Work preformed</td>
            <td colspan="2" class="pdf-cell-text">${escapeHtml(invoiceData.workPerformed || '')}</td>
            <td colspan="3"></td>
          </tr>

          <!-- Row 8: Headers (Invoice for | Payable to | Invoice #:) -->
          <tr style="height: 22px;">
            <td></td>
            <td class="pdf-cell-bold">Invoice for</td>
            <td colspan="2" class="pdf-cell-bold">Payable to</td>
            <td></td>
            <td colspan="2" class="pdf-cell-bold" style="text-align: left;">Invoice #:</td>
          </tr>

          <!-- Row 9: Client Box | Payee Name | Invoice # -->
          <tr>
            <td></td>
            <td><span class="pdf-cell-client">${escapeHtml(invoiceData.invoiceFor || '')}</span></td>
            <td colspan="2" class="pdf-cell-text">${escapeHtml(invoiceData.payableTo || '')}</td>
            <td></td>
            <td colspan="2" class="pdf-cell-text" style="font-weight: 600; text-align: left;">${escapeHtml(invoiceData.invoiceNum || '')}</td>
          </tr>

          <!-- Row 10: Phone / ID Number | Payment Method -->
          <tr>
            <td></td>
            <td class="pdf-cell-phone">${escapeHtml(invoiceData.phoneOrId || '')}</td>
            <td colspan="2" class="pdf-cell-text" style="color: #475569;">${escapeHtml(invoiceData.paymentMethod || '')}</td>
            <td colspan="3"></td>
          </tr>

          <!-- Row 11: Spacing -->
          <tr style="height: 12px;"><td colspan="7"></td></tr>

          <!-- Row 12: Column Headers (Description | Hours | Hourly Rate | Total price) -->
          <tr class="pdf-header-row">
            <td></td>
            <td colspan="3" class="pdf-col-header" style="text-align: left;">Description</td>
            <td class="pdf-col-header" style="text-align: right;">Hours</td>
            <td class="pdf-col-header" style="text-align: right;">Hourly Rate</td>
            <td class="pdf-col-header" style="text-align: right;">Total price</td>
          </tr>

          <!-- Row 14: Role (IT Specialist Virtual Assistant) -->
          ${invoiceData.role ? `
            <tr>
              <td></td>
              <td colspan="3" class="pdf-cell-role">${escapeHtml(invoiceData.role)}</td>
              <td colspan="3"></td>
            </tr>
          ` : ''}

          <!-- Line Items (Row 15+) -->
          ${invoiceData.items.map(item => {
            const h = parseFloat(item.hours) || 0;
            const r = parseFloat(item.rate) || 0;
            return `
              <tr class="pdf-item-row">
                <td></td>
                <td colspan="3" class="pdf-cell-task">${escapeHtml(item.task || '')}</td>
                <td class="pdf-cell-num">${formatNumber(h)}</td>
                <td class="pdf-cell-num">${formatCurrency(r)}</td>
                <td class="pdf-cell-num">${formatCurrency(h * r)}</td>
              </tr>
            `;
          }).join('')}

          <!-- Summary Row -->
          <tr class="pdf-summary-row">
            <td></td>
            <td colspan="3"></td>
            <td class="pdf-cell-sum">${formatNumber(totals.totalHours)}</td>
            <td class="pdf-cell-sum">${formatCurrency(firstRate)}</td>
            <td class="pdf-cell-sum">${formatCurrency(totals.subtotal)}</td>
          </tr>

          <!-- Subtotal Row -->
          <tr class="pdf-subtotal-row">
            <td colspan="5"></td>
            <td class="pdf-cell-subtotal-label">Subtotal</td>
            <td class="pdf-cell-subtotal-val">${formatCurrency(totals.subtotal)}</td>
          </tr>

          <!-- Row Spacing before Grand Total -->
          <tr style="height: 10px;"><td colspan="7"></td></tr>

          <!-- Grand Total Big Green Amount (Row 19) -->
          <tr>
            <td colspan="4"></td>
            <td colspan="3" class="pdf-cell-grand-total">${formatCurrency(totals.grandTotal)}</td>
          </tr>

          <!-- Spacing before Bottom Banner -->
          <tr style="height: 14px;"><td colspan="7"></td></tr>

          <!-- Bottom Solid Blue Accent Banner (Row 21) -->
          <tr>
            <td colspan="7" class="pdf-cell-banner bottom"></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Export Styled Excel (.xlsx) using ExcelJS with Readable Formatting & Formulas
 */
async function exportToExcel(orientation = 'portrait') {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dylan Invoice Studio';
    workbook.lastModifiedBy = invoiceData.payableTo || 'Dylan';
    workbook.created = new Date();
    workbook.modified = new Date();

    let sheetName = 'Invoice';
    if (invoiceData.workPerformed) {
      sheetName = `INV ${invoiceData.workPerformed.replace(/[/\\?*[\]]/g, '-')}`.substring(0, 31);
    }
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
      pageSetup: {
        orientation: orientation || 'portrait',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      }
    });

    // Generous, readable column widths
    worksheet.columns = [
      { key: 'colA', width: 4 },   // A (gutter)
      { key: 'colB', width: 34 },  // B (Description / Role / Title)
      { key: 'colC', width: 26 },  // C (Payee / Dates)
      { key: 'colD', width: 22 },  // D (Payment method)
      { key: 'colE', width: 14 },  // E (Hours)
      { key: 'colF', width: 16 },  // F (Rate)
      { key: 'colG', width: 18 }   // G (Total)
    ];

    const blueSolidFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF15509C' }
    };

    const creamYellowFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' }
    };

    const navyColor = { argb: 'FF1A3B70' };
    const greenColor = { argb: 'FF2E7D32' };

    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };

    // Fill placeholder rows
    for (let i = 1; i <= 25; i++) {
      worksheet.addRow([]);
    }

    // Row 1: Top Blue Accent Banner (A1:G1)
    worksheet.mergeCells('A1:G1');
    const topBannerCell = worksheet.getCell('A1');
    topBannerCell.fill = blueSolidFill;
    worksheet.getRow(1).height = 14;

    // Row 5: Invoice Title
    const titleCell = worksheet.getCell('B5');
    titleCell.value = 'Invoice';
    titleCell.font = { name: 'Arial', size: 24, bold: true, color: navyColor };
    worksheet.getRow(5).height = 32;

    // Row 6: "Submitted on" in B6 and Value in C6
    const submittedOnLabel = worksheet.getCell('B6');
    submittedOnLabel.value = 'Submitted on';
    submittedOnLabel.font = { name: 'Arial', size: 10, bold: true };

    const submittedOnVal = worksheet.getCell('C6');
    submittedOnVal.value = invoiceData.submittedOn;
    submittedOnVal.font = { name: 'Arial', size: 10 };
    submittedOnVal.alignment = { horizontal: 'left' };

    // Row 7: "Work preformed" and Value
    const workPerformedLabel = worksheet.getCell('B7');
    workPerformedLabel.value = 'Work preformed';
    workPerformedLabel.font = { name: 'Arial', size: 10, bold: true };

    const workPerformedVal = worksheet.getCell('C7');
    workPerformedVal.value = invoiceData.workPerformed;
    workPerformedVal.font = { name: 'Arial', size: 10 };

    // Row 8: Headers (Invoice for | Payable to | Invoice #:)
    worksheet.getCell('B8').value = 'Invoice for';
    worksheet.getCell('B8').font = { name: 'Arial', size: 10, bold: true };

    worksheet.getCell('C8').value = 'Payable to';
    worksheet.getCell('C8').font = { name: 'Arial', size: 10, bold: true };

    worksheet.getCell('F8').value = 'Invoice #:';
    worksheet.getCell('F8').font = { name: 'Arial', size: 10, bold: true };

    // Row 9: Client Box | Payee Name | Invoice #
    const clientCell = worksheet.getCell('B9');
    clientCell.value = invoiceData.invoiceFor;
    clientCell.fill = creamYellowFill;
    clientCell.font = { name: 'Arial', size: 10, bold: true };

    const payeeCell = worksheet.getCell('C9');
    payeeCell.value = invoiceData.payableTo;
    payeeCell.font = { name: 'Arial', size: 10 };

    const invoiceNumCell = worksheet.getCell('F9');
    invoiceNumCell.value = invoiceData.invoiceNum;
    invoiceNumCell.font = { name: 'Arial', size: 10 };

    // Row 10: Phone / ID Number in B10 | Payment Method in C10 (Merged C10:D10)
    const phoneCell = worksheet.getCell('B10');
    phoneCell.value = invoiceData.phoneOrId;
    phoneCell.font = { name: 'Arial', size: 10 };
    phoneCell.alignment = { horizontal: 'right' };

    worksheet.mergeCells('C10:D10');
    const paymentCell = worksheet.getCell('C10');
    paymentCell.value = invoiceData.paymentMethod;
    paymentCell.font = { name: 'Arial', size: 10 };

    // Row 12: Column Headers (Description | Hours | Hourly Rate | Total price)
    const headerRow = worksheet.getRow(12);
    headerRow.height = 22;

    const descH = worksheet.getCell('B12');
    descH.value = 'Description';
    descH.font = { name: 'Arial', size: 10, bold: true, color: navyColor };
    descH.border = thinBorder;

    const hoursH = worksheet.getCell('E12');
    hoursH.value = 'Hours';
    hoursH.font = { name: 'Arial', size: 10, bold: true, color: navyColor };
    hoursH.alignment = { horizontal: 'right' };
    hoursH.border = thinBorder;

    const rateH = worksheet.getCell('F12');
    rateH.value = 'Hourly Rate';
    rateH.font = { name: 'Arial', size: 10, bold: true, color: navyColor };
    rateH.alignment = { horizontal: 'right' };
    rateH.border = thinBorder;

    const priceH = worksheet.getCell('G12');
    priceH.value = 'Total price';
    priceH.font = { name: 'Arial', size: 10, bold: true, color: navyColor };
    priceH.alignment = { horizontal: 'right' };
    priceH.border = thinBorder;

    // Row 14: Role
    const roleCell = worksheet.getCell('B14');
    roleCell.value = invoiceData.role;
    roleCell.font = { name: 'Arial', size: 10, bold: true };

    // Row 15+: Line Items
    let curRow = 15;
    invoiceData.items.forEach((item) => {
      const taskCell = worksheet.getCell(`B${curRow}`);
      taskCell.value = item.task;
      taskCell.font = { name: 'Arial', size: 10 };
      taskCell.border = thinBorder;

      const hoursCell = worksheet.getCell(`E${curRow}`);
      hoursCell.value = parseFloat(item.hours) || 0;
      hoursCell.numFmt = '0.00';
      hoursCell.font = { name: 'Arial', size: 10 };
      hoursCell.alignment = { horizontal: 'right' };
      hoursCell.border = thinBorder;

      const rateCell = worksheet.getCell(`F${curRow}`);
      rateCell.value = parseFloat(item.rate) || 0;
      rateCell.numFmt = '$#,##0.00';
      rateCell.font = { name: 'Arial', size: 10 };
      rateCell.alignment = { horizontal: 'right' };
      rateCell.border = thinBorder;

      const totalCell = worksheet.getCell(`G${curRow}`);
      totalCell.value = { formula: `E${curRow}*F${curRow}`, result: (parseFloat(item.hours) || 0) * (parseFloat(item.rate) || 0) };
      totalCell.numFmt = '$#,##0.00';
      totalCell.font = { name: 'Arial', size: 10 };
      totalCell.alignment = { horizontal: 'right' };
      totalCell.border = thinBorder;

      curRow++;
    });

    const totals = calculateTotals();

    // Summary Line
    const sumHoursCell = worksheet.getCell(`E${curRow}`);
    sumHoursCell.value = totals.totalHours;
    sumHoursCell.numFmt = '0.00';
    sumHoursCell.font = { name: 'Arial', size: 10, bold: true };
    sumHoursCell.alignment = { horizontal: 'right' };
    sumHoursCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };

    const firstRate = invoiceData.items.length > 0 ? (parseFloat(invoiceData.items[0].rate) || 0) : 0;
    const sumRateCell = worksheet.getCell(`F${curRow}`);
    sumRateCell.value = firstRate;
    sumRateCell.numFmt = '$#,##0.00';
    sumRateCell.font = { name: 'Arial', size: 10, bold: true };
    sumRateCell.alignment = { horizontal: 'right' };
    sumRateCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };

    const sumTotalCell = worksheet.getCell(`G${curRow}`);
    sumTotalCell.value = { formula: `SUM(G15:G${curRow - 1})`, result: totals.subtotal };
    sumTotalCell.numFmt = '$#,##0.00';
    sumTotalCell.font = { name: 'Arial', size: 10, bold: true };
    sumTotalCell.alignment = { horizontal: 'right' };
    sumTotalCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
    curRow++;

    // Subtotal Row
    const subtotalLabel = worksheet.getCell(`F${curRow}`);
    subtotalLabel.value = 'Subtotal';
    subtotalLabel.font = { name: 'Arial', size: 10 };
    subtotalLabel.alignment = { horizontal: 'right' };

    const subtotalVal = worksheet.getCell(`G${curRow}`);
    subtotalVal.value = { formula: `G${curRow - 1}`, result: totals.subtotal };
    subtotalVal.numFmt = '$#,##0.00';
    subtotalVal.font = { name: 'Arial', size: 10, bold: true };
    subtotalVal.alignment = { horizontal: 'right' };
    curRow += 2;

    // Big Green Total Price (~Row 19)
    worksheet.mergeCells(`F${curRow}:G${curRow}`);
    const grandTotalCell = worksheet.getCell(`F${curRow}`);
    grandTotalCell.value = totals.grandTotal;
    grandTotalCell.numFmt = '$#,##0.00';
    grandTotalCell.font = { name: 'Arial', size: 20, bold: true, color: greenColor };
    grandTotalCell.alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getRow(curRow).height = 28;
    curRow += 2;

    // Bottom Solid Blue Accent Banner (Row ~21)
    worksheet.mergeCells(`A${curRow}:G${curRow}`);
    const botBannerCell = worksheet.getCell(`A${curRow}`);
    botBannerCell.fill = blueSolidFill;
    worksheet.getRow(curRow).height = 14;

    // Generate buffer & trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const cleanPayee = (invoiceData.payableTo || 'Invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Invoice_${invoiceData.invoiceNum || '001'}_${cleanPayee}.xlsx`;

    downloadBlob(blob, filename);
    showToast(`Excel file "${filename}" downloaded!`);

  } catch (error) {
    console.error('Error generating Excel file', error);
    showToast('Failed to export Excel file. Please try again.', true);
  }
}

/**
 * Safe Blob Downloader with Native Anchor Fallback
 */
function downloadBlob(blob, filename) {
  try {
    if (typeof saveAs === 'function') {
      saveAs(blob, filename);
      return;
    }
  } catch (e) {
    console.warn('saveAs fallback to createObjectURL', e);
  }
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Export High-Resolution, Perfectly Fitted PDF
 */
async function exportToPDF(orientation = 'portrait') {
  const cleanPayee = (invoiceData.payableTo || 'Invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Invoice_${invoiceData.invoiceNum || '001'}_${cleanPayee}.pdf`;

  showToast('Generating high-resolution PDF...');

  // Create temporary container for pristine vector capture
  const printContainer = document.createElement('div');
  printContainer.style.position = 'fixed';
  printContainer.style.top = '-9999px';
  printContainer.style.left = '-9999px';
  printContainer.style.width = orientation === 'landscape' ? '1020px' : '750px';
  printContainer.style.background = '#ffffff';
  printContainer.style.margin = '0 auto';
  printContainer.style.padding = '0';
  printContainer.style.boxSizing = 'border-box';
  printContainer.style.zIndex = '-9999';
  printContainer.innerHTML = generateInvoicePrintHTML(orientation);
  document.body.appendChild(printContainer);

  try {
    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin: orientation === 'landscape' ? [12, 14, 12, 14] : [14, 12, 14, 12],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2.5,
          useCORS: true,
          letterRendering: true,
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: orientation || 'portrait'
        }
      };

      await html2pdf().set(opt).from(printContainer.firstElementChild).save();
      showToast(`PDF "${filename}" downloaded successfully!`);
    } else {
      window.print();
    }
  } catch (err) {
    console.error('PDF export error:', err);
    showToast('Failed to export PDF. Falling back to print...', true);
    window.print();
  } finally {
    if (document.body.contains(printContainer)) {
      document.body.removeChild(printContainer);
    }
  }
}

// Export Modal State & Logic
let currentExportMode = 'pdf'; // 'pdf' | 'excel'
let currentOrientation = 'portrait'; // 'portrait' | 'landscape'

function openExportModal(mode) {
  currentExportMode = mode;
  currentOrientation = 'portrait';

  const modal = document.getElementById('export-modal');
  const iconBox = document.getElementById('modal-type-icon');
  const heading = document.getElementById('modal-heading');
  const subheading = document.getElementById('modal-subheading');
  const filenameBadge = document.getElementById('modal-filename');
  const confirmBtnText = document.getElementById('modal-confirm-text');

  const cleanPayee = (invoiceData.payableTo || 'Invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
  const baseNum = invoiceData.invoiceNum || '001';

  if (mode === 'pdf') {
    iconBox.className = 'modal-icon-box';
    iconBox.innerHTML = '<i class="fa-solid fa-file-pdf"></i>';
    heading.textContent = 'Preview & Export PDF';
    subheading.textContent = 'High-resolution vector layout, readable typography, perfectly fitted';
    filenameBadge.textContent = `Invoice_${baseNum}_${cleanPayee}.pdf`;
    confirmBtnText.textContent = 'Download PDF';
  } else {
    iconBox.className = 'modal-icon-box excel-mode';
    iconBox.innerHTML = '<i class="fa-solid fa-file-excel"></i>';
    heading.textContent = 'Preview & Export Excel';
    subheading.textContent = 'Styled spreadsheet with real formulas, auto-width columns, and print borders';
    filenameBadge.textContent = `Invoice_${baseNum}_${cleanPayee}.xlsx`;
    confirmBtnText.textContent = 'Download Excel (.xlsx)';
  }

  renderModalPreview();
  setModalOrientation('portrait');

  modal.classList.add('show');
}

function renderModalPreview() {
  const previewSheet = document.getElementById('modal-preview-sheet');
  if (!previewSheet) return;
  previewSheet.innerHTML = generateInvoicePrintHTML(currentOrientation);
}

function closeExportModal() {
  const modal = document.getElementById('export-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function setModalOrientation(orient) {
  currentOrientation = orient;
  const paper = document.getElementById('modal-paper');
  const btnPortrait = document.getElementById('btn-orient-portrait');
  const btnLandscape = document.getElementById('btn-orient-landscape');

  if (orient === 'landscape') {
    paper.className = 'modal-paper landscape';
    if (btnLandscape) btnLandscape.classList.add('active');
    if (btnPortrait) btnPortrait.classList.remove('active');
  } else {
    paper.className = 'modal-paper portrait';
    if (btnPortrait) btnPortrait.classList.add('active');
    if (btnLandscape) btnLandscape.classList.remove('active');
  }

  renderModalPreview();
}

// Time Calculator State & Logic
let activeCalcTaskIndex = 0;

function openTimeCalcModal(taskIndex = 0) {
  activeCalcTaskIndex = taskIndex;
  const modal = document.getElementById('time-calc-modal');
  if (!modal) return;

  // Populate target task select options
  const targetSelect = document.getElementById('tc-target-task-select');
  if (targetSelect) {
    targetSelect.innerHTML = '';
    invoiceData.items.forEach((item, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      const desc = item.task ? item.task.substring(0, 24) : `Task #${idx + 1}`;
      opt.textContent = `${idx + 1}. ${desc} (${item.hours || 0} hrs)`;
      if (idx === activeCalcTaskIndex) opt.selected = true;
      targetSelect.appendChild(opt);
    });

    targetSelect.onchange = (e) => {
      activeCalcTaskIndex = parseInt(e.target.value) || 0;
      const curHours = parseFloat(invoiceData.items[activeCalcTaskIndex]?.hours) || 0;
      const totalSec = Math.round(curHours * 3600);
      const d = Math.floor(totalSec / 86400);
      const rem1 = totalSec % 86400;
      const h = Math.floor(rem1 / 3600);
      const rem2 = rem1 % 3600;
      const m = Math.floor(rem2 / 60);
      const s = rem2 % 60;
      const setInput = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      };
      setInput('tc-d1', d);
      setInput('tc-h1', h);
      setInput('tc-m1', m);
      setInput('tc-s1', s);
      updateTimeCalculator();
    };
  }

  // If the active task already has hours, seed Entry 1 with existing hours
  const currentHours = parseFloat(invoiceData.items[taskIndex]?.hours) || 0;
  if (currentHours > 0) {
    const totalSec = Math.round(currentHours * 3600);
    const d = Math.floor(totalSec / 86400);
    const rem1 = totalSec % 86400;
    const h = Math.floor(rem1 / 3600);
    const rem2 = rem1 % 3600;
    const m = Math.floor(rem2 / 60);
    const s = rem2 % 60;

    const setInput = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setInput('tc-d1', d);
    setInput('tc-h1', h);
    setInput('tc-m1', m);
    setInput('tc-s1', s);
  }

  updateTimeCalculator();
  modal.classList.add('show');
}

function closeTimeCalcModal() {
  const modal = document.getElementById('time-calc-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function updateTimeCalculator() {
  const getNum = (id) => {
    const el = document.getElementById(id);
    return el ? (parseFloat(el.value) || 0) : 0;
  };

  const d1 = getNum('tc-d1');
  const h1 = getNum('tc-h1');
  const m1 = getNum('tc-m1');
  const s1 = getNum('tc-s1');

  const d2 = getNum('tc-d2');
  const h2 = getNum('tc-h2');
  const m2 = getNum('tc-m2');
  const s2 = getNum('tc-s2');

  const opRadio = document.querySelector('input[name="tc-op"]:checked');
  const op = opRadio ? opRadio.value : 'add';

  const t1Sec = (d1 * 86400) + (h1 * 3600) + (m1 * 60) + s1;
  const t2Sec = (d2 * 86400) + (h2 * 3600) + (m2 * 60) + s2;

  let totalSec = op === 'add' ? (t1Sec + t2Sec) : (t1Sec - t2Sec);
  if (totalSec < 0) totalSec = 0;

  // Breakdown
  const resDays = Math.floor(totalSec / 86400);
  const rem1 = totalSec % 86400;
  const resHours = Math.floor(rem1 / 3600);
  const rem2 = rem1 % 3600;
  const resMins = Math.floor(rem2 / 60);
  const resSecs = Math.round(rem2 % 60);

  // Set result fields
  const setResult = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };
  setResult('tc-d-res', resDays);
  setResult('tc-h-res', resHours);
  setResult('tc-m-res', resMins);
  setResult('tc-s-res', resSecs);

  // Conversions matching exact screenshot precision
  const decimalDays = (totalSec / 86400).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 });
  const decimalHoursPrecise = (totalSec / 3600).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 5 });
  const decimalHours = +(totalSec / 3600).toFixed(2);
  const totalMins = Math.round(totalSec / 60).toLocaleString('en-US');
  const formattedSecs = totalSec.toLocaleString('en-US');

  // Update exact top math formula matching image
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  const sign = op === 'add' ? '+' : '−';
  setText('tc-math-entry1', `${d1} days ${h1} hours ${m1} minutes ${s1} seconds`);
  setText('tc-math-sign', sign);
  setText('tc-math-entry2', `${d2} days ${h2} hours ${m2} minutes ${s2} seconds`);
  setText('tc-math-entry-res', `${resDays} days ${resHours} hours ${resMins} minutes ${resSecs} seconds`);
  setText('tc-math-days', decimalDays);
  setText('tc-math-hours', decimalHoursPrecise);
  setText('tc-math-mins', totalMins);
  setText('tc-math-secs', formattedSecs);
  setText('btn-tc-apply-val', decimalHours.toFixed(2));

  // Auto-sync into active task in real time (no click required!)
  if (invoiceData.items[activeCalcTaskIndex] !== undefined) {
    invoiceData.items[activeCalcTaskIndex].hours = decimalHours;
    const activeRowInput = document.querySelector(`.item-hours-input[data-index="${activeCalcTaskIndex}"]`);
    if (activeRowInput) {
      activeRowInput.value = decimalHours > 0 ? decimalHours.toString() : '';
      const row = activeRowInput.closest('.item-row');
      const rate = parseFloat(invoiceData.items[activeCalcTaskIndex].rate) || 0;
      if (row) {
        row.querySelector('.item-row-total').textContent = formatCurrency(decimalHours * rate);
      }
    }
    updateSummary();
    renderSheetPreview();
  }
}

function clearTimeCalculator() {
  ['tc-d1', 'tc-h1', 'tc-m1', 'tc-s1', 'tc-d2', 'tc-h2', 'tc-m2', 'tc-s2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = 0;
  });
  const addRadio = document.querySelector('input[name="tc-op"][value="add"]');
  if (addRadio) addRadio.checked = true;
  updateTimeCalculator();
}

function applyCalculatedTimeToTask() {
  const getNum = (id) => {
    const el = document.getElementById(id);
    return el ? (parseFloat(el.value) || 0) : 0;
  };
  const d1 = getNum('tc-d1');
  const h1 = getNum('tc-h1');
  const m1 = getNum('tc-m1');
  const s1 = getNum('tc-s1');
  const d2 = getNum('tc-d2');
  const h2 = getNum('tc-h2');
  const m2 = getNum('tc-m2');
  const s2 = getNum('tc-s2');
  const op = (document.querySelector('input[name="tc-op"]:checked')?.value) || 'add';

  const t1Sec = (d1 * 86400) + (h1 * 3600) + (m1 * 60) + s1;
  const t2Sec = (d2 * 86400) + (h2 * 3600) + (m2 * 60) + s2;
  let totalSec = op === 'add' ? (t1Sec + t2Sec) : (t1Sec - t2Sec);
  if (totalSec < 0) totalSec = 0;

  const decimalHours = +(totalSec / 3600).toFixed(2);

  if (invoiceData.items.length <= activeCalcTaskIndex) {
    activeCalcTaskIndex = 0;
  }

  if (invoiceData.items[activeCalcTaskIndex]) {
    invoiceData.items[activeCalcTaskIndex].hours = decimalHours;
  }

  renderItemRows();
  updateSummary();
  renderSheetPreview();
  closeTimeCalcModal();
  showToast(`Applied ${decimalHours} hours to task!`);
}

/**
 * Setup All Event Listeners
 */
function setupEventListeners() {
  // Inputs bindings for text fields
  const formBindings = [
    { id: 'input-invoice-num', prop: 'invoiceNum' },
    { id: 'input-invoice-for', prop: 'invoiceFor' },
    { id: 'input-phone-id', prop: 'phoneOrId' },
    { id: 'input-payable-to', prop: 'payableTo' },
    { id: 'input-payment-method', prop: 'paymentMethod' },
    { id: 'input-role', prop: 'role' }
  ];

  formBindings.forEach(binding => {
    const el = document.getElementById(binding.id);
    if (el) {
      el.addEventListener('input', (e) => {
        invoiceData[binding.prop] = e.target.value;
        updateSummary();
        renderSheetPreview();
      });
    }
  });

  // Date Picker: Submitted on
  const elSubmittedDate = document.getElementById('input-submitted-on-date');
  if (elSubmittedDate) {
    const updateSubmittedDate = (e) => {
      invoiceData.submittedOnDate = e.target.value;
      invoiceData.submittedOn = formatDateReadable(e.target.value);
      renderSheetPreview();
    };
    elSubmittedDate.addEventListener('change', updateSubmittedDate);
    elSubmittedDate.addEventListener('input', updateSubmittedDate);
  }

  // Date Pickers: Work Preformed (From and Up to)
  const elWorkFrom = document.getElementById('input-work-from');
  const elWorkTo = document.getElementById('input-work-to');

  const updateWorkPeriod = () => {
    if (elWorkFrom) invoiceData.workFromDate = elWorkFrom.value;
    if (elWorkTo) invoiceData.workToDate = elWorkTo.value;
    invoiceData.workPerformed = formatWorkPeriod(invoiceData.workFromDate, invoiceData.workToDate);
    renderSheetPreview();
  };

  if (elWorkFrom) {
    elWorkFrom.addEventListener('change', updateWorkPeriod);
    elWorkFrom.addEventListener('input', updateWorkPeriod);
  }

  if (elWorkTo) {
    elWorkTo.addEventListener('change', updateWorkPeriod);
    elWorkTo.addEventListener('input', updateWorkPeriod);
  }

  // Time Calculator Modal Triggers & Controls
  const btnOpenTimeCalc = document.getElementById('btn-open-time-calc');
  if (btnOpenTimeCalc) {
    btnOpenTimeCalc.addEventListener('click', () => openTimeCalcModal(0));
  }

  const btnTimeCalcClose = document.getElementById('btn-time-calc-close');
  if (btnTimeCalcClose) {
    btnTimeCalcClose.addEventListener('click', closeTimeCalcModal);
  }

  const btnTcClear = document.getElementById('btn-tc-clear');
  if (btnTcClear) {
    btnTcClear.addEventListener('click', clearTimeCalculator);
  }

  const btnTcApply = document.getElementById('btn-tc-apply');
  if (btnTcApply) {
    btnTcApply.addEventListener('click', applyCalculatedTimeToTask);
  }

  // Live Auto-Calculate on any Time Calc Input Change
  ['tc-d1', 'tc-h1', 'tc-m1', 'tc-s1', 'tc-d2', 'tc-h2', 'tc-m2', 'tc-s2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateTimeCalculator);
      el.addEventListener('change', updateTimeCalculator);
    }
  });

  document.querySelectorAll('input[name="tc-op"]').forEach(radio => {
    radio.addEventListener('change', updateTimeCalculator);
  });

  // Close time calculator modal when clicking backdrop
  const timeCalcModal = document.getElementById('time-calc-modal');
  if (timeCalcModal) {
    timeCalcModal.addEventListener('click', (e) => {
      if (e.target === timeCalcModal) {
        closeTimeCalcModal();
      }
    });
  }

  // Mobile View Switcher
  const toggleButtons = document.querySelectorAll('.toggle-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const view = btn.dataset.view;
      const editorSection = document.getElementById('editor-section');
      const previewSection = document.getElementById('preview-section');

      if (view === 'editor') {
        editorSection.classList.add('active');
        previewSection.classList.remove('active');
      } else {
        editorSection.classList.remove('active');
        previewSection.classList.add('active');
        fitSheetToScreen();
      }
    });
  });

  // Add Item Button
  const btnAddItem = document.getElementById('btn-add-item');
  if (btnAddItem) {
    btnAddItem.addEventListener('click', () => {
      invoiceData.items.push({
        id: Date.now(),
        task: '',
        hours: 0,
        rate: invoiceData.items.length > 0 ? invoiceData.items[0].rate : 0
      });
      renderItemRows();
      updateSummary();
      renderSheetPreview();
    });
  }

  // Save Draft Button
  const btnSaveDraft = document.getElementById('btn-save-draft');
  if (btnSaveDraft) {
    btnSaveDraft.addEventListener('click', () => {
      saveToLocalStorage(true);
      showToast('Invoice draft saved successfully to browser storage!');
    });
  }

  // Reset Button
  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all fields to default? This will clear your saved draft.')) {
        invoiceData = JSON.parse(JSON.stringify(defaultInvoiceData));
        localStorage.removeItem('dylan_invoice_data_v2');
        populateForm();
        renderSheetPreview();
        showToast('Invoice reset to default values.');
      }
    });
  }

  // Save on page exit / refresh
  window.addEventListener('beforeunload', () => {
    saveToLocalStorage(true);
  });

  // Trigger Export Preview Modal for PDF
  const btnExportPdf = document.getElementById('btn-export-pdf');
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      openExportModal('pdf');
    });
  }

  // Trigger Export Preview Modal for Excel
  const btnExportExcel = document.getElementById('btn-export-excel');
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
      openExportModal('excel');
    });
  }

  // Modal Controls
  const btnModalClose = document.getElementById('btn-modal-close');
  if (btnModalClose) {
    btnModalClose.addEventListener('click', closeExportModal);
  }

  const btnModalCancel = document.getElementById('btn-modal-cancel');
  if (btnModalCancel) {
    btnModalCancel.addEventListener('click', closeExportModal);
  }

  const btnOrientPortrait = document.getElementById('btn-orient-portrait');
  if (btnOrientPortrait) {
    btnOrientPortrait.addEventListener('click', () => setModalOrientation('portrait'));
  }

  const btnOrientLandscape = document.getElementById('btn-orient-landscape');
  if (btnOrientLandscape) {
    btnOrientLandscape.addEventListener('click', () => setModalOrientation('landscape'));
  }

  // Modal Confirm & Download Action
  const btnModalConfirm = document.getElementById('btn-modal-confirm');
  if (btnModalConfirm) {
    btnModalConfirm.addEventListener('click', async () => {
      closeExportModal();
      if (currentExportMode === 'pdf') {
        await exportToPDF(currentOrientation);
      } else {
        await exportToExcel(currentOrientation);
      }
    });
  }

  // Close modal when clicking on overlay backdrop
  const modalOverlay = document.getElementById('export-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeExportModal();
      }
    });
  }

  // Zoom Controls
  const btnZoomIn = document.getElementById('btn-zoom-in');
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      if (zoomLevel < 150) {
        zoomLevel += 10;
        updateZoom();
      }
    });
  }

  const btnZoomOut = document.getElementById('btn-zoom-out');
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      if (zoomLevel > 60) {
        zoomLevel -= 10;
        updateZoom();
      }
    });
  }

  const btnZoomFit = document.getElementById('btn-zoom-fit');
  if (btnZoomFit) {
    btnZoomFit.addEventListener('click', fitSheetToScreen);
  }

  // Window resize handler for automatic responsive scaling
  window.addEventListener('resize', () => {
    fitSheetToScreen();
  });
}

function fitSheetToScreen() {
  const container = document.getElementById('sheet-scroll-container');
  const canvasWrapper = document.getElementById('spreadsheet-canvas-wrapper');
  if (!container || !canvasWrapper) return;

  const availWidth = container.clientWidth - 16;
  const availHeight = container.clientHeight - 16;
  const baseWidth = 840;
  const baseHeight = canvasWrapper.scrollHeight || 530;

  if (availWidth <= 0 || availHeight <= 0) return;

  const scaleX = availWidth / baseWidth;
  const scaleY = availHeight / baseHeight;
  const targetScale = Math.min(1.0, Math.min(scaleX, scaleY));

  zoomLevel = Math.max(45, Math.round(targetScale * 100));
  updateZoom();
}

function updateZoom() {
  const zoomText = document.getElementById('zoom-level');
  const canvasWrapper = document.getElementById('spreadsheet-canvas-wrapper');
  if (zoomText) zoomText.textContent = `${zoomLevel}%`;
  if (canvasWrapper) canvasWrapper.style.transform = `scale(${zoomLevel / 100})`;
}

// Initial Boot
function initApp() {
  try {
    populateForm();
    renderSheetPreview();
    setupEventListeners();
    fitSheetToScreen();
  } catch (err) {
    console.error('App initialization error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
