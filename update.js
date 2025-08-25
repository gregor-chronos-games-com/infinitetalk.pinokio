// Pull latest, refresh requirements, re-guard numpy/thinc, tolerate resolver nonzero
module.exports = {
  run: [
    { method: "shell.run", params: { path: "app", message: "git pull" } },

    { method: "shell.run", params: {
      path: "app",
      message: "{{ process.platform==='win32' ? 'cmd /c \".\\\\env\\\\Scripts\\\\python.exe -m pip install -U -r requirements.txt || (echo pip returned nonzero & exit /b 0)\"' : 'sh -lc \"./env/bin/python -m pip install -U -r requirements.txt || true\"' }}"
    }},

    { method: "shell.run", params: { path: "app", message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }} -m pip install \"numpy>=2,<3\"" }},
    { method: "shell.run", params: { path: "app", message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }} -m pip uninstall -y thinc || " + (process.platform==='win32' ? "cmd /c echo thinc not present" : "sh -lc \"echo thinc not present\"") }},

    { method: "notify", params: { html: "<b>InfiniteTalk updated.</b> Click to (re)start.", href: "./start.js" } }
  ]
}
