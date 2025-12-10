FROM nginx:alpine

RUN apk add --no-cache netcat-openbsd curl

COPY start.sh /start.sh
RUN chmod +x /start.sh

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./ssl /etc/nginx/ssl
COPY ./logs /var/log/nginx

CMD ["/start.sh"]
