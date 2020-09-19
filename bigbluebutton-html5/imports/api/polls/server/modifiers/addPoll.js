import Users from '/imports/api/users';
import Polls from '/imports/api/polls';
import Logger from '/imports/startup/server/logger';
import flat from 'flat';
import { check } from 'meteor/check';

export default function addPoll(meetingId, requesterId, poll) {
  check(requesterId, String);
  check(meetingId, String);
  if (poll.questions) {
    check(poll, {
      id: String,
      questions: [{
        id: String,
        question: Match.OneOf(String, null, undefined),
        answers: [
          {
            id: Number,
            key: String,
          },
        ],
        multiResponse: Boolean,
      }],
      metaData: Object,
    });
  } else {
    check(poll, {
      id: String,
      question: Match.OneOf(String, null, undefined),
      answers: [
        {
          id: Number,
          key: String,
        },
      ],
      multiResponse: Boolean,
    });
  }


  const userSelector = {
    meetingId,
    userId: { $ne: requesterId },
    clientType: { $ne: 'dial-in-user' },
  };

  const userIds = Users.find(userSelector, { fields: { userId: 1 } })
    .fetch()
    .map(user => user.userId);

  const selector = {
    meetingId,
    requester: requesterId,
    id: poll.id,
  };

  const { responseTrack } = poll;
  let qTrack = responseTrack;
  if (!qTrack) {
    qTrack = poll.questions ? poll.questions : [{
      id: poll.id,
      answers: poll.answers,
    }];
    qTrack.forEach((q, index) => {
      qTrack[index].answers = q.answers.map((a) => {
        const x = a;
        x.numVotes = 0;
        return x;
      });
    });
  }
  const currentPoll = poll;
  currentPoll.responseTrack = qTrack;
  currentPoll.timeLimit = (poll.metaData && parseInt(poll.metaData.timeLimit, 10)) || 10;
  delete currentPoll.metaData;

  const modifier = Object.assign(
    { meetingId },
    { requester: requesterId },
    { users: userIds },
    flat(currentPoll, { safe: true }),
  );

  const cb = (err, numChanged) => {
    if (err != null) {
      return Logger.error(`Error add Poll to collection: ${poll.id} ${err}`);
    }

    const { insertedId } = numChanged;
    if (insertedId) {
      return Logger.info(`Added Poll id=${poll.id}`);
    }

    return Logger.info(`Upserted Poll id=${poll.id}`);
  };

  return Polls.upsert(selector, modifier, cb);
}
