// ==UserScript==
// @name Dida-Dolphin/Snake 跳过确认
// @match https://dolphin-v2.didaadmin.com/*
// @match https://snake.didaadmin.com/*
// @grant none
// ==/UserScript==

(function() {
  const BATCH_EXPECTED = '我已知悉批量操作的影响并且确认执行';

  const observer = new MutationObserver(() => {
    const modals = document.querySelectorAll(
      'div[role="dialog"], .arco-modal, div[class*="modal"], div[class*="Modal"]'
    );

    let targetModal = null;
    for (const m of modals) {
      if (!m.dataset.autoConfirmed) {
        const text = m.textContent;
        // 只匹配我们明确要处理的两种弹窗
        if (text.includes('操作提醒') || text.includes('通常情况下，告警单应由系统在接收到恢复类告警后自动关闭')) {
          targetModal = m;
          break;
        }
      }
    }

    if (!targetModal) return;

    const text = targetModal.textContent;

    // --- Dolphin 批量操作：需要填字 ---
    if (text.includes(BATCH_EXPECTED)) {
      const input = targetModal.querySelector('input[type="text"], input[placeholder*="请输入"], .arco-input input');
      if (input && input.value !== BATCH_EXPECTED) {
        input.value = BATCH_EXPECTED;
        ['input', 'change', 'focus', 'blur'].forEach(evt =>
          input.dispatchEvent(new Event(evt, { bubbles: true }))
        );
        input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: BATCH_EXPECTED }));
      }
    }

    // --- 点确认按钮 ---
    const buttons = targetModal.querySelectorAll('button, [role="button"]');
    for (const btn of buttons) {
      const label = btn.textContent.trim();
      if ((label === '确定' || label === '确认' || label === 'OK') && !btn.disabled) {
        requestAnimationFrame(() => btn.click());
        targetModal.dataset.autoConfirmed = '1';
        return;
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
})();
