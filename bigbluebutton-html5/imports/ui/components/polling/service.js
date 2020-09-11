import { makeCall } from '/imports/ui/services/api';
import Polls from '/imports/api/polls';
import Auth from '../../services/auth';

const MAX_CHAR_LENGTH = 5;

const mapPolls = () => {
  const poll = Polls.findOne({ meetingId: Auth.meetingID });
  if (!poll) {
    return { pollExists: false };
  }

  console.log('mapPolls', poll);

  const stackOptions = false;
  //
  // questions.map((obj) => {
  //   if (stackOptions) return obj;
  //   if (obj.key.length > MAX_CHAR_LENGTH) {
  //     stackOptions = true;
  //   }
  //   return obj;
  // });

  const amIRequester = poll.requester !== 'userId';

  return {
    poll: {
      questions: poll.questions,
      pollId: poll.id,
      stackOptions,
    },
    pollExists: true,
    amIRequester,
    handleVote(pollId, answerId) {
      makeCall('publishVote', pollId, answerId.id);
    },
  };
};

export default { mapPolls };
