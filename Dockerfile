# Define custom function directory
ARG FUNCTION_DIR="/function"

FROM node:20-buster as build-image
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Include global arg in this stage of the build
ARG FUNCTION_DIR

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev

# Copy function code
RUN mkdir -p ${FUNCTION_DIR}
COPY . ${FUNCTION_DIR}

WORKDIR ${FUNCTION_DIR}

# Install Node.js dependencies
# RUN npm install
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# Install the runtime interface client
# RUN npm install aws-lambda-ric
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install aws-lambda-ric
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install @sparticuz/chromium
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install cheerio
# Grab a fresh slim copy of the image to reduce the final size
FROM node:20-buster-slim

# Required for Node runtimes which use npm@8.6.0+ because
# by default npm writes logs under /home/.npm and Lambda fs is read-only
ENV NPM_CONFIG_CACHE=/tmp/.npm
ENV AWS_LAMBDA_FUNCTION_MEMORY_SIZE=128

# Include global arg in this stage of the build
ARG FUNCTION_DIR

# Set working directory to function root directory
WORKDIR ${FUNCTION_DIR}

# Copy in the built dependencies
COPY --from=build-image ${FUNCTION_DIR} ${FUNCTION_DIR}
# RUN apt-get update && apt-get install -y \
#     gconf-service libasound2 libatk1.0-0 libc6 \
#     libcairo2 libcups2 libdbus-1-3 libexpat1 \
#     libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
#     libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
#     libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
#     libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
#     libxtst6 ca-certificates fonts-liberation libnss3 lsb-release xdg-utils \
#     wget ca-certificates
# RUN apt-get update && apt-get install chromium -y
# RUN /usr/local/bin/npx @puppeteer/browsers install chrome@stable
# Set runtime interface client as default command for the container runtime
ENTRYPOINT ["/usr/local/bin/npx", "aws-lambda-ric"]
# Pass the name of the function handler as an argument to the runtime
CMD ["index.handler"]