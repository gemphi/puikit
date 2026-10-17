# Phiora in a container. Build from puijs/apps (the context needs the app data Phiora serves and prices from):
#   cd puijs/apps && docker build -f phiora-server/Dockerfile -t phiora .
#   docker run -p 4300:4300 -v phiora-data:/data -e PHI_ORIGINS=https://phiace.com -e RESEND_API_KEY=… -e PHI_MAIL_FROM='Phiace <hi@phiace.com>' phiora
FROM node:22-alpine
WORKDIR /srv/apps
# Dockerfile.dockerignore keeps the context to phiora-server + the JSON it reads.
COPY --chown=node:node . .
ENV NODE_ENV=production PHI_ENV=production PHI_DATA_DIR=/data PORT=4300
# The pg driver (only dependency; Postgres comes in through DATABASE_URL).
RUN cd phiora-server && npm install --omit=dev --no-audit --no-fund
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]
USER node
WORKDIR /srv/apps/phiora-server
EXPOSE 4300
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:4300/health >/dev/null || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.mjs"]
