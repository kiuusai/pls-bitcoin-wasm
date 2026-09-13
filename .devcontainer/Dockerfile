FROM mcr.microsoft.com/devcontainers/rust:2-1-trixie

USER root

RUN curl https://getnigiri.vulpem.com | bash

ARG NODE_VERSION="v24.11.1"

ENV NODE_HOME="/usr/local/lib/nodejs/node-${NODE_VERSION}-linux-x64"
ENV PATH=${NODE_HOME}/bin:${PATH}

RUN cd /tmp && \
  mkdir /usr/local/lib/nodejs && \
  curl -fsSLO "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.gz" && \
  tar -xzf "node-${NODE_VERSION}-linux-x64.tar.gz" -C /usr/local/lib/nodejs && \
  rm "/tmp/node-${NODE_VERSION}-linux-x64.tar.gz"

RUN --mount=type=bind,source=scripts/configure-cargo.sh,target=/tmp/configure-cargo.sh,readonly \
  /tmp/configure-cargo.sh

USER vscode
