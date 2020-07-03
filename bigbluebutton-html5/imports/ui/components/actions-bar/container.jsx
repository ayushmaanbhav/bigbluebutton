import React from 'react';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { injectIntl } from 'react-intl';
import getFromUserSettings from '/imports/ui/services/users-settings';
import Auth from '/imports/ui/services/auth';
import PresentationService from '/imports/ui/components/presentation/service';
import Presentations from '/imports/api/presentations';
import { Session } from 'meteor/session';
import ActionsBar from './component';
import Service from './service';
import VideoService from '../video-provider/service';
import ExternalVideoService from '/imports/ui/components/external-video-player/service';
import CaptionsService from '/imports/ui/components/captions/service';
import Meetings from '/imports/api/meetings';
import UserListService from '/imports/ui/components/user-list/service';
import logger from '/imports/startup/client/logger';
import {
  shareScreen,
  unshareScreen,
  isVideoBroadcasting,
  screenShareEndAlert,
  dataSavingSetting,
} from '../screenshare/service';

import MediaService, {
  getSwapLayout,
  shouldEnableSwapLayout,
} from '../media/service';
import userListService from '../user-list/service';

const ActionsBarContainer = props => <ActionsBar {...props} />;
const POLLING_ENABLED = Meteor.settings.public.poll.enabled;

const meetingMuteDisabledLog = () => logger.info({
  logCode: 'useroptions_unmute_all',
  extraInfo: { logType: 'moderator_action' },
}, 'moderator disabled meeting mute');

export default withTracker(() => {
  const checkUnreadMessages = () => {
    const activeChats = userListService.getActiveChats();
    const hasUnreadMessages = activeChats
      .filter(chat => chat.userId !== Session.get('idChatOpen'))
      .some(chat => chat.unreadCounter > 0);
    return hasUnreadMessages;
  };
  const openPanel = Session.get('openPanel');
  const isExpanded = openPanel !== '';
  const hasUnreadMessages = checkUnreadMessages();

  const isMeetingMuteOnStart = () => {
    const { voiceProp } = Meetings.findOne({ meetingId: Auth.meetingID },
      { fields: { 'voiceProp.muteOnStart': 1 } });
    const { muteOnStart } = voiceProp;
    return muteOnStart;
  };

  const toggleMuteAllUsers = () => {
    UserListService.muteAllUsers(Auth.userID);
    if (isMeetingMuteOnStart()) {
      return meetingMuteDisabledLog();
    }
    return logger.info({
      logCode: 'useroptions_mute_all',
      extraInfo: { logType: 'moderator_action' },
    }, 'moderator enabled meeting mute, all users muted');
  };

  return {
    amIPresenter: Service.amIPresenter(),
    amIModerator: Service.amIModerator(),
    stopExternalVideoShare: ExternalVideoService.stopWatching,
    handleExitVideo: () => VideoService.exitVideo(),
    handleJoinVideo: () => VideoService.joinVideo(),
    handleShareScreen: onFail => shareScreen(onFail),
    handleUnshareScreen: () => unshareScreen(),
    isVideoBroadcasting: isVideoBroadcasting(),
    screenSharingCheck: getFromUserSettings('bbb_enable_screen_sharing', Meteor.settings.public.kurento.enableScreensharing),
    enableVideo: getFromUserSettings('bbb_enable_video', Meteor.settings.public.kurento.enableVideo),
    isLayoutSwapped: getSwapLayout() && shouldEnableSwapLayout(),
    toggleSwapLayout: MediaService.toggleSwapLayout,
    handleTakePresenter: Service.takePresenterRole,
    currentSlidHasContent: PresentationService.currentSlidHasContent(),
    parseCurrentSlideContent: PresentationService.parseCurrentSlideContent,
    isSharingVideo: Service.isSharingVideo(),
    screenShareEndAlert,
    screenshareDataSavingSetting: dataSavingSetting(),
    isCaptionsAvailable: CaptionsService.isCaptionsAvailable(),
    isMeteorConnected: Meteor.status().connected,
    isPollingEnabled: POLLING_ENABLED,
    isThereCurrentPresentation: !!Presentations.findOne(
      { meetingId: Auth.meetingID, current: true },
      { fields: {} },
    ),
    allowExternalVideo: Meteor.settings.public.externalVideoPlayer.enabled,
    isMeetingMuted: isMeetingMuteOnStart(),
    toggleMuteAllUsers,
    isExpanded,
    currentUserId: Auth.userID,
    hasUnreadMessages,
  };
})(injectIntl(ActionsBarContainer));
