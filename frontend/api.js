// api.js - shared helper functions used by EVERY page.
// It handles: the login token, calling the API, the left menu, and small display helpers.

var API_URL = '/api/v1';

// ---------------------------------------------------------------
// 1. Login information (saved in the browser's localStorage)
// ---------------------------------------------------------------
function getToken() {
    return localStorage.getItem('sc_token');
}

function getUser() {
    var text = localStorage.getItem('sc_user');
    if (!text) {
        return null;
    }
    return JSON.parse(text);
}

function saveLogin(data) {
    localStorage.setItem('sc_token', data.token);
    localStorage.setItem('sc_user', JSON.stringify(data.user));
}

function clearLogin() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
}

// ---------------------------------------------------------------
// 2. Calling the API
//    Example: var result = await callApi('/seats');
//             var result = await callApi('/seats', 'POST', { label: 'Desk 9' });
//    Returns the JSON answer. If something is wrong it throws an Error with the message.
// ---------------------------------------------------------------
async function callApi(path, method, body) {
    if (!method) method = 'GET';

    var headers = { 'Content-Type': 'application/json' };
    var token = getToken();
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;   // proves who we are
    }

    var options = { method: method, headers: headers };
    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    var response;
    try {
        response = await fetch(API_URL + path, options);
    } catch (error) {
        throw new Error('Cannot reach the server. Is it running?');
    }

    var json = null;
    try {
        json = await response.json();
    } catch (error) {
        json = null;
    }

    // 401 = our login is no longer valid, so go back to the login page.
    if (response.status === 401 && location.pathname.indexOf('login.html') === -1) {
        clearLogin();
        location.replace('login.html?expired=1');
        throw new Error('Your session ended. Please log in again.');
    }

    if (!response.ok || !json || json.success === false) {
        var message = 'Something went wrong.';
        if (json && json.error && json.error.message) {
            message = json.error.message;
        }
        throw new Error(message);
    }

    return json;
}

// ---------------------------------------------------------------
// 3. Small display helpers
// ---------------------------------------------------------------

// Makes text safe to put inside HTML (stops people from injecting code).
function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatMoney(amount) {
    var number = Number(amount || 0);
    return '\u20B1' + number.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(amount) {
    return Number(amount || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 });
}

// Date and time like "Nov 8, 2026, 2:00 PM"
function formatDate(value) {
    if (!value) {
        return '-';
    }
    return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

// Only the date part, like "2026-11-08"
function formatDateOnly(value) {
    if (!value) {
        return '-';
    }
    return String(value).slice(0, 10);
}

// Turns a Date into the text that <input type="datetime-local"> needs.
function dateToInput(date) {
    var shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 16);
}

// Turns the value of a datetime-local input into the UTC text our API expects.
function inputToIso(text) {
    return new Date(text).toISOString();
}

// Finds one item in a list by its id. Returns null when not found.
function findById(list, keyName, id) {
    for (var i = 0; i < list.length; i++) {
        if (String(list[i][keyName]) === String(id)) {
            return list[i];
        }
    }
    return null;
}

// A small colored label, like "Available" (green) or "NoShow" (red).
function badge(text) {
    var colors = {
        Available: 'green', Confirmed: 'blue', CheckedIn: 'amber', Completed: 'green',
        Cancelled: 'grey', NoShow: 'red', Occupied: 'amber', Maintenance: 'red',
        Open: 'red', Acknowledged: 'amber', Resolved: 'green', Active: 'amber',
        Paid: 'green', Voided: 'red', Pending: 'amber', Served: 'green',
        Admin: 'blue', Staff: 'amber', Member: 'grey',
        Overstay: 'amber', Capacity: 'red', LowStock: 'blue'
    };
    var color = colors[text];
    if (!color) {
        color = 'grey';
    }
    return '<span class="badge b-' + color + '">' + escapeHtml(text) + '</span>';
}

// A small message that appears in the corner for a few seconds.
function showMessage(message, isError) {
    var box = document.createElement('div');
    box.className = 'toast';
    if (isError) {
        box.className = 'toast err';
    }
    box.textContent = message;
    document.body.appendChild(box);

    var seconds = 2800;
    if (isError) seconds = 5000;
    setTimeout(function () {
        box.remove();
    }, seconds);
}

// "Loading..." banner at the top of the page.
function showLoading() {
    document.getElementById('banner').innerHTML = '<div class="banner loading">Loading...</div>';
}

function hideBanner() {
    document.getElementById('banner').innerHTML = '';
}

// Red error banner at the top of the page.
function showError(message) {
    document.getElementById('banner').innerHTML = '<div class="banner error">' + escapeHtml(message) + '</div>';
}

