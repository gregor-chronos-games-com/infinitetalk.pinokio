// Wipe venv, caches, and weights; safe to re-run install afterwards
module.exports = {
  run: [
    { method: "process.stop", params: {} },

    { method: "shell.run", params: { path: "app", message: "{{ process.platform==='win32' ? 'rmdir /s /q env' : 'rm -rf env' }}" }},
    { method: "shell.run", params: { path: "app", message: "{{ process.platform==='win32' ? 'rmdir /s /q __pycache__ cache weights' : 'rm -rf __pycache__ cache weights' }}" }},

    { method: "shell.run", params: { message: "pip cache purge" }},

    { method: "notify", params: { html: "<b>Reset complete.</b><br>Run the installer again to start fresh.", href: "./install.js" } }
  ]
}
