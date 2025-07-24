FROM node:20.8.0-bookworm-slim AS Builder

WORKDIR /build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package.json ./
COPY pnpm-lock.yaml ./

ENV COREPACK_NPM_REGISTRY=https://mirrors.cloud.tencent.com/npm/
RUN --mount=type=cache,id=pnpmcache,target=/pnpm/store --mount=type=secret,id=npmrc,target=/root/.npmrc pnpm install --frozen-lockfile --registry=https://registry.npmmirror.com/

COPY . ./

ARG branch_name
RUN UMI_ENV=${branch_name} pnpm build


FROM nginx:stable-alpine

WORKDIR /loonshots-web-lite

#RUN apk update
#
#RUN apk add busybox-extras

EXPOSE 8000 80

VOLUME /etc/nginx

#ADD dist/ /loonshots-web-lite/dist
COPY --from=Builder /build/dist ./dist

COPY nginx.conf /etc/nginx/nginx.conf
