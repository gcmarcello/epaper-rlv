FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm

RUN npm install -g pnpm

RUN npm install -g @nestjs/cli

RUN curl -L https://github.com/superfly/flyctl/releases/download/v0.2.12/flyctl_0.2.12_Linux_x86_64.tar.gz | tar -xzC /usr/local/bin

RUN echo 'export FLYCTL_INSTALL="/home/node/.fly"' >> /home/node/.bashrc && \
    echo 'export PATH="$FLYCTL_INSTALL/bin:$PATH"' >> /home/node/.bashrc

RUN echo "alias fly='flyctl'" >> /home/node/.bashrc

RUN echo 'export PNPM_HOME="/home/node/.local/share/pnpm"' >> /home/node/.bashrc && \
    echo 'case ":$PATH:" in' >> /home/node/.bashrc && \
    echo '  *":$PNPM_HOME:"*) ;;' >> /home/node/.bashrc && \
    echo '  *) export PATH="$PNPM_HOME:$PATH" ;;' >> /home/node/.bashrc && \
    echo 'esac' >> /home/node/.bashrc
