// ==UserScript==
// @name         DidaCRM - 一键查询并复制ClientID
// @namespace    http://www.dida.com/
// @version      4.0
// @description  点击新注入的按钮，自动查询并将结果中的ClientID复制到剪贴板
// @author       Vincent
// @match        https://angrybirds.didaadmin.com/*
// @run-at       document-start
// @grant        GM_setClipboard
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 全局状态和暂存区
    window.__IS_QUERYING__ = false;
    window.__ALL_CLIENT_IDS__ = window.__ALL_CLIENT_IDS__ || new Set();

    console.log('【DidaCRM抓取脚本 v4.0】已启动，等待注入按钮...');

    // ============================
    // 1. 拦截 Fetch 请求
    // ============================
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const url = args[0] ? (typeof args[0] === 'string' ? args[0] : args[0].url) : '';

        if (url && url.includes('GetList')) {
            const clonedResponse = response.clone();
            clonedResponse.json().then(data => {
                if (window.__IS_QUERYING__) processData(data);
            }).catch(err => console.error('解析 Fetch JSON 失败', err));
        }
        return response;
    };

    // ============================
    // 2. 拦截 XMLHttpRequest (兼容 arraybuffer)
    // ============================
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url;
        return originalXhrOpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
        this.addEventListener('readystatechange', function() {
            if (this.readyState === 4 && this._url && this._url.includes('GetList')) {
                if (window.__IS_QUERYING__) {
                    try {
                        let data = null;
                        if (this.responseType === 'arraybuffer') {
                            const text = new TextDecoder('utf-8').decode(new Uint8Array(this.response));
                            data = JSON.parse(text);
                        } else if (this.responseType === '' || this.responseType === 'text') {
                            data = JSON.parse(this.responseText);
                        } else if (this.responseType === 'json') {
                            data = this.response;
                        }
                        if (data) processData(data);
                    } catch (e) {
                        console.error('解析 XHR JSON 失败', e);
                    }
                }
            }
        });
        return originalXhrSend.apply(this, args);
    };

    // ============================
    // 3. 数据处理与自动复制
    // ============================
    function processData(data) {
        window.__IS_QUERYING__ = false;
        let currentIds = [];
        let rows = Array.isArray(data) ? data : (data.items || data.rows || data.list || []);

        rows.forEach(item => {
            let id = item.clientID || item.ClientID || item.clientId || item.client_id;
            if (id) {
                currentIds.push(id);
                window.__ALL_CLIENT_IDS__.add(id);
            }
        });

        if (currentIds.length > 0) {
            console.log(`✅ 查询成功，本次获取: ${currentIds.length} 条 | 累计共: ${window.__ALL_CLIENT_IDS__.size} 条不重复 ID`);
            autoCopyToClipboard();
        } else {
            console.log('⚠️ 查询成功，但未提取到 ClientID。');
            showToast('⚠️ 未提取到 ClientID，请检查字段。', 'orange');
        }
    }

    function autoCopyToClipboard() {
        const ids = Array.from(window.__ALL_CLIENT_IDS__);
        if (ids.length === 0) return;

        const textToCopy = ids.join('\n');
        // 使用 Tampermonkey 提供的 API 复制，最稳定
        GM_setClipboard(textToCopy, 'text');

        console.log('📦 已自动复制所有 ClientID 到剪贴板！');
        showToast(`✅ 成功复制 ${ids.length} 条 ClientID 到剪贴板！`);
    }

    // ============================
    // 4. 页面 Toast 提示 (替代 alert，不打断操作)
    // ============================
    function showToast(message, color = '#52c41a') {
        let toast = document.getElementById('dida-custom-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'dida-custom-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                border-radius: 4px;
                color: white;
                font-size: 14px;
                z-index: 999999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: opacity 0.3s;
            `;
            document.body.appendChild(toast);
        }
        toast.style.backgroundColor = color;
        toast.textContent = message;
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2500);
    }

    // ============================
    // 5. 注入自定义按钮
    // ============================
    function injectCopyButton() {
        // 查找页面上原生的查询按钮
        const buttons = document.querySelectorAll('button.ant-btn, button[nz-button]');
        let queryBtn = null;

        for (let btn of buttons) {
            if (btn.textContent && btn.textContent.includes('查询') && !btn.id.includes('custom-copy')) {
                queryBtn = btn;
                break;
            }
        }

        // 如果找到了查询按钮，并且还没有注入过我们的按钮
        if (queryBtn && !document.getElementById('dida-custom-copy-btn')) {
            // 创建新按钮，复制原生按钮的样式类
            const copyBtn = document.createElement('button');
            copyBtn.id = 'dida-custom-copy-btn';
            copyBtn.className = queryBtn.className; // 继承原有的 ant-btn ant-btn-primary 等样式
            copyBtn.type = 'button';
            copyBtn.style.marginLeft = '8px'; // 和原按钮拉开距离
            copyBtn.innerHTML = '<span>查询并复制 ClientID</span>';

            // 绑定点击事件
            copyBtn.addEventListener('click', function() {
                console.log('🔍 点击了“查询并复制”，正在触发查询...');
                // 1. 清空之前的记录，确保只复制当前查询结果
                window.__ALL_CLIENT_IDS__.clear();
                // 2. 打上标记
                window.__IS_QUERYING__ = true;
                // 3. 模拟点击原生的查询按钮
                queryBtn.click();

                // 超时保护
                setTimeout(() => {
                    if(window.__IS_QUERYING__) {
                        window.__IS_QUERYING__ = false;
                        showToast('⏰ 等待接口响应超时', 'red');
                    }
                }, 5000);
            });

            // 将新按钮插入到原按钮的后面（通常是同一个父级 div 下的兄弟节点）
            queryBtn.parentNode.insertBefore(copyBtn, queryBtn.nextSibling);
            console.log('✅ 成功注入“查询并复制 ClientID”按钮！');
        }
    }

    // 页面是动态渲染的，用轮询确保按钮一直存在
    setInterval(injectCopyButton, 1000);

})();
