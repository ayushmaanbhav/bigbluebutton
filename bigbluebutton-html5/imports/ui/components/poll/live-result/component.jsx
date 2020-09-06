import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import Button from '/imports/ui/components/button/component';
import { styles } from './styles';
import Service from './service';

const intlMessages = defineMessages({
  usersTitle: {
    id: 'app.poll.liveResult.usersTitle',
    description: 'heading label for poll users',
  },
  responsesTitle: {
    id: 'app.poll.liveResult.responsesTitle',
    description: 'heading label for poll responses',
  },
  publishLabel: {
    id: 'app.poll.publishLabel',
    description: 'label for the publish button',
  },
  backLabel: {
    id: 'app.poll.backLabel',
    description: 'label for the return to poll options button',
  },
  downloadLabel: {
    id: 'app.poll.downloadLabel',
    description: 'label for downloading results of Quiz',
  },
  cancelLabel: {
    id: 'app.poll.cancelLabel',
    description: 'Cancel button label',
  },
  finishLabel: {
    id: 'app.poll.finishLabel',
    description: 'Finish button label',
  },
  doneLabel: {
    id: 'app.createBreakoutRoom.doneLabel',
    description: 'label shown when all users have responded',
  },
  waitingLabel: {
    id: 'app.poll.waitingLabel',
    description: 'label shown while waiting for responses',
  },
});

const getResponseString = (obj) => {
  const { children } = obj.props;
  if (typeof children !== 'string') {
    return getResponseString(children[1]);
  }

  return children;
};

