import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { RightOutlined, TeamOutlined } from '@ant-design/icons';
import { defineMessages, injectIntl } from 'react-intl';
import { Session } from 'meteor/session';
import { Badge, Button } from 'antd';
import { styles } from './styles.scss';
import DesktopShare from './desktop-share/component';
import ActionsDropdown from './actions-dropdown/component';
import QuickPollDropdown from './quick-poll-dropdown/component';
import AudioControlsContainer from '../audio/audio-controls/container';
import JoinVideoOptionsContainer from '../video-provider/video-button/container';
import CaptionsButtonContainer from '/imports/ui/components/actions-bar/captions/container';
import PresentationOptionsContainer from './presentation-options/component';
import withShortcutHelper from '../shortcut-help/service';
import { withModalMounter } from '../modal/service';

const intlMessages = defineMessages({
  toggleUserListLabel: {
    id: 'app.navBar.userListToggleBtnLabel',
    description: 'Toggle button label',
  },
  toggleUserListAria: {
    id: 'app.navBar.toggleUserList.ariaLabel',
    description: 'description of the lists inside the userlist',
  },
  newMessages: {
    id: 'app.navBar.toggleUserList.newMessages',
    description: 'label for toggleUserList btn when showing red notification',
  },
});

const propTypes = {
  presentationTitle: PropTypes.string,
  hasUnreadMessages: PropTypes.bool,
  shortcuts: PropTypes.string,
};


const defaultProps = {
  presentationTitle: 'Default Room Title',
  hasUnreadMessages: false,
  shortcuts: '',
};


class ActionsBar extends PureComponent {
  static handleToggleUserList() {
    Session.set(
      'openPanel',
      Session.get('openPanel') !== ''
        ? ''
        : 'userlist',
    );
    Session.set('idChatOpen', '');
  }

  render() {
    const {
      amIPresenter,
      handleExitVideo,
      handleJoinVideo,
      handleShareScreen,
      handleUnshareScreen,
      isVideoBroadcasting,
      amIModerator,
      screenSharingCheck,
      enableVideo,
      isLayoutSwapped,
      toggleSwapLayout,
      handleTakePresenter,
      intl,
      currentSlidHasContent,
      parseCurrentSlideContent,
      isSharingVideo,
      screenShareEndAlert,
      stopExternalVideoShare,
      screenshareDataSavingSetting,
      isCaptionsAvailable,
      isMeteorConnected,
      isPollingEnabled,
      isThereCurrentPresentation,
      allowExternalVideo,
      isMeetingMuted,
      toggleMuteAllUsersExceptPresenter,
      isExpanded,
      shortcuts: TOGGLE_USERLIST_AK,
      hasUnreadMessages,
    } = this.props;

    const actionBarClasses = {};

    actionBarClasses[styles.centerWithActions] = amIPresenter;
    actionBarClasses[styles.right] = true;
    actionBarClasses[styles.mobileLayoutSwapped] = isLayoutSwapped && amIPresenter;

    let ariaLabel = intl.formatMessage(intlMessages.toggleUserListAria);
    ariaLabel += hasUnreadMessages ? (` ${intl.formatMessage(intlMessages.newMessages)}`) : '';

    return (
      <div className={styles.actionsbar}>
        <div className={styles.left}>
          <ActionsDropdown {...{
            amIPresenter,
            amIModerator,
            isPollingEnabled,
            allowExternalVideo,
            handleTakePresenter,
            intl,
            isSharingVideo,
            stopExternalVideoShare,
            isMeteorConnected,
            isMeetingMuted,
            toggleMuteAllUsersExceptPresenter,
          }}
          />
          {isPollingEnabled
            ? (
              <QuickPollDropdown
                {...{
                  currentSlidHasContent,
                  intl,
                  amIPresenter,
                  parseCurrentSlideContent,
                }}
              />
            ) : null
          }
          {isCaptionsAvailable
            ? (
              <CaptionsButtonContainer {...{ intl }} />
            )
            : null
          }
        </div>
        <div className={cx(actionBarClasses)}>
          <AudioControlsContainer className={styles.hiddenControls} />
          {enableVideo && amIModerator
            ? (
              <JoinVideoOptionsContainer
                handleJoinVideo={handleJoinVideo}
                handleCloseVideo={handleExitVideo}
                className={styles.hiddenControls}
              />
            )
            : null}
          <DesktopShare
            className={styles.hiddenControls}
            {...{
              handleShareScreen,
              handleUnshareScreen,
              isVideoBroadcasting,
              amIPresenter,
              screenSharingCheck,
              screenShareEndAlert,
              isMeteorConnected,
              screenshareDataSavingSetting,
            }}
          />
          <Badge dot={hasUnreadMessages}>
            <Button
              className={styles.antBtnWithShadow}
              data-test="userListToggleButton"
              label={intl.formatMessage(intlMessages.toggleUserListLabel)}
              onClick={ActionsBar.handleToggleUserList}
              type="primary"
              size="large"
              aria-label={ariaLabel}
              shape="circle"
              aria-expanded={isExpanded}
              accessKey={TOGGLE_USERLIST_AK}
              icon={isExpanded ? <RightOutlined /> : <TeamOutlined />}
            />
          </Badge>
          {isLayoutSwapped
            ? (
              <PresentationOptionsContainer
                toggleSwapLayout={toggleSwapLayout}
                isThereCurrentPresentation={isThereCurrentPresentation}
              />
            )
            : null
          }
        </div>
      </div>
    );
  }
}

ActionsBar.propTypes = propTypes;
ActionsBar.defaultProps = defaultProps;
export default withShortcutHelper(withModalMounter(injectIntl(ActionsBar)), 'toggleUserList');
