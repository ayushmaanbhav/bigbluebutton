import React from 'react';
import { makeCall } from '/imports/ui/services/api';
import { withTracker } from 'meteor/react-meteor-data';
import Presentations from '/imports/api/presentations';
import PresentationAreaService from '/imports/ui/components/presentation/service';
import Poll from '/imports/ui/components/poll/component';
import Service from './service';
import ActionsBarService from '../actions-bar/service';

const PollContainer = ({ ...props }) => <Poll {...props} />;

export default withTracker(() => {
  Meteor.subscribe('current-poll');

  const currentPresentation = Presentations.findOne({
    current: true,
  }, { fields: { podId: 1 } }) || {};

  const currentSlide = PresentationAreaService.getCurrentSlide(currentPresentation.podId);

  const startPoll = type => makeCall('startPoll', type, currentSlide.id);

  const startCustomPoll = (type, poll) => makeCall('startPoll', type, currentSlide.id, poll);

  return {
    currentSlide,
    amIPresenter: Service.amIPresenter(),
    pollTypes: Service.pollTypes,
    startPoll,
    startCustomPoll,
    stopPoll: Service.stopPoll,
    publishPoll: Service.publishPoll,
    meetingName: ActionsBarService.meetingName(),
    currentPoll: Service.currentPoll(),
    resetPollPanel: Session.get('resetPollPanel') || false,
    pollAnswerIds: Service.pollAnswerIds,
    isMeteorConnected: Meteor.status().connected,
  };
})(PollContainer);
