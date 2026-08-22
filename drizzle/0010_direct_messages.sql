CREATE TABLE `directMessages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `senderId` int NOT NULL,
  `recipientId` int NOT NULL,
  `content` varchar(2000) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `directMessages_id` PRIMARY KEY(`id`),
  CONSTRAINT `directMessages_sender_createdAt_idx` INDEX (`senderId`,`createdAt`),
  CONSTRAINT `directMessages_recipient_createdAt_idx` INDEX (`recipientId`,`createdAt`)
);

ALTER TABLE `directMessages`
  ADD CONSTRAINT `directMessages_senderId_users_id_fk`
  FOREIGN KEY (`senderId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `directMessages`
  ADD CONSTRAINT `directMessages_recipientId_users_id_fk`
  FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `directMessages`
  ADD CONSTRAINT `directMessages_distinct_participants`
  CHECK (`senderId` <> `recipientId`);

-- Drizzle migration marker: 0010_direct_messages
-- Apply with the configured DATABASE_URL through the repository's migration process.
