# Invoice Studio v2.0 - Excel-Formatted Invoice Builder

An intelligent, interactive invoice generation web application that produces spreadsheet-formatted invoices and exports to pixel-perfect **Excel (.xlsx)** and high-resolution **PDF**.

---

## ✨ Features

- **Live Spreadsheet Canvas**: Real-time rendering matching Excel and Google Sheets layout, with crisp navy headers, cream client box, and green grand totals.
- **Accurate Time Calculation (Single-Pass Engine)**:
  - Format conversions (e.g. `20.10` / `20.1` $\rightarrow$ `20.17` hrs, `20.51` $\rightarrow$ `20.85` hrs, `25.36` $\rightarrow$ `25.60` hrs).
  - Direct calculation button on each row (`🧮`) with zero popups or confirmations.
  - Multi-task real-time simultaneous calculation across all line items.
- **Pristine Export Capabilities**:
  - **Excel (.xlsx)**: Exported via ExcelJS with exact fonts, fills, borders, column widths, and live formulas (`=E15*F15`, `=SUM(...)`).
  - **High-Resolution PDF**: Clean vector rendering with centered A4 Portrait & Landscape print setup.
- **Single-Screen Zero-Scroll Viewport**: Clean layout optimized to fit the entire interface on screen with 2D auto-scaling.
- **Real-Time Auto-Save & Refresh Protection**: Automatically preserves draft data in browser `localStorage` on every keystroke.

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Edge, Firefox, Safari)
- PowerShell (on Windows) or any local static web server

### Running Locally
Run the built-in local server:
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```
Open **`http://localhost:5500/`** in your browser.

---

## 📁 Project Structure

- `index.html` - Application structure and semantic UI layout
- `style.css` - Modern responsive design system, typography, and spreadsheet grid styles
- `app.js` - Time calculation engine, ExcelJS/PDF export pipelines, and auto-save persistence
- `server.ps1` - Lightweight local HTTP server