class LiveResult extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      userAnswers: null,
      pollStats: null,
    };
  }

  static getUserAnswers(responses, users, answers) {
    const userAnswers = responses
      ? [...users, ...responses.map(u => u.userId)]
      : [...users];

    return userAnswers.map(id => Service.getUser(id))
      .filter(user => user.connectionStatus === 'online')
      .map((user) => {
        let answer = '';

        if (responses) {
          const response = responses.find(r => r.userId === user.userId);
          if (response) answer = answers[response.answerId].key;
        }

        return {
          name: user.name,
          userId: user.extId,
          answer,
        };
      })
      .sort(Service.sortUsers);
  }

  static getDerivedStateFromProps(nextProps) {
    const {
      currentPoll, intl, pollAnswerIds,
    } = nextProps;

    if (!currentPoll) return null;

    const {
      answers, responses, users, numRespondents,
    } = currentPoll;

    const userAnswers = LiveResult.getUserAnswers(responses, users, answers)
      .reduce((acc, user) => {
        const formattedMessageIndex = user.answer.toLowerCase();
        return ([
          ...acc,
          (
            <tr key={_.uniqueId('stats-')}>
              <td className={styles.resultLeft}>{user.name}</td>
              <td className={styles.resultRight}>
                {
                  pollAnswerIds[formattedMessageIndex]
                    ? intl.formatMessage(pollAnswerIds[formattedMessageIndex])
                    : user.answer
                }
              </td>
            </tr>
          ),
        ]);
      }, []);

    const pollStats = [];

    answers.map((obj) => {
      const formattedMessageIndex = obj.key.toLowerCase();
      const pct = Math.round(obj.numVotes / numRespondents * 100);
      const pctFotmatted = `${Number.isNaN(pct) ? 0 : pct}%`;

      const calculatedWidth = {
        width: pctFotmatted,
      };

      return pollStats.push(
        <div className={styles.main} key={_.uniqueId('stats-')}>
          <div className={styles.left}>
            {
              pollAnswerIds[formattedMessageIndex]
                ? intl.formatMessage(pollAnswerIds[formattedMessageIndex])
                : obj.key
            }
          </div>
          <div className={styles.center}>
            <div className={styles.barShade} style={calculatedWidth} />
            <div className={styles.barVal}>{obj.numVotes || 0}</div>
          </div>
          <div className={styles.right}>
            {pctFotmatted}
          </div>
        </div>,
      );
    });

    return {
      userAnswers,
      pollStats,
    };
  }


  render() {
    const {
      isMeteorConnected,
      intl,
      stopPoll,
      handleBackClick,
      currentPoll,
    } = this.props;

    const { userAnswers, pollStats } = this.state;

    let waiting;
    let userCount = 0;
    let respondedCount = 0;

    if (userAnswers) {
      userCount = userAnswers.length;
      userAnswers.map((user) => {
        const response = getResponseString(user);
        if (response === '') return user;
        respondedCount += 1;
        return user;
      });

      waiting = respondedCount !== userAnswers.length && currentPoll;
    }

    let question = '';
    if (currentPoll) {
      question = currentPoll.question ? currentPoll.question : '';
    }

    function downloadResults() {
      if (!currentPoll) {
        return;
      }
      const {
        answers, responses, users,
      } = currentPoll;
      let csv = `Question:, ${question}\nAnswers:,${answers.map(x => x.key)
        .join(',')}\nStudent, Student ID, Response\n`;
      const allResponses = LiveResult.getUserAnswers(responses, users, answers);
      allResponses.forEach((response) => {
        csv += `${[response.name, response.userId, response.answer].join(',')}\n`;
      });
      const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const date = new Date();
      const filename = `${`${date.toLocaleDateString('en-US', { day: 'numeric' })}-${date.toLocaleDateString('en-US', { month: 'short' })}-${date.toLocaleDateString('en-US', { year: 'numeric' })}`}.csv`;
      if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
      } else {
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
      }
    }

    return (
      <div>
        <div className={styles.stats}>
          {question ? <div className={styles.textCenter}><b>{question}</b></div> : null}
          {question ? <br /> : null}
          <div className={styles.statsSpan}>
            {pollStats}
          </div>
        </div>
        <div className={styles.status}>
          {waiting
            ? (
              <span>
                {`${intl.formatMessage(intlMessages.waitingLabel, {
                  0: respondedCount,
                  1: userCount,
                })} `}
              </span>
            )
            : <span>{intl.formatMessage(intlMessages.doneLabel)}</span>}
          {waiting
            ? <span className={styles.connectingAnimation} /> : null}
        </div>
        {currentPoll
          ? (<>
            <div className={styles.alignCenter}>
              <Button
                disabled={!isMeteorConnected}
                onClick={() => {
                  Service.publishPoll();
                  stopPoll();
                }}
                label={intl.formatMessage(intlMessages.publishLabel)}
                color={waiting ? 'primary' : 'success'}
                className={styles.btn}
              />
              <Button
                disabled={!isMeteorConnected}
                onClick={() => {
                  downloadResults();
                }}
                icon="download"
                label={intl.formatMessage(intlMessages.downloadLabel)}
                color={waiting ? 'primary' : 'success'}
                className={styles.btn}
              />
            </div>
            <div className={styles.alignCenter}>
              <Button
                disabled={!isMeteorConnected}
                onClick={() => {
                  stopPoll();
                  handleBackClick();
                }}
                label={waiting ? intl.formatMessage(intlMessages.cancelLabel) : intl.formatMessage(intlMessages.finishLabel)}
                color="danger"
                className={styles.btn}
              />
            </div>
            </>
          ) : (
            <Button
              disabled={!isMeteorConnected}
              onClick={() => {
                handleBackClick();
              }}
              label={intl.formatMessage(intlMessages.backLabel)}
              color="primary"
              className={styles.btn}
            />
          )
        }
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <th className={styles.theading}>{intl.formatMessage(intlMessages.usersTitle)}</th>
              <th className={styles.theading}>{intl.formatMessage(intlMessages.responsesTitle)}</th>
            </tr>
            {userAnswers}
          </tbody>
        </table>
      </div>
    );
  }
}

export default injectIntl(LiveResult);

LiveResult.defaultProps = { currentPoll: null };

LiveResult.propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  currentPoll: PropTypes.oneOfType([
    PropTypes.arrayOf(Object),
    PropTypes.shape({
      question: PropTypes.string,
      answers: PropTypes.arrayOf(PropTypes.object),
      users: PropTypes.arrayOf(PropTypes.string),
    }),
  ]),
  stopPoll: PropTypes.func.isRequired,
  handleBackClick: PropTypes.func.isRequired,
};
