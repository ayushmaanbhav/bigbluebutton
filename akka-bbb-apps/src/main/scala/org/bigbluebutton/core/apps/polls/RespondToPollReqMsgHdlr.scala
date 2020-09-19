package org.bigbluebutton.core.apps.polls

import org.bigbluebutton.common2.domain.{SimplePollResultOutVO,  SimpleAnswerOutVO}
import org.bigbluebutton.common2.msgs._
import org.bigbluebutton.core.bus.MessageBus
import org.bigbluebutton.core.models.Polls
import org.bigbluebutton.core.running.{ LiveMeeting }
import org.bigbluebutton.core.models.Users2x

trait RespondToPollReqMsgHdlr {
  this: PollApp2x =>

  def handle(msg: RespondToPollReqMsg, liveMeeting: LiveMeeting, bus: MessageBus): Unit = {
    log.debug("Received RespondToPollReqMsg {}", msg)

    def broadcastPollUpdatedEvent(msg: RespondToPollReqMsg, pollId: String, poll: Map[String, Array[Int]]): Unit = {
      val routing = Routing.addMsgToClientRouting(MessageTypes.BROADCAST_TO_MEETING, liveMeeting.props.meetingProp.intId, msg.header.userId)
      val envelope = BbbCoreEnvelope(PollUpdatedEvtMsg.NAME, routing)
      val header = BbbClientMsgHeader(PollUpdatedEvtMsg.NAME, liveMeeting.props.meetingProp.intId, msg.header.userId)

      val body = PollUpdatedEvtMsgBody(pollId, poll)
      val event = PollUpdatedEvtMsg(header, body)
      val msgEvent = BbbCommonEnvCoreMsg(envelope, event)
      bus.outGW.send(msgEvent)
    }

    def broadcastUserRespondedToPollRecordMsg(msg: RespondToPollReqMsg, pollId: String, answersMap: Map[String, Array[Int]]): Unit = {
      val routing = Routing.addMsgToClientRouting(MessageTypes.BROADCAST_TO_MEETING, liveMeeting.props.meetingProp.intId, msg.header.userId)
      val envelope = BbbCoreEnvelope(UserRespondedToPollRecordMsg.NAME, routing)
      val header = BbbClientMsgHeader(UserRespondedToPollRecordMsg.NAME, liveMeeting.props.meetingProp.intId, msg.header.userId)

      val body = UserRespondedToPollRecordMsgBody(pollId, answersMap)
      val event = UserRespondedToPollRecordMsg(header, body)
      val msgEvent = BbbCommonEnvCoreMsg(envelope, event)
      bus.outGW.send(msgEvent)
    }

    def broadcastUserRespondedToPollRespMsg(msg: RespondToPollReqMsg, pollId: String, answersMap: Map[String, Array[Int]], sendToId: String): Unit = {
      val routing = Routing.addMsgToClientRouting(MessageTypes.DIRECT, liveMeeting.props.meetingProp.intId, sendToId)
      val envelope = BbbCoreEnvelope(UserRespondedToPollRespMsg.NAME, routing)
      val header = BbbClientMsgHeader(UserRespondedToPollRespMsg.NAME, liveMeeting.props.meetingProp.intId, sendToId)

      val body = UserRespondedToPollRespMsgBody(pollId, msg.header.userId, answersMap)
      val event = UserRespondedToPollRespMsg(header, body)
      val msgEvent = BbbCommonEnvCoreMsg(envelope, event)
      bus.outGW.send(msgEvent)
    }

    for {
      (pollId: String, updatedPoll: Map[String, Array[Int]]) <- Polls.handleRespondToPollReqMsg(msg.header.userId, msg.body.pollId,
        msg.body.answersMap, liveMeeting)
    } yield {
      broadcastPollUpdatedEvent(msg, pollId, updatedPoll)
      broadcastUserRespondedToPollRecordMsg(msg, pollId, msg.body.answersMap)

      for {
        presenter <- Users2x.findPresenter(liveMeeting.users2x)
      } yield {
        broadcastUserRespondedToPollRespMsg(msg, pollId, msg.body.answersMap, presenter.intId)
      }
    }
  }
}
