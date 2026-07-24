FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg chromium ca-certificates && apt-get clean
WORKDIR /work/tools/hyperframes
COPY tools/hyperframes/package.json ./
RUN npm install
COPY public /work/public
COPY tools/hyperframes /work/tools/hyperframes
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
CMD ["npm", "run", "render"]