// A text version of the bill, used by the check-out and billing screens.
function billText(bill) {
    var lines = [];
    lines.push(bill.zone_name + ': ' + formatNumber(bill.session_hours) + ' h booked at ' + formatMoney(bill.hourly_rate) + '/h');

    var passLine = 'Pass hours used: ' + formatNumber(bill.pass_hours_used) + ' h = ' + formatMoney(bill.pass_amount);
    if (bill.pass_allowed === false) {
        passLine = passLine + '  (Game Station is always cash)';
    }
    lines.push(passLine);

    lines.push('Cash hours: ' + formatNumber(bill.cash_hours) + ' h = ' + formatMoney(bill.cash_seat_amount));
    lines.push('Peak surcharge (' + formatNumber(bill.peak_hours) + ' h in 4-8 PM): ' + formatMoney(bill.peak_surcharge));
    lines.push('Overtime (' + bill.overtime_blocks + ' x 30 min): ' + formatMoney(bill.overtime_amount));
    lines.push('Food and drinks: ' + formatMoney(bill.orders_total));
    lines.push('------------------------------');
    lines.push('Cash to collect: ' + formatMoney(bill.cash_amount));
    lines.push('Paid with pass:  ' + formatMoney(bill.pass_amount));
    lines.push('TOTAL: ' + formatMoney(bill.total_amount));
    return lines.join('\n');
}

// ---------------------------------------------------------------
// 4. The left menu and the page start
// ---------------------------------------------------------------

// Every page in the menu: [file name, label, roles that may open it]
var MENU_PAGES = [
    ['dashboard.html', 'Dashboard', ['Admin', 'Staff']],
    ['reservations.html', 'Reservations', ['Admin', 'Staff', 'Member']],
    ['orders.html', 'Order Entry', ['Admin', 'Staff']],
    ['seats.html', 'Seats', ['Admin', 'Staff', 'Member']],
    ['zones.html', 'Study Zones', ['Admin', 'Staff', 'Member']],
    ['menu.html', 'Menu', ['Admin', 'Staff', 'Member']],
    ['pass_packages.html', 'Pass Packages', ['Admin', 'Staff', 'Member']],
    ['member_passes.html', 'Member Passes', ['Admin', 'Staff', 'Member']],
    ['payments.html', 'Payments & Billing', ['Admin', 'Staff']],
    ['alerts.html', 'Alerts & Engine', ['Admin', 'Staff']],
    ['audit_logs.html', 'Audit & Sessions', ['Admin', 'Staff']],
    ['reviews.html', 'Reviews', ['Admin', 'Staff', 'Member']],
    ['reports.html', 'Join Reports', ['Admin', 'Staff']],
    ['users.html', 'Users', ['Admin']]
];

// Small icon shown in front of each menu item.
var MENU_ICONS = {
    'dashboard.html': '&#9638;',
    'reservations.html': '&#9719;',
    'orders.html': '&#9998;',
    'seats.html': '&#9635;',
    'zones.html': '&#8962;',
    'menu.html': '&#9749;',
    'pass_packages.html': '&#9636;',
    'member_passes.html': '&#9672;',
    'payments.html': '&#8369;',
    'alerts.html': '&#9888;',
    'audit_logs.html': '&#9776;',
    'reviews.html': '&#9733;',
    'reports.html': '&#128202;',
    'users.html': '&#9817;'
};

// Where to go after login.
function homePageFor(user) {
    if (user.role === 'Member') {
        return 'reservations.html';
    }
    return 'dashboard.html';
}

async function logout() {
    try {
        await callApi('/auth/logout', 'POST');
    } catch (error) {
        // even if this fails we still log out on this computer
    }
    clearLogin();
    location.replace('login.html');
}

// Call this first on every page:   var user = startPage('zones.html');
// It checks the login, builds the left menu and the top-right user box.
// It returns the logged-in user, or null if the page must not continue.
function startPage(pageFile) {
    var user = getUser();

    if (!getToken() || !user) {
        location.replace('login.html');
        return null;
    }

    // Build the menu with only the pages this role may open.
    var menuHtml = '<div class="logo"><span class="logo-icon">&#9749;</span> <span class="logo-text">STUDY CAF&Eacute;</span></div>' +
        '<div class="nav-label">MAIN MENU</div><nav class="nav-links">';
    var allowed = true;

    for (var i = 0; i < MENU_PAGES.length; i++) {
        var page = MENU_PAGES[i];
        var roleAllowed = page[2].indexOf(user.role) !== -1;

        if (page[0] === pageFile && roleAllowed === false) {
            allowed = false;
        }
        if (roleAllowed) {
            var activeClass = '';
            if (page[0] === pageFile) activeClass = 'active';
            var icon = MENU_ICONS[page[0]] || '&#9679;';
            menuHtml = menuHtml + '<a href="' + page[0] + '" class="' + activeClass + '">' +
                '<span class="nav-icon">' + icon + '</span><span class="nav-text">' + page[1] + '</span></a>';
        }
    }
    menuHtml = menuHtml + '</nav>' +
        '<div class="sidebar-bottom"><nav class="nav-links"><a href="#" title="Logout" onclick="logout(); return false;">' +
        '<span class="nav-icon">&#8677;</span><span class="nav-text">Logout</span></a></nav></div>';

    document.getElementById('menu').innerHTML = menuHtml;
    document.getElementById('who').innerHTML =
        '<div class="profile"><div class="profile-avatar">' + escapeHtml(String(user.name || '?').charAt(0).toUpperCase()) + '</div>' +
        '<div class="profile-info"><strong>' + escapeHtml(user.name) + '</strong><span>' + escapeHtml(user.role) + '</span></div></div>';

    if (allowed === false) {
        document.getElementById('content').innerHTML = '<div class="card">You do not have access to this page.</div>';
        return null;
    }

    return user;
}
