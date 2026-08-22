ALTER TABLE `userFollows`
  ADD CONSTRAINT `userFollows_follower_following_unique`
  UNIQUE (`followerId`, `followingId`);
