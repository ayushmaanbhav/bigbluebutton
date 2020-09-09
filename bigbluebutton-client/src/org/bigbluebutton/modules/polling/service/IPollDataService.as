package org.bigbluebutton.modules.polling.service
{

  public interface IPollDataService
  {
      
    function startCustomPoll(pollId: String, pollType: String, poll:Array):void;
	
    function startPoll(pollId:String, pollType: String):void;
    
    function stopPoll(pollID:String):void;
    
    function votePoll(pollId:String, questionId: Number, answerId:Number):void;
    
    function showPollResult(pollId:String):void;
  }
}