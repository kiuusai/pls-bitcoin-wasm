FROM mcr.microsoft.com/devcontainers/go:2-1.26-trixie

USER vscode

SHELL [ "/bin/bash", "-c" ]

RUN go install github.com/asdf-vm/asdf/cmd/asdf@v0.20.0

ENV PATH="${PATH}:${HOME}/.asdf/shims"

RUN echo 'export PATH="${PATH}:${HOME}/.asdf/shims"' | sudo tee /etc/profile.d/asdf.sh >/dev/null

RUN echo '. <(asdf completion bash)' > "${HOME}/.bashrc"
