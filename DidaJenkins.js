// ==UserScript==
// @name         Dida Jenkins
// @namespace    http://www.didatravel.com/
// @version      2024-12-19
// @description  try to take over the world!
// @author       vincent@didatravel.com
// @match        http://192.168.0.86:8080/job/DidaNuGetV2/
// @match        http://192.168.0.86:8080/view/DidaNuGetV2/job/DidaNuGetV2/

// @match        http://192.168.0.86:8080/job/DidaNuGetV2Single/
// @match        http://192.168.0.86:8080/view/DidaNuGetV2/job/DidaNuGetV2Single/

// @match        http://192.168.0.86:8080/job/DidaNuGetV2/*/parameters/
// @match        http://192.168.0.86:8080/view/DidaNuGetV2/job/DidaNuGetV2/*/parameters/
// @match        http://192.168.0.86:8080/view/DidaNuGetV2/job/DidaNuGetV2Single/*/parameters/

// @match        http://192.168.0.86:8080/job/DidaNuGetV2Single/*/parameters/
// @match        http://192.168.0.86:8080/view/DidaNuGetV2Single/job/DidaNuGetV2Single/*/parameters/

// @match        http://192.168.0.86:8080/*/configure
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
	'use strict';

	if (window.location.href.includes('DidaNuGetV2') || window.location.href.includes('DidaNuGet')) {
		window.onload = function () {
			// 初始执行一次，setInterval 得delay后才执行
			RefreshData();
			// 60s 更新一次
			window.setInterval(RefreshData, 60000);
		};
	}
    else if(window.location.href.includes('configure')){
        FixJobExecuteWindwsBatchCommand()
    }

    //以下代码是针对 DidaNuGetV2 的 Build 的
	function RefreshData() {
		const viewPanel = GetViewPanel();

		// 清空div
		viewPanel.innerHTML = `<div>上次刷新时间：${new Date()}</div>`;

		//这一部分是针对那些 pending build 的
		const paramsElements = document.querySelectorAll('div[tooltip*="Build Parameters"]');
		paramsElements.forEach(function (element) {
			var trNode = element.parentNode.parentNode;
			const number = trNode.textContent.replace("Cancel","");
			// 获取Base64字符串
			const base64String = element.getAttribute('tooltip').split('RebuildParameter=')[1];
			if (base64String) {
				// 解码Base64字符串
				const decodedString = atob(base64String);
				// 创建显示解码字符串的元素
				const decodedElement = document.createElement('div');
				const data = JSON.parse(decodedString);
				const link = `<a target="_blank" href="https://dolphin.didaadmin.com/Deploy/Task/Robot/${data.TaskID}">${data.TaskID}</a>`;
				var newstring = decodedString.replace(`"TaskID":${data.TaskID}`, `"TaskID":${link}`);;
				decodedElement.innerHTML = `${number}  Decoded Parameters: ${newstring}`;
				// 将解码后的字符串插入到main-panel div中
				viewPanel.appendChild(decodedElement);
			}
		});

		const hr = document.createElement('hr');
		viewPanel.appendChild(hr);

		//这一部分是针对那些已经 build 了的
		const buildedElements = document.querySelectorAll('a[class*="app-builds-container__item__inner__link"]');
		const decodedElementsArray = [];
		let requestCount = buildedElements.length;
		buildedElements.forEach(function (element) {
			const url = element.href + 'parameters/';
			GM_xmlhttpRequest({
				method: "GET",
				url: url,
				onload: function (response) {
					var html = response.responseText;
					var base64String = getInputValue(html);
					if (base64String) {
						const decodedString = atob(base64String);
						const decodedElement = document.createElement('div');
						const data = JSON.parse(decodedString);
						const link = `<a target="_blank" href="https://dolphin.didaadmin.com/Deploy/Task/Robot/${data.TaskID}">${data.TaskID}</a>`;
						var newstring = decodedString.replace(`"TaskID":${data.TaskID}`, `"TaskID":${link}`);;
						decodedElement.innerHTML = `${element.textContent}  Decoded Parameters: ${newstring}`;
						decodedElementsArray.push(decodedElement);
						requestCount--;
						if (requestCount === 0) {
							decodedElementsArray.sort((a, b) => {
								return b.textContent.localeCompare(a.textContent);
							});
							decodedElementsArray.forEach(element => {
								viewPanel.appendChild(element);
							});
						}
					}
				}
			});
		});

		//这一部分是针对 http://192.168.0.86:8080/job/DidaNuGetV2/10408/parameters/  这种具体的地址
		var input = document.getElementsByName('value')
		if (input.length > 0) {
			const number = document.getElementsByTagName('h1')[0].innerHTML.replace('执行', '');
			const decodedString = atob(input[0].value);
			// 创建显示解码字符串的元素
			const decodedElement = document.createElement('div');
			const data = JSON.parse(decodedString);
			const link = `<a target="_blank" href="https://dolphin.didaadmin.com/Deploy/Task/Robot/${data.TaskID}">${data.TaskID}</a>`;
			var newstring = decodedString.replace(`"TaskID":${data.TaskID}`, `"TaskID":${link}`);;
			decodedElement.innerHTML = `${number}  Decoded Parameters: ${newstring}`;
			// 将解码后的字符串插入到main-panel div中
			viewPanel.appendChild(decodedElement);
		}
	}
	function GetViewPanel() {
		const mainPanel = document.getElementById('main-panel');
		if (!mainPanel.querySelector('#viewPanel')) {
			const newViewPanel = document.createElement('div');
			newViewPanel.setAttribute('id', 'viewPanel');
			newViewPanel.setAttribute('style', 'line-height:2');
			mainPanel.appendChild(newViewPanel);
		}
		return mainPanel.querySelector('#viewPanel')
	}
	function getInputValue(html) {
		var parser = new DOMParser();
		var doc = parser.parseFromString(html, 'text/html');
		var inputElement = doc.querySelector('input.jenkins-input[readonly]');
		return inputElement ? inputElement.value : null;
	}

    //以下代码针对 http://192.168.0.86:8080/job/*/configure 每个 job 的配置
    function FixJobExecuteWindwsBatchCommand(){
        var buildTr = document.querySelectorAll('tr[title="构建"]')[0];
        buildTr.id = "buildTr";

        //把后面那些 Build a Visual Studio project or solution using MSBuild 的 MSBuild Build File 收集起来
        //尝试自动修正上一步的 Execute Windows batch command
        const sticker = GetInnerSticker()
        sticker.appendChild(BuildButton());
    }
    function GetInnerSticker(){
        const sticker = document.getElementById('bottom-sticker');
        return sticker.querySelector('div[class*="bottom-sticker-inner"]')
    }
    function BuildButton(){
        const span1 = document.createElement('span');
        span1.className = "yui-button";
        const span2 = document.createElement('span');
        span2.className = "first-child"
        const button = document.createElement('button');
        button.type = "button";
        button.textContent = "=== 修正 Execute Windows batch command ===";
        button.style.color = "red";
         // 添加事件监听器
        button.addEventListener('click', FixJobExecuteWindwsBatchCommandAction);

        span2.appendChild(button);
        span1.appendChild(span2);
        return span1;
    }
    function FixJobExecuteWindwsBatchCommandAction(){
        document.getElementById('buildTr').scrollIntoView({ behavior: 'smooth' });
        const buildFiles = document.querySelectorAll('input[name*="msBuildBuilder.msBuildFile"]');
        const replacedValues = []; // 用于存储替换后的值
        replacedValues.push('copy /Y ..\\NuGetConfigV2\\NuGet.Config NuGet.Config')
        replacedValues.push('echo ---------------- Update All References ---------------------')
        replacedValues.push('NuGetHelper.exe VS CleanPackagesDir packages')
        buildFiles.forEach(file=>{
            replacedValues.push(file.value.replace('${WORKSPACE}', 'NuGetHelper.exe VS updateReferencesByProjectChain ".') + '" || exit /b');
        });
        const textareaValue = replacedValues.join('\n');

        const shouldReplace = confirm("警告：此操作会把下面所有 MSBuild Build File 里的 csproj 收集起来 \n并自动添加 NuGetHelper.exe jenkins reUpdateReferences \n最后覆盖进构建下面的 Execute Windows batch command 里\n确认操作吗？");
        if(shouldReplace){
            const outputTextarea = document.getElementsByName('command')[0];
            if (outputTextarea) {
                outputTextarea.value = textareaValue; // 将合并后的字符串设置为 textarea 的值
            }
        }
    }
})();
