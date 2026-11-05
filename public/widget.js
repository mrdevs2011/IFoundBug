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
  button.innerHTML = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7h8a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3a4 4 0 0 1 4-4Z"/><path d="M12 7V4m-4 3L6 5m10 2 2-2M4 11H2m20 0h-2"/></svg><span style="font-weight:600;font-size:12px;margin-left:6px;">Report issue</span>';
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '999999',
    backgroundColor: '#238636',
    color: '#ffffff',
    border: '1px solid #3fb950',
    borderRadius: '6px',
    padding: '9px 13px',
    boxShadow: 'none',
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
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '8px',
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
        <span aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3fb950" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7h8a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3a4 4 0 0 1 4-4Z"/><path d="M12 7V4m-4 3L6 5m10 2 2-2"/></svg></span>
        <strong style="font-size:14px;color:#3fb950;">IFoundBug Report</strong>
      </div>
      <button id="ifb-close" aria-label="Close" style="background:transparent;border:1px solid #30363d;color:#a1a1aa;cursor:pointer;width:28px;height:28px;display:grid;place-items:center;border-radius:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m18 6-12 12M6 6l12 12"/></svg></button>
    </div>
    <div style="font-size:11px;color:#a1a1aa;background:#161b22;padding:8px;border-radius:6px;border:1px solid #30363d;">
      Device: <strong>${navigator.userAgent.slice(0, 35)}...</strong><br/>
      Screen: <strong>${window.innerWidth}x${window.innerHeight}</strong>
    </div>
    <input id="ifb-title" type="text" placeholder="Issue title…" style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #30363d;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;outline:none;" />
    <textarea id="ifb-desc" rows="3" placeholder="Describe the issue…" style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #30363d;color:#e6edf3;padding:8px 10px;border-radius:6px;font-size:12px;outline:none;resize:none;"></textarea>
    <button id="ifb-submit" style="background:#238636;color:#fff;border:1px solid #3fb950;padding:10px;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;">Submit issue</button>
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
      alert('Please enter an issue title.');
      return;
    }

    const payload = {
      project_slug: projectSlug,
      title: title,
      actual_behavior: desc || title,
      expected_behavior: 'Expected behavior',
      device_telemetry: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        resolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
    };

    try {
      modal.querySelector('#ifb-submit').innerText = 'Submitting…';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Issue submission failed');
      alert('Issue submitted to IFoundBug. Thank you!');
      modal.style.display = 'none';
      modal.querySelector('#ifb-title').value = '';
      modal.querySelector('#ifb-desc').value = '';
    } catch {
      alert('Could not submit the issue. Check your connection and try again.');
      modal.style.display = 'none';
    } finally {
      modal.querySelector('#ifb-submit').innerText = 'Submit issue';
    }
  };
})();
