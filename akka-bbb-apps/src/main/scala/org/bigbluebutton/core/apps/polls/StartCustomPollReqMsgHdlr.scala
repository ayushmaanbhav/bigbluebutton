package org.bigbluebutton.core.apps.polls

import org.bigbluebutton.common2.domain.{CustomPoll, CustomPollOutVO}
import org.bigbluebutton.common2.msgs._
import org.bigbluebutton.core.bus.MessageBus
import org.bigbluebutton.core.domain.MeetingState2x
import org.bigbluebutton.core.models.Polls
import org.bigbluebutton.core.running.LiveMeeting
import org.bigbluebutton.core.apps.{ PermissionCheck, RightsManagementTrait }

trait StartCustomPollReqMsgHdlr extends RightsManagementTrait {
  this: PollApp2x =>

  def handle(msg: StartCustomPollReqMsg, state: MeetingState2x, liveMeeting: LiveMeeting, bus: MessageBus): Unit = {
    def broadcastEvent(msg: StartCustomPollReqMsg, poll: CustomPollOutVO): Unit = {
      val routing = Routing.addMsgToClientRouting(MessageTypes.BROADCAST_TO_MEETING, liveMeeting.props.meetingProp.intId, msg.header.userId)
      val envelope = BbbCoreEnvelope(CustomPollStartedEvtMsg.NAME, routing)
      val header = BbbClientMsgHeader(CustomPollStartedEvtMsg.NAME, liveMeeting.props.meetingProp.intId, msg.header.userId)

      val body = CustomPollStartedEvtMsgBody(msg.header.userId, poll.id, poll)
      val event = CustomPollStartedEvtMsg(header, body)
      val msgEvent = BbbCommonEnvCoreMsg(envelope, event)
      bus.outGW.send(msgEvent)
    }

    if (permissionFailed(PermissionCheck.GUEST_LEVEL, PermissionCheck.PRESENTER_LEVEL, liveMeeting.users2x, msg.header.userId)) {
      val meetingId = liveMeeting.props.meetingProp.intId
      val reason = "No permission to start custom poll."
      PermissionCheck.ejectUserForFailedPermission(meetingId, msg.header.userId, reason, bus.outGW, liveMeeting)
    } else {
      for {
        pvo <- Polls.handleStartCustomPollReqMsg(state, msg.header.userId, msg.body.pollId, msg.body.pollType, msg.body.poll, liveMeeting)
      } yield {
        broadcastEvent(msg, pvo)
      }
    }
  }
}
