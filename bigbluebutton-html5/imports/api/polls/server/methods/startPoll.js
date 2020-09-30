import RedisPubSub from '/imports/startup/server/redis';
import { check } from 'meteor/check';
import { extractCredentials } from '/imports/api/common/server/helpers';

export default function startPoll(pollType, timeLimit, pollId, poll) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;

  let EVENT_NAME = 'StartPollReqMsg';

  const { meetingId, requesterUserId } = extractCredentials(this.userId);

  check(pollId, String);
  check(pollType, String);
  const pollID = `${pollId}/${new Date().getTime()}`;

  const payload = {
    requesterId: requesterUserId,
    pollId: pollID,
    pollType,
  };

  if (pollType === 'custom') {
    const pollWithMetaData = poll;
    pollWithMetaData.metaData = { timeLimit };
    EVENT_NAME = 'StartCustomPollReqMsg';
    check(poll, {
      id: String,
      questions: [{
        question: Match.OneOf(String, null, undefined),
        answers:
          [String],
        multiResponse: Boolean,
      }],
      metaData: Object,
    });
    payload.poll = pollWithMetaData;
  }
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
