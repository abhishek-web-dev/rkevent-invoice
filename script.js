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
        // Enforce maximum of 15 service items on the single-page invoice
        const currentRows = document.querySelectorAll('.service-row');
        if (currentRows.length >= 15) {
            alert("Maximum 15 service items are allowed on a single-page invoice.");
            return;
        }

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

    // Main logic: Calculate inputs and update previews dynamically
    function updateCalculationsAndPreview() {
        let total = 0;
        const invoiceItems = [];
        
        // Loop through each service item row
        const rows = document.querySelectorAll('.service-row');
        
        // Apply automatic page layout compression class if service items exceed 5
        const previewContainer = document.getElementById('invoicePreview');
        if (rows.length > 5) {
            previewContainer.classList.add('compact-preview');
        } else {
            previewContainer.classList.remove('compact-preview');
        }

        rows.forEach(row => {
            const nameSelect = row.querySelector('.service-name-input');
            const customInput = row.querySelector('.service-custom-name-input');
            const qtyInput = row.querySelector('.service-qty-input');
            const rateInput = row.querySelector('.service-rate-input');
            const amountSpan = row.querySelector('.service-amount-span');
            
            let nameVal = nameSelect.value || '';
            if (nameVal === 'Other Custom Services') {
                nameVal = customInput.value.trim() || 'Custom Service';
            }
            
            const qtyVal = parseInt(qtyInput.value) || 0;
            const rateVal = parseFloat(rateInput.value) || 0;
            const rowTotal = qtyVal * rateVal;
            
            amountSpan.textContent = rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            total += rowTotal;
            
            if (nameVal) {
                invoiceItems.push({
                    name: nameVal,
                    qty: qtyVal,
                    rate: rateVal,
                    amount: rowTotal
                });
            }
        });
        
        // Fetch values
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
        document.querySelectorAll('.prev-invoice-num-sync').forEach(elem => {
            elem.textContent = invoiceNumVal;
        });
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

    // Custom Event Type Toggle logic & Dynamic first row sync
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
        
        if (!custName || !custMobile) {
            alert("Please enter customer name and mobile number first.");
            return;
        }
        
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

    // Wait helper: Returns a promise that resolves when all images inside container are loaded
    function waitImagesLoaded(container) {
        const imgs = container.querySelectorAll('img');
        const promises = Array.from(imgs).map(img => {
            if (img.complete) {
                return Promise.resolve();
            }
            return new Promise(resolve => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve); // resolve anyway on error
            });
        });
        return Promise.all(promises);
    }

    // Rebuilt PDF Generation using direct html2canvas and jsPDF page-by-page mapping
    btnGeneratePdf.addEventListener('click', function() {
        const invoiceNum = document.getElementById('invoiceNum').value;
        const page1 = document.querySelector('.invoice-page');
        const page2 = document.querySelector('.terms-page');
        const previewContainer = document.getElementById('invoicePreview');
        
        if (!page1 || !page2) {
            alert("Error: Invoice pages not found in layout.");
            return;
        }

        // Add visual loading state
        const originalText = btnGeneratePdf.innerHTML;
        btnGeneratePdf.disabled = true;
        btnGeneratePdf.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Generating PDF...`;

        // html2canvas configurations
        // Scale 2 is optimized. useCORS loads images cleanly.
        // allowTaint: true is omitted/false to avoid SecurityError during toDataURL export
        const html2canvasOpts = {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0
        };

        // Step 1: Wait for all images inside invoice preview to load
        waitImagesLoaded(previewContainer).then(() => {
            console.log("All invoice images loaded successfully. Compiling Page 1 canvas...");
            
            // Step 2: Render Page 1
            html2canvas(page1, html2canvasOpts).then(canvas1 => {
                const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
                console.log("Page 1 canvas compiled. Compiling Page 2 canvas...");

                // Step 3: Render Page 2
                html2canvas(page2, html2canvasOpts).then(canvas2 => {
                    const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
                    console.log("Page 2 canvas compiled. Instantiating jsPDF...");

                    // Fetch jsPDF class reference dynamically
                    let jsPDFClass = window.jsPDF;
                    if (window.jspdf && window.jspdf.jsPDF) {
                        jsPDFClass = window.jspdf.jsPDF;
                    }

                    if (!jsPDFClass) {
                        throw new Error("jsPDF library was not loaded on this page.");
                    }

                    // A4 Dimensions: 210mm x 297mm
                    const pdf = new jsPDFClass({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    });

                    // Add Page 1 image, fitting aspect ratio
                    const imgWidth1 = 210;
                    let imgHeight1 = (canvas1.height * imgWidth1) / canvas1.width;
                    if (imgHeight1 > 297) {
                        imgHeight1 = 297;
                    }
                    pdf.addImage(imgData1, 'JPEG', 0, 0, imgWidth1, imgHeight1);

                    // Add Page 2 image, fitting aspect ratio
                    pdf.addPage();
                    const imgWidth2 = 210;
                    let imgHeight2 = (canvas2.height * imgWidth2) / canvas2.width;
                    if (imgHeight2 > 297) {
                        imgHeight2 = 297;
                    }
                    pdf.addImage(imgData2, 'JPEG', 0, 0, imgWidth2, imgHeight2);

                    // Save the PDF file
                    pdf.save(`Invoice-${invoiceNum}.pdf`);
                    console.log("PDF generated and downloaded successfully.");

                    // Restore button
                    btnGeneratePdf.disabled = false;
                    btnGeneratePdf.innerHTML = originalText;
                }).catch(err => {
                    console.error("PDF Page 2 compilation failed: ", err);
                    alert("An error occurred while compiling PDF Page 2. See console for details.");
                    btnGeneratePdf.disabled = false;
                    btnGeneratePdf.innerHTML = originalText;
                });
            }).catch(err => {
                console.error("PDF Page 1 compilation failed: ", err);
                alert("An error occurred while compiling PDF Page 1. See console for details.");
                btnGeneratePdf.disabled = false;
                btnGeneratePdf.innerHTML = originalText;
            });
        }).catch(err => {
            console.error("Image loading wait failed: ", err);
            alert("An error occurred while waiting for invoice images to load. See console.");
            btnGeneratePdf.disabled = false;
            btnGeneratePdf.innerHTML = originalText;
        });
    });

    // Initialize on page load
    initForm();
});
