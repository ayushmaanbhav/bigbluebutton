import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withModalMounter } from '/imports/ui/components/modal/service';
import withShortcutHelper from '/imports/ui/components/shortcut-help/service';
import getFromUserSettings from '/imports/ui/services/users-settings';
import { injectIntl } from 'react-intl';
import { styles } from './styles.scss';
import RecordingIndicator from './recording-indicator/container';
import TalkingIndicatorContainer from '/imports/ui/components/nav-bar/talking-indicator/container';
import SettingsDropdownContainer from './settings-dropdown/container';


const propTypes = {
  presentationTitle: PropTypes.string,
};

const defaultProps = {
  presentationTitle: 'Default Room Title',
};

class NavBar extends PureComponent {
  componentDidMount() {
    const {
      processOutsideToggleRecording,
      connectRecordingObserver,
    } = this.props;

    if (Meteor.settings.public.allowOutsideCommands.toggleRecording
      || getFromUserSettings('bbb_outside_toggle_recording', false)) {
      connectRecordingObserver();
      window.addEventListener('message', processOutsideToggleRecording);
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const {
      mountModal,
      presentationTitle,
      amIModerator,
    } = this.props;


    return (
      <div className={styles.navbar}>
        <div className={styles.top}>
          <div className={styles.center}>
            <h1 className={styles.presentationTitle}>{presentationTitle}</h1>

            <RecordingIndicator
              mountModal={mountModal}
              amIModerator={amIModerator}
            />
          </div>
          <div className={styles.right}>
            <SettingsDropdownContainer amIModerator={amIModerator} />
          </div>
        </div>
        <div className={styles.bottom}>
          <TalkingIndicatorContainer amIModerator={amIModerator} />
        </div>
      </div>
    );
  }
}

NavBar.propTypes = propTypes;
NavBar.defaultProps = defaultProps;
export default withShortcutHelper(withModalMounter(injectIntl(NavBar)), 'toggleUserList');
