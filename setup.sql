CREATE USER 'blog'@'localhost' IDENTIFIED BY 'blog';
CREATE DATABASE `blog`;
GRANT ALL PRIVILEGES ON blog.* TO 'blog'@'localhost';
