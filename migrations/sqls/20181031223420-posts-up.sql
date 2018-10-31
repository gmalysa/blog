CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `posted` datetime NOT NULL,
  `title` varchar(128) NOT NULL,
  `slug` varchar(128) NOT NULL,
  `content` text,
  PRIMARY KEY (`id`)
);
