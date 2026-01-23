export default ({
  ncSiteUrl,
  dashboardPath,
}: {
  ncSiteUrl: string;
  dashboardPath: string;
}): string => `<!DOCTYPE html>
<html>
<head>
    <title>星澜 API 文档</title>
    <!-- needed for adaptive design -->
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="${ncSiteUrl}/css/fonts.montserrat.css" rel="stylesheet">
    <!--
    Redoc doesn't change outer page styles
    -->
    <style>
        body {
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body>
<div id="redoc"></div>
<script src="${ncSiteUrl}/js/redoc.standalone.min.js"></script>
<script>
  let initialLocalStorage = {}
  
  try {
    initialLocalStorage = JSON.parse(localStorage.getItem('nocodb-gui-v2') || '{}');
  } catch (e) {
    console.error('Failed to parse local storage', e);
  }

  const xhttp = new XMLHttpRequest();
  
  xhttp.open("GET", "./swagger.json");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("xc-auth", initialLocalStorage && initialLocalStorage.token);

  xhttp.onload = function () {
    
      // if invalid token then redirect to signin page
      if (xhttp.status === 401) {
        window.location.href = ${JSON.stringify(ncSiteUrl)} + ${JSON.stringify(
  dashboardPath,
)} + '#/signin?continueAfterSignIn=' + encodeURIComponent(window.location.href);
        return;
      } 
    
      const swaggerJson = this.responseText;
      const swagger = JSON.parse(swaggerJson);
      Redoc.init(swagger, {
        scrollYOffset: 50
      }, document.getElementById('redoc'))
  };
  
  xhttp.send();
</script>
<script>
 console.log('%c🚀 星澜 API 文档 🚀', 'color:#1348ba;font-size:3rem;padding:20px;')
  const styleEl = document.createElement('style');
  styleEl.innerHTML = [
    '.menu-content img {',
    '  content: url("${ncSiteUrl}/icon.png");',
    '  height: 40px !important;',
    '  width: auto !important;',
    '}',
  ].join('\\n');
  document.head.appendChild(styleEl)
</script>
</body>
</html>`;
