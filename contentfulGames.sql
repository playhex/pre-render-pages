-- Games with some content so that, board hidden, page is unique-enough to not be confused with another game page.
-- In other words, google have less chance to mark it as duplicate content.
-- Here we take ended 1v1 games, no guest, with some chat messages
select concat('/games/', hg.publicId)
from hosted_game hg
inner join chat_message cm on cm.hostedGameId = hg.id
inner join game g on g.hostedGameId = hg.id
inner join hosted_game_options hgo on hgo.hostedGameId = hg.id
inner join hosted_game_to_player hgp on hgp.hostedGameId = hg.id
inner join player p on p.id = hgp.playerId
where hg.state = 'ended'
and hgo.opponentType = 'player'
and p.isGuest = 0
and p.isBot = 0
and cm.shadowDeleted = 0
group by hg.id
having count(*) > 5
order by g.endedAt desc
