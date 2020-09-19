import { check } from 'meteor/check';
import updateVotes from '../modifiers/updateVotes';

export default function userVoted({ body }, meetingId) {
  const { pollId, answersMap } = body;

  check(meetingId, String);
  check(answersMap, Object);


  return updateVotes(answersMap, pollId);
}
