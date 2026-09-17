(function () {
    'use strict';

    // Pega aquí la URL de tu Web App de Google Apps Script (ver INSTRUCCIONES-GOOGLE.md)
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwNByDVMQj8wgbzzB1RT7c4Kjm4agpdW7L3r-wl-avC_VAj8xjioOeEzJkX5ct1d5fY/exec';

    // Pega aquí tu Site Key de reCAPTCHA v3 (ver INSTRUCCIONES-GOOGLE.md)
    const RECAPTCHA_SITE_KEY = '6Lf71bAtAAAAAE7QY9n4b9kk6FX4k9p6u43EIZU3';
    const RECAPTCHA_ACTION = 'registro_compra';

    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

    function cargarRecaptcha() {
        return new Promise((resolve, reject) => {
            if (window.grecaptcha) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?render=' + RECAPTCHA_SITE_KEY;
            script.onload = resolve;
            script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA.'));
            document.head.appendChild(script);
        });
    }

    function obtenerTokenRecaptcha() {
        return cargarRecaptcha().then(() => new Promise((resolve, reject) => {
            grecaptcha.ready(() => {
                grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION })
                    .then(resolve)
                    .catch(reject);
            });
        }));
    }

    if (RECAPTCHA_SITE_KEY.indexOf('PEGA_AQUI') === -1) {
        cargarRecaptcha().catch(() => {});
    }

    const form = document.getElementById('registroForm');
    const fileInput = document.getElementById('archivo');
    const fileDrop = document.getElementById('fileDrop');
    const fileDropName = document.getElementById('fileDropName');
    const messageBox = document.getElementById('formMessage');
    const submitBtn = document.getElementById('btnSubmit');
    const successBox = document.getElementById('formSuccess');

    const avisoDialog = document.getElementById('avisoPrivacidad');
    document.getElementById('abrirAviso').addEventListener('click', () => avisoDialog.showModal());
    document.getElementById('cerrarAviso').addEventListener('click', () => avisoDialog.close());

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileDropName.textContent = fileInput.files[0].name;
            fileDrop.classList.add('has-file');
        } else {
            fileDropName.textContent = '';
            fileDrop.classList.remove('has-file');
        }
    });

    function showMessage(text) {
        messageBox.textContent = text;
        messageBox.classList.add('visible', 'error');
    }

    function clearMessage() {
        messageBox.textContent = '';
        messageBox.classList.remove('visible', 'error');
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const file = fileInput.files[0];

        if (!file) {
            showMessage('Debes adjuntar tu comprobante de compra.');
            return;
        }

        if (ALLOWED_MIME_TYPES.indexOf(file.type) === -1) {
            showMessage('El comprobante debe ser una imagen JPG, PNG o un archivo PDF.');
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            showMessage('El archivo supera el tamaño máximo permitido (5MB).');
            return;
        }

        if (APPS_SCRIPT_URL.indexOf('PEGA_AQUI') !== -1) {
            showMessage('El formulario aún no está conectado con Google Sheets. Revisa INSTRUCCIONES-GOOGLE.md.');
            return;
        }

        if (RECAPTCHA_SITE_KEY.indexOf('PEGA_AQUI') !== -1) {
            showMessage('reCAPTCHA aún no está configurado. Revisa INSTRUCCIONES-GOOGLE.md.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            const [base64, recaptchaToken] = await Promise.all([
                fileToBase64(file),
                obtenerTokenRecaptcha()
            ]);

            const payload = {
                nombre: form.nombre.value.trim(),
                telefono: form.telefono.value.trim(),
                email: form.email.value.trim(),
                calle: form.calle.value.trim(),
                colonia: form.colonia.value.trim(),
                ciudad: form.ciudad.value.trim(),
                estado: form.estado.value,
                cp: form.cp.value.trim(),
                aceptaAviso: form.aceptaAviso.checked,
                recaptchaToken: recaptchaToken,
                archivo: {
                    nombre: file.name,
                    mimeType: file.type,
                    base64: base64
                }
            };

            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.ok) {
                form.hidden = true;
                successBox.classList.add('visible');
            } else {
                showMessage(result.error || 'Ocurrió un error al enviar tu registro. Intenta de nuevo.');
            }
        } catch (err) {
            showMessage('No se pudo enviar el formulario. Verifica tu conexión e intenta de nuevo.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar registro';
        }
    });
})();
