export default ({
  ncSiteUrl,
  dashboardPath,
}: {
  ncSiteUrl: string;
  dashboardPath: string;
}): string => `<!DOCTYPE html>
<html>
<head>
    <title>星澜 : API 文档</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui">
    <link rel="shortcut icon" href="${ncSiteUrl}/favicon.ico" />
    <link rel="stylesheet" href="${ncSiteUrl}/css/swagger-ui.css"/>
    <script src="${ncSiteUrl}/js/swagger-ui-bundle.js"></script>
</head>
<body>
<div id="app"></div>
<script>

let initialLocalStorage = {}

try {
  initialLocalStorage = JSON.parse(localStorage.getItem('nocodb-gui-v2') || '{}');
} catch (e) {
  console.error('Failed to parse local storage', e);
}

var xmlhttp = new XMLHttpRequest();   // new HttpRequest instance 
xmlhttp.open("GET", "./swagger.json");
xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
xmlhttp.setRequestHeader("xc-auth", initialLocalStorage && initialLocalStorage.token);
xmlhttp.onload = function () {
  
  // if invalid token then redirect to signin page
  if (xmlhttp.status === 401) {
    window.location.href = ${JSON.stringify(ncSiteUrl)} + ${JSON.stringify(
  dashboardPath,
)} + '#/signin?continueAfterSignIn=' + encodeURIComponent(window.location.href);
    return;
  } 

  const ui = SwaggerUIBundle({
    // url: ,
    spec: JSON.parse(xmlhttp.responseText),
    dom_id: '#app',
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIBundle.SwaggerUIStandalonePreset
    ],
  })
}
xmlhttp.send();

  
  console.log('%c🚀 星澜 API 文档 🚀', 'color:#1348ba;font-size:3rem;padding:20px;');
  const styleEl = document.createElement('style');
  styleEl.innerHTML = [
    '.swagger-ui .topbar .link img {',
    '  content: url("${ncSiteUrl}/icon.png");',
    '  height: 40px;',
    '}',
    '.swagger-ui .topbar .link::after {',
    '  content: "星澜 API 文档";',
    '  color: #1348ba;',
    '  font-weight: bold;',
    '  margin-left: 10px;',
    '  font-size: 1.2em;',
    '}',
  ].join('\\n');
  document.head.appendChild(styleEl)
</script>
</body>
</html>`;
