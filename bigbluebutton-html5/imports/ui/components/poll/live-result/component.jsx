import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import Button from '/imports/ui/components/button/component';
import { Collapse, Popconfirm, Statistic } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import { styles } from './styles';
import Service from './service';
import { notify } from '../../../services/notification';

const { Panel } = Collapse;
const { Countdown } = Statistic;

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

  static getAnswerIndexString(index) {
    return `${String.fromCharCode(index + 97).toUpperCase()}. `;
  }


  static getUserAnswers(responses, users) {
    const userAnswers = responses
      ? [...users, ...responses.map(u => u.userId)]
      : [...users];

    return userAnswers.map(id => Service.getUser(id))
      .filter(user => user.connectionStatus === 'online')
      .map((user) => {
        let answer = '';

        if (responses && responses.find(r => r.userId === user.userId)) {
          const { answersMap } = responses.find(r => r.userId === user.userId);
          if (answersMap) {
            Object.keys(answersMap)
              .forEach((qid, qindex) => {
                answer += `Q${qindex + 1}. ${answersMap[qid].sort()
                  .map(aIndex => LiveResult.getAnswerIndexString(aIndex)
                    .replace('.', '')).join(',')} `;
              });
          }
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
      currentPoll,
    } = nextProps;

    if (!currentPoll) return null;

    const {
      responses, users, responseTrack, answers,
    } = currentPoll;
    let { questions } = currentPoll;

    const userAnswers = LiveResult.getUserAnswers(responses, users)
      .reduce((acc, user) => ([
        ...acc,
        (
          <tr key={_.uniqueId('stats-')}>
            <td className={styles.resultLeft}>{user.name}</td>
            <td className={styles.resultRight}>
              {
                user.answer
              }
            </td>
          </tr>
        ),
      ]), []);

    const answerStats = [];

    if (!questions) {
      questions = [{ question: 'Quick quiz', answers }];
    }

    responseTrack.forEach((response, index) => {
      answerStats.push(
        <Panel
          header={<><strong>{`Q${index + 1}: `}</strong> {questions && questions[index].question}</>}
          key={`Q${index + 1}`}
          className="questionView"
        >
          <ul>
            {questions[index].answers.map((answer, aIndex) => (
              <li className={styles.answerItem} key={`ans${aIndex + 1}`}>
                <strong>{LiveResult.getAnswerIndexString(aIndex)}</strong>
                {answer.key}
              </li>
            ))}
          </ul>
          <ul className={styles.statsPoll}>
            {response.answers.map((obj, aindex) => {
              const pct = responses ? Math.round(obj.numVotes / responses.length * 100) : 0;
              const pctFotmatted = `${Number.isNaN(pct) ? 0 : pct}%`;

              const calculatedWidth = {
                width: pctFotmatted,
              };

              return (
                <div className={styles.main} key={_.uniqueId('stats-')}>
                  <div className={styles.left}>
                    {LiveResult.getAnswerIndexString(aindex)}
                  </div>
                  <div className={styles.center}>
                    <div className={styles.barShade} style={calculatedWidth} />
                    <div className={styles.barVal}>{obj.numVotes || 0}</div>
                  </div>
                  <div className={styles.right}>
                    {pctFotmatted}
                  </div>
                </div>
              );
            })}
          </ul>
        </Panel>,
      );
    });
    const pollStats = [
      <Collapse
        bordered={false}
        defaultActiveKey={['Q1']}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        className={styles.questionsCollapse}
      >
        {answerStats}
      </Collapse>];


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
      meetingName,
    } = this.props;

    const { userAnswers, pollStats } = this.state;

    let waiting;
    let userCount = 0;
    let respondedCount = 0;

    const deadline = Date.now() + 1000 * 60 * currentPoll.timeLimit;

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

    function downloadResults() {
      if (!currentPoll) {
        return;
      }
      const {
        answers, responses, users,
      } = currentPoll;

      let { questions } = currentPoll;
      if (!questions) {
        questions = [{ question: 'Quick quiz', answers }];
      }
      let csv = `${meetingName}, ${(new Date()).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })}`;
      const rollNumRex = /\[(.*)\]/g;
      questions.forEach((question, index) => {
        csv += `\nQuestion ${index + 1}:, ${question.question}\nAnswers:,${question.answers.map((x, aIndex) => LiveResult.getAnswerIndexString(aIndex) + x.key)
          .join(',')}\n`;
      });
      csv += '\nStudent, Student ID, Response\n';
      const allResponses = LiveResult.getUserAnswers(responses, users);
      allResponses.forEach((response) => {
        let { name } = response;
        let rollNumber = '';
        const rollNumberA = rollNumRex.exec(name);
        if (rollNumberA !== null) {
          rollNumber = rollNumberA[1].trim();
        }
        name = name.replace(`[${rollNumber}]`, '');
        csv += `${[name, rollNumber, response.answer].join(',')}\n`;
      });
      const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const filename = `${meetingName}-${(new Date()).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })}.csv`;
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

    function onFinishAlarm() {
      notify('The quiz time is over you can finish the quiz now!', 'info', 'desktop');
    }

    return (
      <div>
        <div className={styles.stats}>
          <Countdown format="mm:ss" title="Quiz ending in" value={deadline} onFinish={onFinishAlarm} />
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
              {/* <Button */}
              {/*  disabled={!isMeteorConnected} */}
              {/*  onClick={() => { */}
              {/*    Service.publishPoll(); */}
              {/*    stopPoll(); */}
              {/*  }} */}
              {/*  label={intl.formatMessage(intlMessages.publishLabel)} */}
              {/*  color={waiting ? 'primary' : 'success'} */}
              {/*  className={styles.btn} */}
              {/* /> */}
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
              <Popconfirm
                title={(
                  <p>
                    {'Finishing quiz will delete all the responses.'}
                    <br />
                    {'Do you want to finish this quiz?'}
                  </p>
)}
                onConfirm={() => {
                  stopPoll();
                }}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  disabled={!isMeteorConnected}
                  label={intl.formatMessage(intlMessages.finishLabel)}
                  color="danger"
                  className={styles.btn}
                />
              </Popconfirm>
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
  meetingName: PropTypes.string.isRequired,
};
