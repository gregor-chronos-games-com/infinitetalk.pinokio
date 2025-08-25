// Robust Windows/*nix installer: explicit venv python, GPU/CPU choice, numpy/thinc guard, tolerant pip check
module.exports = {
  run: [
    // 0) fetch app
    { method: "shell.run", params: { message: "git clone https://github.com/MeiGen-AI/InfiniteTalk app" }},

    // 1) options
    { method: "input", params: {
      title: "InfiniteTalk Setup",
      form: [
        { title: "PyTorch build (cu121 or cpu)", key: "TORCH_BUILD", placeholder: "cu121" },
        { title: "Install flash-attn? (y/n)", key: "INSTALL_FLASH_ATTN", placeholder: "n" },
        { title: "Download model weights now? (y/n)", key: "DOWNLOAD_MODELS", placeholder: "y" }
      ]
    }},

    // 2) venv (no activation needed later)
    { method: "shell.run", params: {
      path: "app",
      message: "{{ process.platform === 'win32' ? 'py -3.10 -m venv env' : 'python3.10 -m venv env' }}"
    }},
    { method: "shell.run", params: {
      path: "app",
      message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }} -m pip install -U pip setuptools wheel"
    }},

    // 3) torch stack (split steps)
    { method: "shell.run", params: {
      path: "app",
      message:
        "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }}" +
        " -m pip install torch==2.4.1{{ (input.TORCH_BUILD||'cu121').toLowerCase()==='cu121' ? ' --index-url https://download.pytorch.org/whl/cu121' : '' }}"
    }},
    { method: "shell.run", params: {
      path: "app",
      message:
        "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }}" +
        " -m pip install torchvision==0.19.1 torchaudio==2.4.1{{ (input.TORCH_BUILD||'cu121').toLowerCase()==='cu121' ? ' --index-url https://download.pytorch.org/whl/cu121' : '' }}"
    }},
    { method: "shell.run", params: {
      path: "app",
      message:
        "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }}" +
        " -m pip install -U xformers==0.0.28{{ (input.TORCH_BUILD||'cu121').toLowerCase()==='cu121' ? ' --index-url https://download.pytorch.org/whl/cu121' : '' }}"
    }},

    // 4) guard against numpy/thinc conflict
    { method: "shell.run", params: { path: "app", message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }} -m pip install \"numpy>=2,<3\"" }},
    { method: "shell.run", params: { path: "app", message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }} -m pip uninstall -y thinc || " + (process.platform==='win32' ? "cmd /c echo thinc not present" : "sh -lc \"echo thinc not present\"") }},

    // 5) base deps + (optional) flash-attn
    { method: "shell.run", params: { path: "app", message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }} -m pip install misaki[en] ninja psutil packaging" }},
    { method: "shell.run", params: {
      path: "app",
      message: "{{ (input.INSTALL_FLASH_ATTN||'n').toLowerCase().startsWith('y') ? (process.platform==='win32' ? 'cmd /c echo Skipping flash_attn on Windows' : './env/bin/python -m pip install flash_attn==2.7.4.post1') : (process.platform==='win32' ? 'cmd /c echo Skipping flash_attn' : 'sh -lc \"echo Skipping flash_attn\"') }}"
    }},

    // 6) project requirements (tolerate resolver noise), then re-guard numpy/thinc
    { method: "shell.run", params: {
      path: "app",
      message: "{{ process.platform==='win32' ? 'cmd /c \".\\\\env\\\\Scripts\\\\python.exe -m pip install -r requirements.txt || (echo pip returned nonzero & exit /b 0)\"' : 'sh -lc \"./env/bin/python -m pip install -r requirements.txt || true\"' }}"
    }},
    { method: "shell.run", params: { path: "app", message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }} -m pip install \"numpy>=2,<3\"" }},
    { method: "shell.run", params: { path: "app", message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }} -m pip uninstall -y thinc || " + (process.platform==='win32' ? 'cmd /c echo thinc not present' : 'sh -lc \"echo thinc not present\"') }},

    // 7) ffmpeg: conda if present, plus python wheels for portability
    { method: "shell.run", params: { message: "{{ process.platform==='win32' ? 'conda --version >NUL 2>&1 && conda install -y -c conda-forge ffmpeg || echo Skipping conda ffmpeg' : 'conda --version >/dev/null 2>&1 && conda install -y -c conda-forge ffmpeg || echo Skipping conda ffmpeg' }}" }},
    { method: "shell.run", params: { path: "app", message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }} -m pip install imageio-ffmpeg ffmpeg-python librosa" }},

    // 8) HF CLI + optional model pulls
    { method: "shell.run", params: { path: "app", message: "{{ process.platform === 'win32' ? '.\\\\env\\\\Scripts\\\\python.exe' : './env/bin/python' }} -m pip install -U huggingface_hub" }},
    { method: "shell.run", params: { path: "app", message: "{{ (input.DOWNLOAD_MODELS||'y').toLowerCase().startsWith('y') ? (process.platform==='win32'?'.\\\\env\\\\Scripts\\\\huggingface-cli.exe':'./env/bin/huggingface-cli') + ' download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./weights/Wan2.1-I2V-14B-480P' : (process.platform==='win32' ? 'cmd /c echo Skipping model downloads' : 'sh -lc \"echo Skipping model downloads\"') }}" }},
    { method: "shell.run", params: { path: "app", message: "{{ (input.DOWNLOAD_MODELS||'y').toLowerCase().startsWith('y') ? (process.platform==='win32'?'.\\\\env\\\\Scripts\\\\huggingface-cli.exe':'./env/bin/huggingface-cli') + ' download TencentGameMate/chinese-wav2vec2-base --local-dir ./weights/chinese-wav2vec2-base' : (process.platform==='win32' ? 'cmd /c echo Skipping' : 'sh -lc \"echo Skipping\"') }}" }},
    { method: "shell.run", params: { path: "app", message: "{{ (input.DOWNLOAD_MODELS||'y').toLowerCase().startsWith('y') ? (process.platform==='win32'?'.\\\\env\\\\Scripts\\\\huggingface-cli.exe':'./env/bin/huggingface-cli') + ' download TencentGameMate/chinese-wav2vec2-base model.safetensors --revision refs/pr/1 --local-dir ./weights/chinese-wav2vec2-base' : (process.platform==='win32' ? 'cmd /c echo Skipping' : 'sh -lc \"echo Skipping\"') }}" }},
    { method: "shell.run", params: { path: "app", message: "{{ (input.DOWNLOAD_MODELS||'y').toLowerCase().startsWith('y') ? (process.platform==='win32'?'.\\\\env\\\\Scripts\\\\huggingface-cli.exe':'./env/bin/huggingface-cli') + ' download MeiGen-AI/InfiniteTalk --local-dir ./weights/InfiniteTalk' : (process.platform==='win32' ? 'cmd /c echo Skipping' : 'sh -lc \"echo Skipping\"') }}" }},

    // 9) finish
    { method: "notify", params: { html: "<b>InfiniteTalk install complete</b><br>Click to launch.", href: "./start.js" } }
  ]
}
