import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '/imports/ui/components/button/component';
import injectWbResizeEvent from '/imports/ui/components/presentation/resize-wrapper/component';
import { defineMessages, injectIntl } from 'react-intl';
import cx from 'classnames';
import { Statistic } from 'antd';
import { styles } from './styles.scss';
import LiveResult from '../poll/live-result/component';
import { notify } from '../../services/notification';

const { Countdown } = Statistic;

const intlMessages = defineMessages({
  pollingTitleLabel: {
    id: 'app.polling.pollingTitle',
  },
  pollAnswerLabel: {
    id: 'app.polling.pollAnswerLabel',
  },
  pollAnswerDesc: {
    id: 'app.polling.pollAnswerDesc',
  },
});

class Polling extends Component {
  constructor(props) {
    super(props);
    const { poll } = this.props;
    const answers = {};
    if (poll.questions) {
      poll.questions.forEach((question) => {
        answers[question.id] = [];
      });
    } else {
      answers[poll.pollId] = [];
    }
    this.state = { pollAnswers: answers };
    this.play = this.play.bind(this);
    this.onFinishAlarm = this.onFinishAlarm.bind(this);
  }

  componentDidMount() {
    this.play();
  }

  play() {
    this.alert = new Audio(`${Meteor.settings.public.app.cdn + Meteor.settings.public.app.basename}/resources/sounds/Poll.mp3`);
    this.alert.play();
  }

  handleVote(question, pollAnswer) {
    this.setState(({ pollAnswers }) => {
      if (question.multiResponse) {
        if (!pollAnswers[question.id].includes(pollAnswer.id)) {
          pollAnswers[question.id].push(pollAnswer.id);
        } else {
          // eslint-disable-next-line no-param-reassign
          pollAnswers[question.id] = pollAnswers[question.id].filter(pa => pa !== pollAnswer.id);
        }
      } else {
        // eslint-disable-next-line no-param-reassign
        pollAnswers[question.id] = [pollAnswer.id];
      }
      return pollAnswers;
    });
    const { pollAnswers } = this.state;
  }

  onFinishAlarm() {
    notify('The quiz time is over, please submit your answer!', 'info', 'desktop');
  }

  render() {
    const {
      isMeteorConnected,
      intl,
      poll,
      submitAnswers,
    } = this.props;

    const { pollAnswers } = this.state;

    if (!poll) {
      return null;
    }
    const { stackOptions, questions, pollId } = poll;
    let allQuestions = [];
    if (questions) {
      allQuestions = questions;
    } else {
      allQuestions = [{
        id: pollId,
        answers: poll.answers,
        question: poll.question,
        multiResponse: poll.multiResponse,
      }];
    }

    const pollAnswerStyles = {
      [styles.pollingAnswers]: true,
      // [styles.removeColumns]: questions.length === 1,
      [styles.stacked]: stackOptions,
    };

    const deadline = Date.now() + 1000 * 60 * poll.timeLimit;

    return (
      <div className={styles.overlay}>
        <div
          className={cx({
            [styles.pollingContainer]: true,
            [styles.autoWidth]: stackOptions,
          })}
          role="alert"
        >
          <Countdown format="mm:ss" title="Quiz ending in" value={deadline} onFinish={this.onFinishAlarm} />
          {
            allQuestions.map((question, index) => (<>
              <div className={styles.pollingTitle}>
                {<strong>{`Q${index + 1}: `}</strong>}
                {question.question || intl.formatMessage(intlMessages.pollingTitleLabel)}
              </div>
              <div className={cx(pollAnswerStyles)}>
                {question.answers.map((pollAnswer, aIndex) => {
                  const label = `${LiveResult.getAnswerIndexString(aIndex)} ${pollAnswer.key}`;

                  return (
                    <div
                      key={pollAnswer.id}
                      className={styles.pollButtonWrapper}
                    >
                      <Button
                        disabled={!isMeteorConnected}
                        className={styles.pollingButton}
                        color={pollAnswers[question.id].includes(pollAnswer.id) ? 'primary' : 'default'}
                        size="md"
                        label={label}
                        key={pollAnswer.key}
                        onClick={() => this.handleVote(question, pollAnswer)}
                        tooltipLabel={label}
                        aria-labelledby={`pollAnswerLabel ${pollAnswer.id}`}
                        aria-describedby={`pollAnswerDesc ${label}`}
                      />
                      <div
                        className={styles.hidden}
                        id={`pollAnswerLabel${pollAnswer.key}`}
                      >
                        {intl.formatMessage(intlMessages.pollAnswerLabel, { 0: label })}
                      </div>
                      <div
                        className={styles.hidden}
                        id={`pollAnswerDesc${pollAnswer.key}`}
                      >
                        {intl.formatMessage(intlMessages.pollAnswerDesc, { 0: label })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>))}
          <Button
            disabled={!isMeteorConnected}
            style={{ textAlign: 'center', marginBottom: '20px' }}
            className={styles.pollingButton}
            color="primary"
            size="md"
            label="Submit"
            onClick={() => submitAnswers(pollId, pollAnswers)}
            aria-labelledby="submit answers"
            aria-describedby="submit answers"
          />
        </div>
      </div>);
  }
}

export default injectIntl(injectWbResizeEvent(Polling));

Polling.propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  submitAnswers: PropTypes.func.isRequired,
  poll: PropTypes.shape({
    pollId: PropTypes.string.isRequired,
    question: PropTypes.string,
    answers: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      key: PropTypes.string.isRequired,
    }).isRequired).isRequired,
  }).isRequired,
};
