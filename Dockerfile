FROM alpine
RUN mkdir -p /var/www/html
COPY ./* /var/www/html
WORKDIR /var/www/html