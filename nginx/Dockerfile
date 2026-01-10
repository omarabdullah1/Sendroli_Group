FROM nginx:alpine

RUN apk add --no-cache netcat-openbsd curl

COPY start.sh /start.sh
RUN chmod +x /start.sh

COPY ./nginx.conf /etc/nginx/nginx.conf

# Create necessary directories
RUN mkdir -p /etc/nginx/ssl && \
    mkdir -p /var/log/nginx && \
    touch /var/log/nginx/access.log && \
    touch /var/log/nginx/error.log

# Copy SSL directory if it exists
COPY ./ssl /etc/nginx/ssl

CMD ["/start.sh"]
