// JavaScript for RK Event Jhansi Invoice Generator

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const form = document.getElementById('invoiceForm');
    const servicesContainer = document.getElementById('servicesContainer');
    const addServiceBtn = document.getElementById('addServiceBtn');
    
    // Live Preview Elements
    const prevCustName = document.getElementById('prev-cust-name');
    const prevCustMobile = document.getElementById('prev-cust-mobile');
    const prevCustAddress = document.getElementById('prev-cust-address');
    
    const prevEventType = document.getElementById('prev-event-type');
    const prevEventDate = document.getElementById('prev-event-date');
    const prevEventLocation = document.getElementById('prev-event-location');
    
    const prevInvoiceNum = document.getElementById('prev-invoice-num');
    const prevInvoiceDate = document.getElementById('prev-invoice-date');
    const prevInvoiceStatus = document.getElementById('prev-invoice-status');
    
    const prevItemsBody = document.getElementById('prev-items-body');
    const prevTotalAmount = document.getElementById('prev-total-amount');
    const prevAdvancePaid = document.getElementById('prev-advance-paid');
    const prevBalanceDue = document.getElementById('prev-balance-due');
    const balanceDueRow = document.getElementById('balance-due-row');
    
    // Action Buttons
    const btnGeneratePdf = document.getElementById('btnGeneratePdf');
    const btnPrint = document.getElementById('btnPrint');
    const btnWhatsApp = document.getElementById('btnWhatsApp');
    const btnReset = document.getElementById('btnReset');

    // List of pre-defined event services
    const businessServices = [
        "Wedding Shoot",
        "Pre Wedding Shoot",
        "Birthday Shoot",
        "Event Planning",
        "Decoration",
        "Photography",
        "Videography",
        "Drone Shoot",
        "Album Design",
        "Other Custom Services"
    ];

    // Helper: Generate Invoice ID (RKE-YYYYMMDD-HHMMSS)
    function generateInvoiceNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `RKE-${year}${month}${date}-${hours}${minutes}${seconds}`;
    }

    // Helper: Format Date for Display (DD-MM-YYYY)
    function formatDateDisplay(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    }

    // Initial Setup
    function initForm() {
        document.getElementById('invoiceNum').value = generateInvoiceNumber();
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = today;
        
        // Clear services container & add first empty service row
        servicesContainer.innerHTML = '';
        addServiceRow('', 1, 0);
        
        updateCalculationsAndPreview();
    }

    // Add dynamic service item row
    function addServiceRow(name = '', qty = 1, rate = 0) {
        const rowId = 'row-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const isCustom = name && !businessServices.includes(name);
        const rowHTML = `
            <tr id="${rowId}" class="service-row">
                <td>
                    <select class="form-select service-name-input" required>
                        <option value="" disabled ${!name ? 'selected' : ''}>Choose Service...</option>
                        ${businessServices.map(s => `<option value="${s}" ${name === s || (s === 'Other Custom Services' && isCustom) ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                    <input type="text" class="form-control mt-1 service-custom-name-input ${isCustom ? '' : 'd-none'}" placeholder="Enter custom service name" value="${isCustom ? name : ''}">
                </td>
                <td style="width: 100px;">
                    <input type="number" class="form-control text-center service-qty-input" min="1" value="${qty}" required>
                </td>
                <td style="width: 150px;">
                    <div class="input-group">
                        <span class="input-group-text">₹</span>
                        <input type="number" class="form-control text-end service-rate-input" min="0" value="${rate}" required>
                    </div>
                </td>
                <td style="width: 160px;" class="text-end fw-bold align-middle">
                    ₹<span class="service-amount-span">0.00</span>
                </td>
                <td style="width: 50px;" class="text-center">
                    <button type="button" class="btn-remove-item" title="Remove Item">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
        servicesContainer.insertAdjacentHTML('beforeend', rowHTML);
        
        const newRow = document.getElementById(rowId);
        const nameSelect = newRow.querySelector('.service-name-input');
        const customInput = newRow.querySelector('.service-custom-name-input');
        
        // Attach change listeners to this new row
        nameSelect.addEventListener('change', function() {
            if (this.value === 'Other Custom Services') {
                customInput.classList.remove('d-none');
                customInput.setAttribute('required', 'required');
                customInput.focus();
            } else {
                customInput.classList.add('d-none');
                customInput.removeAttribute('required');
                customInput.value = '';
            }
            updateCalculationsAndPreview();
        });
        
        customInput.addEventListener('input', updateCalculationsAndPreview);
        newRow.querySelector('.service-qty-input').addEventListener('input', updateCalculationsAndPreview);
        newRow.querySelector('.service-rate-input').addEventListener('input', updateCalculationsAndPreview);
        newRow.querySelector('.btn-remove-item').addEventListener('click', function() {
            newRow.remove();
            // Ensure at least one row remains
            if (document.querySelectorAll('.service-row').length === 0) {
                addServiceRow();
            }
            updateCalculationsAndPreview();
        });
        
        updateCalculationsAndPreview();
    }

    // Calculations & Live Preview Update
    function updateCalculationsAndPreview() {
        let total = 0;
        
        // Read service rows and calculate item amounts
        const serviceRows = document.querySelectorAll('.service-row');
        const invoiceItems = [];
        
        serviceRows.forEach(row => {
            const selectElem = row.querySelector('.service-name-input');
            const customInputElem = row.querySelector('.service-custom-name-input');
            let name = selectElem.value;
            if (name === 'Other Custom Services') {
                name = (customInputElem && customInputElem.value.trim()) ? customInputElem.value.trim() : 'Other Custom Service';
            }
            const qty = parseFloat(row.querySelector('.service-qty-input').value) || 0;
            const rate = parseFloat(row.querySelector('.service-rate-input').value) || 0;
            const amount = qty * rate;
            
            row.querySelector('.service-amount-span').textContent = amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            total += amount;
            
            if (selectElem.value) {
                invoiceItems.push({ name, qty, rate, amount });
            }
        });
        
        // Update payments values
        const advance = parseFloat(document.getElementById('advancePaid').value) || 0;
        const balance = total - advance;
        
        document.getElementById('totalAmount').value = total.toFixed(2);
        document.getElementById('balanceDue').value = balance.toFixed(2);
        
        // Update Preview Panel Info
        const custNameVal = document.getElementById('custName').value || 'Customer Name';
        const custMobileVal = document.getElementById('custMobile').value || 'Mobile Number';
        const custAddressVal = document.getElementById('custAddress').value || 'Customer Address';
        
        prevCustName.textContent = custNameVal;
        prevCustMobile.textContent = custMobileVal;
        prevCustAddress.textContent = custAddressVal;
        
        const eventTypeSelect = document.getElementById('eventType');
        const customEventTypeInput = document.getElementById('customEventType');
        let eventTypeVal = eventTypeSelect.value || 'Not Selected';
        if (eventTypeVal === 'Other Custom Services') {
            eventTypeVal = (customEventTypeInput && customEventTypeInput.value.trim()) ? customEventTypeInput.value.trim() : 'Other Custom Service';
        }
        prevEventType.textContent = eventTypeVal;
        prevEventDate.textContent = formatDateDisplay(document.getElementById('eventDate').value) || 'Not Set';
        prevEventLocation.textContent = document.getElementById('eventLocation').value || 'Not Set';
        
        const invoiceNumVal = document.getElementById('invoiceNum').value;
        prevInvoiceNum.textContent = invoiceNumVal;
        prevInvoiceDate.textContent = formatDateDisplay(document.getElementById('invoiceDate').value);
        
        // Status Badge Style Sync
        const statusVal = document.getElementById('status').value;
        prevInvoiceStatus.textContent = statusVal;
        prevInvoiceStatus.className = 'status-badge';
        if (statusVal === 'Paid') {
            prevInvoiceStatus.classList.add('status-paid');
        } else if (statusVal === 'Partial Paid') {
            prevInvoiceStatus.classList.add('status-partial');
        } else {
            prevInvoiceStatus.classList.add('status-pending');
        }
        
        // Render items in preview table
        prevItemsBody.innerHTML = '';
        if (invoiceItems.length === 0) {
            prevItemsBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No services added yet</td></tr>`;
        } else {
            invoiceItems.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.name}</td>
                    <td class="text-center">${item.qty}</td>
                    <td class="text-right">₹${item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-right">₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                `;
                prevItemsBody.appendChild(tr);
            });
        }
        
        // Totals display update
        prevTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        prevAdvancePaid.textContent = '₹' + advance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        prevBalanceDue.textContent = '₹' + balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        if (balance <= 0 && total > 0) {
            balanceDueRow.className = 'summary-line balance-due paid';
        } else {
            balanceDueRow.className = 'summary-line balance-due';
        }
        
        // Update QR Code
        updateQRCode(invoiceNumVal, balance);
    }

    // Dynamic UPI QR code compiler
    function updateQRCode(invoiceNum, balance) {
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        
        // UPI URI Schema
        // pa = payee VPA, pn = payee name, am = transaction amount, tn = note/remarks, cu = currency
        // Let's enforce balance amount as payment target if balance > 0, otherwise default to 0
        const payAmount = balance > 0 ? balance.toFixed(2) : '0.00';
        const upiString = `upi://pay?pa=9169659965-5@ybl&pn=RK%20Event%20Jhansi&am=${payAmount}&cu=INR&tn=Invoice%20${invoiceNum}`;
        
        new QRCode(qrContainer, {
            text: upiString,
            width: 80,
            height: 80,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    // Event Listeners on basic input fields
    const liveFields = [
        'custName', 'custMobile', 'custAddress', 
        'eventType', 'eventDate', 'eventLocation',
        'invoiceDate', 'status', 'advancePaid'
    ];
    
    liveFields.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener('input', updateCalculationsAndPreview);
            elem.addEventListener('change', updateCalculationsAndPreview);
        }
    });

    // Custom Event Type Toggle logic
    const eventTypeSelect = document.getElementById('eventType');
    const customEventTypeContainer = document.getElementById('customEventTypeContainer');
    const customEventTypeInput = document.getElementById('customEventType');
    
    if (eventTypeSelect && customEventTypeContainer && customEventTypeInput) {
        eventTypeSelect.addEventListener('change', function() {
            const firstRow = document.querySelector('.service-row');
            if (this.value === 'Other Custom Services') {
                customEventTypeContainer.classList.remove('d-none');
                customEventTypeInput.setAttribute('required', 'required');
                customEventTypeInput.focus();
                
                // Mirror to first row
                if (firstRow) {
                    const selectElem = firstRow.querySelector('.service-name-input');
                    const customInputElem = firstRow.querySelector('.service-custom-name-input');
                    selectElem.value = 'Other Custom Services';
                    customInputElem.classList.remove('d-none');
                    customInputElem.setAttribute('required', 'required');
                    customInputElem.value = customEventTypeInput.value;
                }
            } else {
                customEventTypeContainer.classList.add('d-none');
                customEventTypeInput.removeAttribute('required');
                customEventTypeInput.value = '';
                
                // Mirror standard event type to first row
                if (firstRow) {
                    const selectElem = firstRow.querySelector('.service-name-input');
                    const customInputElem = firstRow.querySelector('.service-custom-name-input');
                    selectElem.value = this.value;
                    customInputElem.classList.add('d-none');
                    customInputElem.removeAttribute('required');
                    customInputElem.value = '';
                }
            }
            updateCalculationsAndPreview();
        });
        
        customEventTypeInput.addEventListener('input', function() {
            const firstRow = document.querySelector('.service-row');
            if (firstRow) {
                const selectElem = firstRow.querySelector('.service-name-input');
                const customInputElem = firstRow.querySelector('.service-custom-name-input');
                if (selectElem.value === 'Other Custom Services') {
                    customInputElem.value = this.value;
                }
            }
            updateCalculationsAndPreview();
        });
    }

    // Add dynamic row button click
    addServiceBtn.addEventListener('click', function() {
        addServiceRow();
    });

    // Form Reset logic
    btnReset.addEventListener('click', function() {
        if (confirm("Are you sure you want to reset the invoice? This will clear all input fields.")) {
            form.reset();
            if (customEventTypeContainer) {
                customEventTypeContainer.classList.add('d-none');
                customEventTypeInput.removeAttribute('required');
            }
            initForm();
        }
    });

    // Share Invoice details on WhatsApp
    btnWhatsApp.addEventListener('click', function() {
        const custName = document.getElementById('custName').value.trim();
        const custMobile = document.getElementById('custMobile').value.trim();
        const invoiceNum = document.getElementById('invoiceNum').value;
        const total = parseFloat(document.getElementById('totalAmount').value) || 0;
        const advance = parseFloat(document.getElementById('advancePaid').value) || 0;
        const balance = total - advance;

        if (!custName) {
            alert("Please enter the Customer Name to share.");
            document.getElementById('custName').focus();
            return;
        }
        
        if (!custMobile) {
            alert("Please enter the Customer's Mobile Number to send via WhatsApp.");
            document.getElementById('custMobile').focus();
            return;
        }

        // WhatsApp pre-formatted string composition
        const message = `Hello ${custName},\n\nThank you for choosing RK Event Jhansi.\n\nInvoice No: ${invoiceNum}\nTotal Amount: ₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nAdvance Paid: ₹${advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nBalance Due: ₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nPlease find your invoice attached.\n\nWarm regards,\nRK Event Jhansi`;
        
        // Clean mobile number (only keep digits)
        let cleanedPhone = custMobile.replace(/\D/g, '');
        // If it is a 10 digit Indian number, append prefix 91
        if (cleanedPhone.length === 10) {
            cleanedPhone = '91' + cleanedPhone;
        }
        
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    });

    // Print invoice logic
    btnPrint.addEventListener('click', function() {
        window.print();
    });

    // Export PDF using html2pdf.js
    btnGeneratePdf.addEventListener('click', function() {
        const invoiceNum = document.getElementById('invoiceNum').value;
        const element = document.getElementById('invoicePreview');
        
        // Optimize pdf output configuration
        const opt = {
            margin:       [0, 0, 0, 0],
            filename:     `Invoice-${invoiceNum}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                logging: false,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF:        { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            }
        };

        // Add visual loading state
        const originalText = btnGeneratePdf.innerHTML;
        btnGeneratePdf.disabled = true;
        btnGeneratePdf.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Generating...`;

        html2pdf().set(opt).from(element).save()
            .then(() => {
                btnGeneratePdf.disabled = false;
                btnGeneratePdf.innerHTML = originalText;
            })
            .catch(err => {
                console.error("PDF generation error: ", err);
                alert("An error occurred while generating the PDF. Please try again.");
                btnGeneratePdf.disabled = false;
                btnGeneratePdf.innerHTML = originalText;
            });
    });

    // Initialize on page load
    initForm();
});
