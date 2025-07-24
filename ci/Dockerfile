FROM nginx:stable-alpine

WORKDIR /annotation-tools

EXPOSE 3000

VOLUME /etc/nginx/

COPY build/ /annotation-tools

COPY ci/nginx/nginx.conf /etc/nginx/nginx.conf

COPY version.json /annotation-tools

CMD ["nginx", "-g", "daemon off;"]
