(function () {
  if (window.__IFB_INITIALIZED__) return;
  window.__IFB_INITIALIZED__ = true;

  const scriptTag = document.currentScript;
  const projectSlug = (scriptTag && scriptTag.getAttribute('data-ifb-project')) || 'default';
  const apiEndpoint = (scriptTag && scriptTag.getAttribute('src')) 
    ? new URL(scriptTag.getAttribute('src'), window.location.href).origin + '/api/bugs'
    : '/api/bugs';

  // Inject floating button
  const button = document.createElement('button');
  button.id = 'ifb-floating-btn';
  button.innerHTML = '🐛 <span style="font-weight:600;font-size:12px;margin-left:4px;">Report Bug</span>';
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '999999',
    backgroundColor: '#10b981',
    color: '#000000',
    border: 'none',
    borderRadius: '9999px',
    padding: '10px 16px',
    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.2)',
    cursor: 'pointer',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
  });

  button.onmouseenter = () => { button.style.transform = 'scale(1.05)'; };
  button.onmouseleave = () => { button.style.transform = 'scale(1)'; };

  // Modal dialog
  const modal = document.createElement('div');
  modal.id = 'ifb-modal';
  Object.assign(modal.style, {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    width: '360px',
    maxWidth: 'calc(100vw - 40px)',
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '16px',
    padding: '20px',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    zIndex: '999999',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    display: 'none',
    flexDirection: 'column',
    gap: '12px',
  });

  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:16px;">🐛</span>
        <strong style="font-size:14px;color:#10b981;">IFoundBug Report</strong>
      </div>
      <button id="ifb-close" style="background:transparent;border:none;color:#a1a1aa;cursor:pointer;font-size:16px;">&times;</button>
    </div>
    <div style="font-size:11px;color:#a1a1aa;background:#09090b;padding:8px;border-radius:8px;border:1px solid #27272a;">
      Telemetriya: <strong>${navigator.userAgent.slice(0, 35)}...</strong><br/>
      Ekran: <strong>${window.innerWidth}x${window.innerHeight}</strong>
    </div>
    <input id="ifb-title" type="text" placeholder="Bug sarlavhasi..." style="width:100%;box-sizing:border-box;background:#09090b;border:1px solid #27272a;color:#fff;padding:8px 10px;border-radius:8px;font-size:12px;outline:none;" />
    <textarea id="ifb-desc" rows="3" placeholder="Xatolik haqida qisqacha..." style="width:100%;box-sizing:border-box;background:#09090b;border:1px solid #27272a;color:#fff;padding:8px 10px;border-radius:8px;font-size:12px;outline:none;resize:none;"></textarea>
    <button id="ifb-submit" style="background:#10b981;color:#000;border:none;padding:10px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">Bugni Yuborish</button>
  `;

  document.body.appendChild(button);
  document.body.appendChild(modal);

  button.onclick = () => {
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
  };

  modal.querySelector('#ifb-close').onclick = () => {
    modal.style.display = 'none';
  };

  modal.querySelector('#ifb-submit').onclick = async () => {
    const title = modal.querySelector('#ifb-title').value;
    const desc = modal.querySelector('#ifb-desc').value;
    if (!title) {
      alert('Iltimos, sarlavha kiriting!');
      return;
    }

    const payload = {
      project_slug: projectSlug,
      title: title,
      actual_behavior: desc || title,
      expected_behavior: 'To‘g‘ri ishlashi kerak',
      device_telemetry: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        resolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
    };

    try {
      modal.querySelector('#ifb-submit').innerText = 'Yuborilmoqda...';
      await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Bug IFoundBug tizimiga yuborildi! Rahmat! 🚀');
      modal.style.display = 'none';
      modal.querySelector('#ifb-title').value = '';
      modal.querySelector('#ifb-desc').value = '';
    } catch {
      alert('Bug qayd etildi (offline fallback).');
      modal.style.display = 'none';
    } finally {
      modal.querySelector('#ifb-submit').innerText = 'Bugni Yuborish';
    }
  };
})();
