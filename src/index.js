const http = require('http');
const openInEditor = require('open-in-editor');
const { join } = require('path');

function startInspeptor({
  activateKeyCode = 79,
  openFileKeyCode = 65,
  color = '#009688',
  editor = 'code',
} = {}) {
  const { open } = openInEditor.configure({ editor });
  const server = http.createServer(handleRequest);
  const code = `(${clientCode.toString()})()`
    .replace('__INSPECTOR_COLOR', color)
    .replace('__ACTIVATE_KEY_CODE', activateKeyCode)
    .replace('__OPEN_FILE_KEY_CODE', openFileKeyCode);

  function handleRequest(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.statusCode = 200;

    if (req.url === '/start') {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(code);
    } else {
      open(join(process.cwd(), req.url));
      res.end('_');
    }
  }

  server.listen(5001, err => {
    if (err) {
      return console.log('Component opener failed', err);
    }

    console.log(`Component opener has been started`);
  });
}

function clientCode() {
  const css = _ => _;
  let _file = null;
  let _active = JSON.parse(localStorage.getItem('_opener_active'));
  const contour = document.body.appendChild(document.createElement('div'));
  const text = contour.appendChild(document.createElement('div'));

  if (_active) {
    document.body.addEventListener('mousemove', onMouseMove);
  }

  function checkInput(e) {
    return (
      !['input', 'textarea'].includes(e.target.tagName.toLowerCase()) &&
      !e.target.getAttribute('contenteditable')
    );
  }

  document.body.addEventListener('keydown', e => {
    if (e.keyCode !== __ACTIVATE_KEY_CODE || !checkInput(e)) return;

    _active = !_active;
    if (_active) {
      document.body.addEventListener('mousemove', onMouseMove);
    } else {
      document.body.removeEventListener('mousemove', onMouseMove);
      hide();
    }

    localStorage.setItem('_opener_active', _active);
  });

  document.body.addEventListener('keydown', e => {
    if (e.keyCode !== __OPEN_FILE_KEY_CODE || !_file || !checkInput(e)) return;
    fetch(`http://0.0.0.0:5001/${_file}`);
  });

  contour.setAttribute(
    'style',
    css`
      --inspector-color: __INSPECTOR_COLOR;
      position: fixed;
      left: 0;
      top: 0;
      transition: all 150ms;
      border-radius: 4px;
      z-index: 99999;
      border: 1px solid var(--inspector-color);
      color: var(--inspector-color);
      pointer-events: none;
    `,
  );

  text.setAttribute(
    'style',
    css`
      position: absolute;
      text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff,
        1px 1px 0 #fff;
      color: var(--inspector-color);
      font-weight: bold;
      top: -10px;
      left: 10px;
    `,
  );

  document.body.appendChild(contour);

  function findComponentRoot(element) {
    let current = element;
    while (
      current.parentElement &&
      current.parentElement.__svelte_meta &&
      current.parentElement.__svelte_meta.loc.file ===
        element.__svelte_meta.loc.file
    ) {
      current = current.parentElement;
    }
    return current;
  }

  function nextMeta(element, meta) {
    if (meta.file === _file) return;
    _file = meta.file;

    const { left, top, width, height } = findComponentRoot(
      element,
    ).getBoundingClientRect();

    contour.style.opacity = 1;
    contour.style.left = left + 'px';
    contour.style.top = top + 'px';
    contour.style.width = width + 'px';
    contour.style.height = height + 'px';
    text.innerText = _file;
  }

  function hide() {
    _file = null;
    contour.style.opacity = 0;
  }

  function onMouseMove(e) {
    const { __svelte_meta } = e.target;
    __svelte_meta ? nextMeta(e.target, __svelte_meta.loc) : hide();
  }
}

module.exports = startInspeptor;
