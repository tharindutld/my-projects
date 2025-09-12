# Use PHP with Apache
FROM php:8.2-apache

# Copy project files into container
COPY . /var/www/html/

# Enable URL rewriting
RUN a2enmod rewrite

# Install mysqli extension
RUN docker-php-ext-install mysqli

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Expose port 80
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
