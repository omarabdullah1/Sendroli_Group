FROM nginx:alpine

RUN apk add --no-cache netcat-openbsd curl

COPY start.sh /start.sh
RUN chmod +x /start.sh

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./ssl /etc/nginx/ssl

# Create logs directory
RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/access.log && \
    touch /var/log/nginx/error.log

CMD ["/start.sh"]
