import Polls from '/imports/api/polls';
import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import flat from 'flat';

export default function updateVotes(answerMap, id) {
  check(id, String);
  check(answerMap, Object);

  const selector = {
    id,
  };
  const currentPoll = Polls.findOne(selector);
  const { numResponders } = currentPoll;
  currentPoll.numResponders = numResponders ? numResponders + 1 : 1;

  const modifier = {
    $set: flat(currentPoll, { safe: true }),
  };

  const cb = (err) => {
    if (err) {
      return Logger.error(`Updating Polls collection: ${err}`);
    }

    return Logger.info(`Updating Polls collection (answerMap: ${answerMap}, pollId: ${id}!)`);
  };

  return Polls.update(selector, modifier, cb);
}
