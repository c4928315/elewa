import { HandlerTools } from '@iote/cqrs';

import { Message, MessageDirection } from '@app/model/convs-mgr/conversations/messages';

import { BotDataService } from './data-service-abstract.class';

/**
 * Contains all the required database flow methods for the messages collection
 */
export class MessagesDataService extends BotDataService<Message> {
  private _docPath: string;
  private _msg: Message;
  tools: HandlerTools;

  constructor(tools: HandlerTools) 
  {
    super(tools)
    this.tools = tools;
  }

  /**
   * Stores the standardized message format to the database.
   * 
   * Assigns an id to the message if it is not yet set before this point
   */
  async saveMessage(msg: Message, orgId: string, endUserId: string): Promise<Message> {
    this._docPath = `orgs/${orgId}/end-users/${endUserId}/messages`

    // If the message id is not set, we set it here
    !msg.id && (msg.id = Date.now().toString());

    // Create the message document with the timestamp as the id
    const savedMessage = await this.createDocument(msg, this._docPath, msg.id)

    this.tools.Logger.log(()=>`Message with id: ${savedMessage.id} saved to ${this._docPath}`);

    return savedMessage;
  }

  async getLatestMessage(endUserId: string, orgId: string): Promise<Message> {
    this._docPath = `orgs/${orgId}/end-users/${endUserId}/messages`

    const latestMessage = await this.getLatestDocument(this._docPath);

    return latestMessage[0];
  }

  async getLatestUserMessage(endUserId: string, orgId: string): Promise<Message>  {
    this._docPath = `orgs/${orgId}/end-users/${endUserId}/messages`

    const latestMessage = await this.getDocuments(this._docPath);

    // Filter out the messages that are not from the user
    const userMessages = latestMessage.filter(msg => 
       (msg.direction === MessageDirection.FROM_ENDUSER_TO_AGENT ||
        msg.direction === MessageDirection.FROM_END_USER_TO_CHATBOT));

    if(userMessages.length > 0) {
      // Return the latest message using createdOn timestamp
      const latestUserMessage = userMessages.reduce((prev, current) => {
        return (prev.createdOn > current.createdOn) ? prev : current
      });
  
      return latestUserMessage;
    } else {
      return null;
    }
  }
}
