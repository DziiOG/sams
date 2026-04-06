import amqp, { type ChannelModel, type ConfirmChannel } from 'amqplib';

export class RabbitMqConnectionManager {
  private connection?: ChannelModel;
  private connectionPromise?: Promise<ChannelModel>;

  public constructor(private readonly connectionUri: string) {
    if (!connectionUri) {
      throw new Error('RabbitMQ connection URI is required');
    }
  }

  public async createChannel(): Promise<ConfirmChannel> {
    const connection = await this.getConnection();

    return connection.createConfirmChannel();
  }

  public async close(): Promise<void> {
    const activeConnection = this.connection;

    this.connection = undefined;
    this.connectionPromise = undefined;

    if (activeConnection) {
      await activeConnection.close();
    }
  }

  private async getConnection(): Promise<ChannelModel> {
    if (this.connection) {
      return this.connection;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = amqp.connect(this.connectionUri).then((connection) => {
        connection.on('close', () => {
          this.connection = undefined;
          this.connectionPromise = undefined;
        });
        connection.on('error', () => {
          this.connection = undefined;
          this.connectionPromise = undefined;
        });
        this.connection = connection;

        return connection;
      });
    }

    return this.connectionPromise;
  }
}
