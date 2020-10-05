import { Meteor } from 'meteor/meteor';
import publishVote from './methods/publishVote';
import publishPoll from './methods/publishPoll';
import startPoll from './methods/startPoll';
import addCustomPoll from './methods/addPoll';
import stopPoll from './methods/stopPoll';

Meteor.methods({
  publishVote,
  publishPoll,
  startPoll,
  addCustomPoll,
  stopPoll,
});
