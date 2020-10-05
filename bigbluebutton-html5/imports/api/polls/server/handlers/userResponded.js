import { check } from 'meteor/check';
import Polls from '/imports/api/polls';
import Logger from '/imports/startup/server/logger';

export default function userResponded({ body }) {
  const { pollId, userId, answersMap } = body;

  check(pollId, String);
  check(userId, String);
  check(answersMap, Object);

  const selector = {
    id: pollId,
  };
  const currentPoll = Polls.findOne(selector);
  const { responseTrack } = currentPoll;
  const qTrack = responseTrack;
  Object.keys(answersMap).forEach((qids) => {
    let qid = qids;
    if (currentPoll.answers) qid = 0;
    answersMap[qids].forEach((aid) => {
      qTrack[qid].answers.forEach((ans, index) => {
        if (aid === ans.id) {
          const votes = qTrack[qid].answers[index].numVotes;
          qTrack[qid].answers[index].numVotes = votes + 1;
        }
      });
    });
  });

  const modifier = {
    $pull: {
      users: userId,
    },
    $push: {
      responses: {
        userId,
        answersMap,
      },
    },
    $set: {
      responseTrack: qTrack,
    },
  };

  const cb = (err) => {
    if (err) {
      return Logger.error(`Updating Poll responses: ${err}`);
    }

    return Logger.info(`Updating Poll response (userId: ${userId},`
      + `response: ${answersMap}, pollId: ${pollId})`);
  };

  return Polls.update(selector, modifier, cb);
}
