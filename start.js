// Launch using the venv's Python; auto-open the first http:// URL Gradio prints
module.exports = {
  run: [
    { method: "shell.start", params: { path: "app" } },
    {
      method: "shell.enter",
      params: {
        message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe app.py' : './env/bin/python app.py' }}",
        on: [{ event: "/(http:\\/\\/\\S+)/", return: "{{event.matches[0][1]}}" }]
      },
      notify: true
    },
    { method: "browser.open", params: { uri: "{{input}}", target: "_blank" } },
    { method: "process.wait" }
  ]
}
