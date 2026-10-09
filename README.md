# Some Tampermonkey Scripts

## DidaJenkins.js：
1. 针对 http://192.168.0.86:8080/*/configure 这种地址，修正 Execute Windows batch command 部分，从 NuGetHelper.exe jenkins reUpdateReferences 改成 NuGetHelper.exe VS updateReferencesByProjectChain
2. 针对 http://192.168.0.86:8080/*/DidaNuGetV2/ 这种地址，左边的 dll 历史打印到当前页面上

## DidaDolphinSnake.js:
1. Dolphin 在调整服务器负载时，如果一次调整服务器数量过多，会弹一个二次确认窗口，打断用户操作的连贯性，十分烦，脚本旨在遇到这个窗口时直接填入二次确认文本并点击确认；
2. Snake 在手工强制关闭未恢复的工单时，也会弹未恢复提示，十分烦，脚本遇到此提示时直接帮助点击确认关闭。

## DidaCRM.js
在使用 DidaCRM 系统时，使用 ParentClientID 查询到所有子机构号，通常查询不是最终目的，查询到后需要把子机构号导出在后续使用，
但 CRM 产品、开发 一直不提供此便捷的功能，那就自己来呗，AI 时代了是不。


## 使用方法：
1. 安装 tampermonkey https://www.tampermonkey.net/
2. 打开 tampermonkey 界面
3. 点击 【实用工具】
4. 使用 【实用工具】最下面的 【从 URL 安装】
5. 把此目录里几个 js 文件 Raw 地址填入安装即可
