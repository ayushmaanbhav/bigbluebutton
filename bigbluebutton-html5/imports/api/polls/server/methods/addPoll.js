import { check } from 'meteor/check';
import { extractCredentials } from '/imports/api/common/server/helpers';
import addPoll from '../modifiers/addPoll';

export default function addCustomPoll(pollId, answers, question) {
  const { meetingId, requesterUserId } = extractCredentials(this.userId);

  check(pollId, String);

  const poll = {
    id: `${pollId}/${new Date().getTime()}`,
    answers,
    question,
  };

  return addPoll(meetingId, requesterUserId, poll);
}
