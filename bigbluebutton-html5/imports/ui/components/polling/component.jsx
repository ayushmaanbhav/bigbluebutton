import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '/imports/ui/components/button/component';
import injectWbResizeEvent from '/imports/ui/components/presentation/resize-wrapper/component';
import { defineMessages, injectIntl } from 'react-intl';
import cx from 'classnames';
import { styles } from './styles.scss';

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
    console.log({
      pollAnswers,
      question,
      pollAnswer,
    });
  }

  render() {
    const {
      isMeteorConnected,
      intl,
      poll,
      submitAnswers,
      pollAnswerIds,
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

    console.log({
      allQuestions,
      poll,
      pollAnswers,
    });

    const pollAnswerStyles = {
      [styles.pollingAnswers]: true,
      // [styles.removeColumns]: questions.length === 1,
      [styles.stacked]: stackOptions,
    };

    return (
      <div className={styles.overlay}>

        <div
          className={cx({
            [styles.pollingContainer]: true,
            [styles.autoWidth]: stackOptions,
          })}
          role="alert"
        >
          {
            allQuestions.map(question => (<>
              <div className={styles.pollingTitle}>
                {question.question || intl.formatMessage(intlMessages.pollingTitleLabel)}
              </div>
              <div className={cx(pollAnswerStyles)}>
                {question.answers.map((pollAnswer) => {
                  const formattedMessageIndex = pollAnswer.key.toLowerCase();
                  let label = pollAnswer.key;
                  if (pollAnswerIds[formattedMessageIndex]) {
                    label = intl.formatMessage(pollAnswerIds[formattedMessageIndex]);
                  }

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
                        aria-labelledby={`pollAnswerLabel${pollAnswer.key}`}
                        aria-describedby={`pollAnswerDesc${pollAnswer.key}`}
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
