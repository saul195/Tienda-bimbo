const APP_PASSWORD = 'admin19505';
const OPEN_HOUR = 8;
const CLOSE_HOUR = 20;
const INACTIVITY_MS = 300000;

let inactivityTimer = null;

function isWithinHours() {
    const h = new Date().getHours();
    return h >= OPEN_HOUR && h < CLOSE_HOUR;
}

function showTimeError() {
    document.getElementById('loginPassword').style.display = 'none';
    document.querySelector('.login-card button').style.display = 'none';
    document.getElementById('loginSubtitle').textContent = 'Horario no disponible';
    document.getElementById('loginTimeError').style.display = 'block';
    document.getElementById('loginError').classList.remove('show');
}

function checkSession() {
    return sessionStorage.getItem('tiendabimbo_session') === '1';
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(lockApp, INACTIVITY_MS);
}

function lockApp() {
    sessionStorage.removeItem('tiendabimbo_session');
    if (typeof clearCart === 'function') clearCart();
    document.getElementById('appWrapper').classList.remove('show');
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').style.display = 'block';
    document.querySelector('.login-card button').style.display = 'block';
    document.getElementById('loginSubtitle').textContent = 'Sesión cerrada por inactividad. Ingresa la contraseña.';
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('loginTimeError').style.display = 'none';
    document.getElementById('loginPassword').focus();
}

function doLogin() {
    if (!isWithinHours()) {
        showTimeError();
        return;
    }
    const pwd = document.getElementById('loginPassword').value;
    if (pwd === APP_PASSWORD) {
        sessionStorage.setItem('tiendabimbo_session', '1');
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('appWrapper').classList.add('show');
        document.getElementById('barcodeInput')?.focus();
        document.addEventListener('mousedown', resetInactivityTimer);
        document.addEventListener('keydown', resetInactivityTimer);
        document.addEventListener('touchstart', resetInactivityTimer);
        if (typeof onAppReady === 'function') onAppReady();
    } else {
        document.getElementById('loginError').classList.add('show');
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

if (checkSession()) {
    if (!isWithinHours()) {
        sessionStorage.removeItem('tiendabimbo_session');
        showTimeError();
    } else {
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('appWrapper').classList.add('show');
        document.addEventListener('mousedown', resetInactivityTimer);
        document.addEventListener('keydown', resetInactivityTimer);
        document.addEventListener('touchstart', resetInactivityTimer);
        if (typeof onAppReady === 'function') onAppReady();
    }
}
